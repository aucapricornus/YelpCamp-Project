import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import User from "../models/user.model";
import Campground from "../models/campground.model";

/** A cookie header that logs a request in as the given user. */
export const authCookie = (userId: unknown) =>
  `jwt=${jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET!)}`;

let counter = 0;

/** Creates a user directly in the database. */
export async function createTestUser(overrides: { username?: string; email?: string; password?: string } = {}) {
  counter++;
  const password = overrides.password ?? "password123";
  return User.create({
    username: overrides.username ?? `camper${counter}`,
    email: overrides.email ?? `camper${counter}@example.com`,
    password: await bcrypt.hash(password, 4), // low cost keeps tests fast
  });
}

/** Creates a campground directly in the database, skipping the geocoding call. */
export function createTestCampground(authorId: unknown, overrides: Record<string, unknown> = {}) {
  return Campground.create({
    title: "Pine Ridge",
    location: "Lake Tahoe, CA",
    description: "Tall trees and quiet nights",
    price: 25,
    images: [{ url: "https://utfs.io/f/pine.jpg", filename: "pine.jpg" }],
    geometry: { type: "Point", coordinates: [-120.0, 39.0] },
    author: authorId as mongoose.Types.ObjectId,
    ...overrides,
  });
}

/** A valid body for POST/PUT /api/campgrounds. */
export const validCampgroundBody = () => ({
  title: "Cedar Hollow",
  location: "Yosemite, CA",
  description: "Great views",
  price: 30,
  images: [{ url: "https://utfs.io/f/cedar.jpg", filename: "cedar.jpg" }],
});

/** Minimal fakes for calling Express middleware directly in unit tests. */
export function fakeReqRes(req: Partial<Request> = {}) {
  const res: any = {
    statusCode: 200,
    body: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  return {
    req: { body: {}, query: {}, params: {}, cookies: {}, ...req } as Request,
    res: res as Response & { statusCode: number; body: any },
    next,
    nextCalled: () => nextCalled,
  };
}
