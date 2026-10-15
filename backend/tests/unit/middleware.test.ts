import { describe, it, expect, spyOn, afterEach, mock } from "bun:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { mongoSanitize } from "../../utils/mongoSanitize";
import { errorHandler } from "../../utils/errorHandler";
import { authenticateUser } from "../../utils/auth";
import { isAuthor } from "../../utils/isAuthor";
import { AppError } from "../../utils/AppError";
import User from "../../models/user.model";
import Campground from "../../models/campground.model";
import { fakeReqRes } from "../helpers";

afterEach(() => {
  mock.restore(); // undo every spyOn so mocks don't leak between tests
});

describe("mongoSanitize", () => {
  it("removes $-operators and dotted keys, including nested ones", () => {
    const body = {
      email: { $gt: "" },
      "profile.admin": true,
      nested: { ok: 1, $where: "sleep(1000)" },
    };
    const { req, res, next, nextCalled } = fakeReqRes({ body });

    mongoSanitize(req, res, next);

    expect(req.body).toEqual({ email: {}, nested: { ok: 1 } });
    expect(nextCalled()).toBe(true);
  });

  it("leaves normal input untouched", () => {
    const body = { title: "Camp $5 a night", tags: ["a", "b"] };
    const { req, res, next } = fakeReqRes({ body: structuredClone(body) });
    mongoSanitize(req, res, next);
    expect(req.body).toEqual(body);
  });
});

describe("errorHandler", () => {
  const handle = (err: unknown) => {
    const { req, res, next } = fakeReqRes();
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    errorHandler(err, req, res, next);
    consoleSpy.mockRestore();
    return res;
  };

  it("uses the status and message of an AppError", () => {
    const res = handle(new AppError({ message: "Campground not found", httpCode: 404 }));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Campground not found" });
  });

  it("turns an invalid ObjectId (CastError) into a 400", () => {
    const res = handle({ name: "CastError", path: "_id", value: "abc" });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid value for _id: abc");
  });

  it("turns a duplicate key error into a 400 naming the field", () => {
    const res = handle({ code: 11000, keyValue: { email: "a@b.com" } });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("That email is already taken");
  });

  it("hides unexpected errors behind a 500", () => {
    const res = handle(new Error("boom"));
    expect(res.statusCode).toBe(500);
  });
});

describe("authenticateUser", () => {
  const userId = new mongoose.Types.ObjectId().toString();

  it("responds 401 when there is no cookie", async () => {
    const { req, res, next, nextCalled } = fakeReqRes();
    await authenticateUser(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Not authorized, no token");
    expect(nextCalled()).toBe(false);
  });

  it("responds 401 for a token signed with the wrong secret", async () => {
    const token = jwt.sign({ userId }, "not-the-real-secret");
    const { req, res, next } = fakeReqRes({ cookies: { jwt: token } });
    await authenticateUser(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid token");
  });

  it("responds 401 for an expired token", async () => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: -10 });
    const { req, res, next } = fakeReqRes({ cookies: { jwt: token } });
    await authenticateUser(req, res, next);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Token expired");
  });

  it("responds 401 when the user no longer exists", async () => {
    const findSpy = spyOn(User, "findById").mockResolvedValue(null as any);
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!);
    const { req, res, next } = fakeReqRes({ cookies: { jwt: token } });
    await authenticateUser(req, res, next);
    expect(res.statusCode).toBe(401);
    findSpy.mockRestore();
  });

  it("attaches the user and calls next() for a valid token", async () => {
    const user = { _id: userId, username: "daniel" };
    const findSpy = spyOn(User, "findById").mockResolvedValue(user as any);
    const token = jwt.sign({ userId }, process.env.JWT_SECRET!);
    const { req, res, next, nextCalled } = fakeReqRes({ cookies: { jwt: token } });

    await authenticateUser(req, res, next);

    expect(nextCalled()).toBe(true);
    expect(req.user).toEqual(user);
    findSpy.mockRestore();
  });
});

describe("isAuthor", () => {
  const authorId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  const runIsAuthor = async (userId: mongoose.Types.ObjectId, campground: unknown) => {
    const findSpy = spyOn(Campground, "findById").mockResolvedValue(campground as any);
    const ctx = fakeReqRes({ params: { id: "c1" } as any, user: { _id: userId } });
    try {
      await isAuthor(ctx.req, ctx.res, ctx.next);
      return { error: undefined, ...ctx };
    } catch (error) {
      return { error: error as AppError, ...ctx };
    } finally {
      findSpy.mockRestore();
    }
  };

  it("lets the author through", async () => {
    const result = await runIsAuthor(authorId, { author: authorId });
    expect(result.error).toBeUndefined();
    expect(result.nextCalled()).toBe(true);
  });

  it("blocks anyone else with a 403", async () => {
    const result = await runIsAuthor(otherId, { author: authorId });
    expect(result.error!.httpCode).toBe(403);
    expect(result.nextCalled()).toBe(false);
  });

  it("blocks with a 403 when the campground doesn't exist", async () => {
    const result = await runIsAuthor(authorId, null);
    expect(result.error!.httpCode).toBe(403);
  });
});
