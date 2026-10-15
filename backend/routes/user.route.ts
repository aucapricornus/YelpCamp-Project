import { Router } from "express";
import {
  createUser,
  login,
  logout,
  getAuthenticatedUser,
} from "../controllers/user.controller";
import { validateUserInput } from "../validation/userInput";
import { authenticateUser } from "../utils/auth";

const router = Router();

router.post("/register", validateUserInput, createUser);
router.post("/login", login);
router.post("/logout", authenticateUser, logout);
router.get("/me", authenticateUser, getAuthenticatedUser);

export default router;
