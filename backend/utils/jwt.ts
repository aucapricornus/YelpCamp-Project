import { Response } from "express";
import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to backend/.env");
  }
  return secret;
};

const JWT_EXPIRES_IN = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // Milliseconds for Cookie (7 days)

const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Must be 'none' in production to allow Vercel -> Render communication
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  } as const;
};

const generateJWT = (res: Response, userId: string) => {
  const token = jwt.sign({ userId }, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.cookie("jwt", token, {
    ...getCookieOptions(),
    maxAge: COOKIE_MAX_AGE,
  });
};

const clearJWT = (res: Response) => {
  res.cookie("jwt", "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });
};

export { generateJWT, clearJWT };
