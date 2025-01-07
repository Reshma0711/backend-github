import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()


const uri = process.env.MONGO_URL ;

export const dbConnect = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};
