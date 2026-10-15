import { Request, Response } from "express";
import { User, IUser } from "../models/user.model";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError";
import { clearJWT, generateJWT } from "../utils/jwt";
import { FORBIDDEN_USERNAMES } from "../utils/forbiddenUsernames";

////////////////////////
// GET ALL USERS
////////////////////////

// export async function getUsers(req: Request, res: Response) {
//   const users = await User.find();
//   res.status(200).json(users);
// }

////////////////////////
// CREATE USER
////////////////////////

export async function createUser(req: Request, res: Response) {
  const { username, password, email } = req.body;
  const lowerUsername = username.toLowerCase();
  const isForbidden = FORBIDDEN_USERNAMES.some((word) =>
    lowerUsername.includes(word),
  );
  if (isForbidden) {
    throw new AppError({
      message: "This username is not allowed.",
      httpCode: 400,
    });
  }
  const usernameExists = await User.findOne({ username });
  const emailExists = await User.findOne({ email });
  if (usernameExists || emailExists) {
    throw new AppError({
      message: emailExists ? "Email already taken" : "Username already taken.",
      httpCode: 400,
    });
  }

  if (!username || !password || !email) {
    throw new AppError({ message: "Missing credentials", httpCode: 400 });
  }
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    username: username,
    password: hashedPassword,
    email: email,
  });
  await user.save();
  generateJWT(res, user._id as any);
  res.status(201).json({
    message: "User registered successfully",
    user: { _id: user._id, username: username, email: email },
  });
}

////////////////////////
// FIND USER BY ID
////////////////////////

// export async function getUserById(req: Request, res: Response) {
//   const user = await User.findById(req.params.id).select("_id username email");
//   if (!user) throw new AppError({ message: "User not found", httpCode: 404 });
//   res.status(200).json(user);
// }

////////////////////////
// MODIFY USER
////////////////////////

// export async function updateUser(req: Request, res: Response) {
//   const { id } = req.params;
//   const { username, password } = req.body;
//   const salt = await bcrypt.genSalt(12);
//   const hashedPassword = await bcrypt.hash(password, salt);
//   const user = await User.findByIdAndUpdate(
//     id,
//     { username: username, password: hashedPassword },
//     {
//       new: true,
//     },
//   );
//   if (!user) throw new AppError({ message: "User not found", httpCode: 404 });
//   res.status(200).json({ user });
// }

////////////////////////
// DELETE USER
////////////////////////

// export async function deleteUser(req: Request, res: Response) {
//   const user = await User.findByIdAndDelete(req.params.id);
//   if (!user) throw new AppError({ message: "User not found", httpCode: 404 });
//   res.status(200).json({ message: "User deleted successfully" });
// }

////////////////////////
// LOGIN USER
////////////////////////

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError({ message: "Missing credentials", httpCode: 400 });
  }

  const user: IUser | null = email.includes("@")
    ? await User.findOne({ email: email }).select("+password")
    : await User.findOne({ username: email }).select("+password");

  if (!user) throw new AppError({ message: "User not found", httpCode: 404 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError({ message: "Invalid password", httpCode: 400 });
  }
  generateJWT(res, user._id as any);
  res.status(200).json({
    message: "Login successful!",
    user: { _id: user._id, username: user.username, email: user.email },
  });
}

////////////////////////
// LOGOUT USER
////////////////////////

export async function logout(req: Request, res: Response) {
  clearJWT(res);
  res.status(200).json({ message: "Logout successful!" });
}

export async function getAuthenticatedUser(req: Request, res: Response) {
  const user = req.user;
  res.status(200).json({ user });
}
