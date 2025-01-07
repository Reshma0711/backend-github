import User from "../models/User.js";
import {
  getUser as getGithubUser,
  getUserFollowers as getGithubFollowers,
  getUserFollowing as getGithubFollowing,
} from "../services/github.service.js";

// Fetch or create user data
export const getUserData = async (req, res) => {
  try {
    const { username } = req.params;

    let user = await User.findOne({ username, deletedAt: null });

    if (!user) {
      const githubUser = await getGithubUser(username);
      if (!githubUser) {
        return res.status(404).json({ error: "User not found on GitHub" });
      }

      const userInDB = await User.findOne({
        username: githubUser.login,
        githubId: githubUser.id,
      });

      if (userInDB) {
        await User.updateOne({ _id: userInDB._id }, { deletedAt: null });
        user = await User.findById(userInDB._id);
      } else {
        user = await User.create({
          username: githubUser.login,
          githubId: githubUser.id,
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
          bio: githubUser.bio,
          blog: githubUser.blog,
          location: githubUser.location,
          email: githubUser.email,
          twitterUsername: githubUser.twitter_username,
          publicRepos: githubUser.public_repos,
          publicGists: githubUser.public_gists,
          followers: githubUser.followers,
          following: githubUser.following,
          githubCreatedAt: githubUser.created_at,
          githubUpdatedAt: githubUser.updated_at,
        });
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user data
export const updateUser = async (req, res) => {
  try {
    const { username } = req.params;
    const { location, blog, bio } = req.body;

    const user = await User.findOneAndUpdate(
      { username, deletedAt: null },
      { location, blog, bio, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await User.updateOne(
      { username },
      { deletedAt: new Date() }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { username, location } = req.query;

    const query = { deletedAt: null };
    if (username) query.username = new RegExp(username, "i");
    if (location) query.location = new RegExp(location, "i");

    const users = await User.find(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user followers
export const getUserFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const followers = await getGithubFollowers(username);

    for (const follower of followers) {
      const userExists = await User.findOne({ username: follower.login });

      if (!userExists) {
        await User.create({
          username: follower.login,
          githubId: follower.id,
          avatarUrl: follower.avatar_url,
        });
      }
    }

    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find mutual followers
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

    res.json(mutualFollowers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
