import axios from 'axios';

export const getUser = async (username) => {
  const response = await axios.get(`https://api.github.com/users/${username}`);
  return response.data;
};

export const getUserRepos = async (username) => {
  const response = await axios.get(`https://api.github.com/users/${username}/repos`);
  return response.data;
};

export const getUserFollowers = async (username) => {
  const response = await axios.get(`https://api.github.com/users/${username}/followers`);
  return response.data;
};

export const getUserFollowing = async (username) => {
  const response = await axios.get(`https://api.github.com/users/${username}/following`);
  return response.data;
};