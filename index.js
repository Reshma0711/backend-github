import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import userRoutes from "./routes/user.routes.js";
import { dbConnect } from "./config/database.js";
dbConnect()
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
