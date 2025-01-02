import mysql from "mysql2/promise";

import { dbConnect } from "../config/database.js";
import {
  getUser as getGithubUser,
  getUserFollowers as getGithubFollowers,
  getUserFollowing as getGithubFollowing,
} from "../services/github.service.js";

// Utility function to format ISO 8601 dates to MySQL DATETIME
const formatToMySQLDate = (isoDate) => {
  return new Date(isoDate).toISOString().slice(0, 19).replace("T", " ");
};

export const getUserData = async (req, res) => {
  try {
    const { username } = req.params;

    const [rows] = await dbConnect.query(
      "SELECT * FROM github_users WHERE username = ? AND deleted_at IS NULL LIMIT 1",
      [username]
    );
    let user = rows[0];

    if (!user) {
      // Fetch user details from GitHub API if not found in the database
      const githubUser = await getGithubUser(username);
      if (!githubUser) {
        return res.status(404).json({ error: "User not found on GitHub" });
      }

      console.log(githubUser);

      // Format the GitHub dates to MySQL-compatible format
      const githubCreatedAt = formatToMySQLDate(githubUser.created_at);
      const githubUpdatedAt = formatToMySQLDate(githubUser.updated_at);

      // Check if the user exists in the database but is marked as deleted
      const [userInDB] = await dbConnect.query(
        "SELECT * FROM github_users WHERE username = ? AND github_id = ? LIMIT 1",
        [githubUser.login, githubUser.id]
      );

      if (userInDB.length > 0) {
        // Reactivate the user if they exist but were marked as deleted
        await dbConnect.query(
          "UPDATE github_users SET deleted_at = NULL WHERE username = ? AND github_id = ?",
          [githubUser.login, githubUser.id]
        );

        const [newUserRows] = await dbConnect.query(
          "SELECT * FROM github_users WHERE username = ? AND github_id = ?",
          [githubUser.login, githubUser.id]
        );
        user = newUserRows[0];
      } else {
        // Insert the new user into the database
        const [result] = await dbConnect.query(
          `INSERT INTO github_users (username, github_id, name, avatar_url, bio, blog, location, email, 
            twitter_username, public_repos, public_gists, followers, following, github_created_at, github_updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            githubUser.login,
            githubUser.id,
            githubUser.name,
            githubUser.avatar_url,
            githubUser.bio,
            githubUser.blog,
            githubUser.location,
            githubUser.email,
            githubUser.twitter_username,
            githubUser.public_repos,
            githubUser.public_gists,
            githubUser.followers,
            githubUser.following,
            githubCreatedAt,
            githubUpdatedAt,
          ]
        );

        const [newUserRows] = await dbConnect.query(
          "SELECT * FROM github_users WHERE id = ?",
          [result.insertId]
        );
        user = newUserRows[0];
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { location, blog, bio } = req.body;

    await dbConnect.query(
      `UPDATE github_users SET location = ?, blog = ?, bio = ?, updated_at = NOW() 
       WHERE username = ? AND deleted_at IS NULL`,
      [location, blog, bio, username]
    );

    const [rows] = await dbConnect.query(
      "SELECT * FROM github_users WHERE username = ? AND deleted_at IS NULL LIMIT 1",
      [username]
    );

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;

    await dbConnect.query(
      "UPDATE github_users SET deleted_at = NOW() WHERE username = ?",
      [username]
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { username, location } = req.query;
    let query = "SELECT * FROM github_users WHERE deleted_at IS NULL";
    const params = [];

    if (username) {
      query += " AND username LIKE ?";
      params.push(`%${username}%`);
    }

    if (location) {
      query += " AND location LIKE ?";
      params.push(`%${location}%`);
    }

    const [rows] = await dbConnect.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const followers = await getGithubFollowers(username);

    for (const follower of followers) {
      const [rows] = await dbConnect.query(
        "SELECT id FROM github_users WHERE username = ? AND deleted_at IS NULL LIMIT 1",
        [follower.login]
      );

      if (!rows.length) {
        await dbConnect.query(
          "INSERT INTO github_users (username, github_id, avatar_url) VALUES (?, ?, ?)",
          [follower.login, follower.id, follower.avatar_url]
        );
      }
    }

    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const findMutualFollowers = async (req, res) => {
  try {
    const { username } = req.params;

    const [followers, following] = await Promise.all([
      getGithubFollowers(username),
      getGithubFollowing(username),
    ]);

    const mutualFollowers = followers.filter((follower) =>
      following.some((follow) => follow.id === follower.id)
    );

    const [userRows] = await dbConnect.query(
      "SELECT id FROM github_users WHERE username = ? LIMIT 1",
      [username]
    );
    const user = userRows[0];

    for (const friend of mutualFollowers) {
      const [friendRows] = await dbConnect.query(
        "SELECT id FROM github_users WHERE username = ? LIMIT 1",
        [friend.login]
      );
      const friendUser = friendRows[0];

      if (user && friendUser) {
        await dbConnect.query(
          "INSERT INTO user_friends (user_id, friend_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = user_id",
          [user.id, friendUser.id]
        );
      }
    }

    res.json(mutualFollowers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
