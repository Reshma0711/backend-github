import express from "express";
import { param, body, query } from "express-validator";
import { validate } from "../middleware/validate.js";
import {
  getUserData,
  updateUser,
  deleteUser,
  searchUsers,
  getUserFollowers,
  findMutualFollowers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get(
  "/users/:username",
  param("username").isString().trim().notEmpty(),
  validate,
  getUserData
);

router.get(
  "/users/:username/followers",
  param("username").isString().trim().notEmpty(),
  validate,
  getUserFollowers
);

router.get(
  "/users/:username/mutual-followers",
  param("username").isString().trim().notEmpty(),
  validate,
  findMutualFollowers
);

router.put(
  "/users/:username",
  [
    param("username").isString().trim().notEmpty(),
    body("location").optional().isString(),
    body("blog").optional().isString().isURL(),
    body("bio").optional().isString(),
  ],
  validate,
  updateUser
);

router.delete(
  "/users/:username",
  param("username").isString().trim().notEmpty(),
  validate,
  deleteUser
);

router.get(
  "/users",
  [
    query("username").optional().isString(),
    query("location").optional().isString(),
  ],
  validate,
  searchUsers
);

export default router;
