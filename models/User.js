import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    githubId: { type: Number, required: true },
    name: String,
    avatarUrl: String,
    bio: String,
    blog: String,
    location: String,
    email: String,
    twitterUsername: String,
    publicRepos: Number,
    publicGists: Number,
    followers: Number,
    following: Number,
    githubCreatedAt: Date,
    githubUpdatedAt: Date,
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("github_users", userSchema);
