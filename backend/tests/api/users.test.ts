import { describe, it, expect } from "bun:test";
import request from "supertest";
import { app } from "../../app";
import User from "../../models/user.model";
import { useTestDb } from "../db";
import { authCookie, createTestUser } from "../helpers";

useTestDb();

const newUser = {
  username: "daniel",
  email: "daniel@example.com",
  password: "secret123",
};

/** Pulls the jwt cookie out of a response so the next request can reuse it. */
const jwtCookie = (res: request.Response) =>
  ([] as string[])
    .concat(res.headers["set-cookie"] ?? [])
    .find((c) => c.startsWith("jwt="));

describe("POST /api/users/register", () => {
  it("creates the user, logs them in, and never returns the password", async () => {
    const res = await request(app).post("/api/users/register").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      username: "daniel",
      email: "daniel@example.com",
    });
    expect(res.body.user.password).toBeUndefined();
    expect(jwtCookie(res)).toBeDefined();

    const saved = await User.findOne({ email: newUser.email }).select(
      "+password",
    );
    expect(saved!.password).not.toBe(newUser.password); // stored hashed
  });

  it("rejects an email that's already taken", async () => {
    await createTestUser({ email: newUser.email });
    const res = await request(app).post("/api/users/register").send(newUser);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email already taken");
  });

  it("rejects a username that's already taken", async () => {
    await createTestUser({ username: "daniel" });
    const res = await request(app).post("/api/users/register").send(newUser);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Username already taken.");
  });

  it("rejects reserved usernames", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ ...newUser, username: "SuperAdmin42" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("This username is not allowed.");
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ ...newUser, email: "nope" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/users/login", () => {
  it("logs in with email", async () => {
    await createTestUser({
      username: "daniel",
      email: "daniel@example.com",
      password: "secret123",
    });
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "daniel@example.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("daniel");
    expect(jwtCookie(res)).toBeDefined();
  });

  it("also accepts a username in the email field", async () => {
    await createTestUser({ username: "daniel", password: "secret123" });
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "daniel", password: "secret123" });
    expect(res.status).toBe(200);
  });

  it("rejects a wrong password", async () => {
    await createTestUser({
      email: "daniel@example.com",
      password: "secret123",
    });
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "daniel@example.com", password: "wrong" });
    expect(res.status).toBe(400);
    expect(jwtCookie(res)).toBeUndefined();
  });

  it("returns 404 for an unknown user", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({ email: "ghost@example.com", password: "whatever" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when credentials are missing", async () => {
    const res = await request(app).post("/api/users/login").send({});
    expect(res.status).toBe(400);
  });
});

describe("session flow", () => {
  it("register → /me → logout", async () => {
    const registered = await request(app)
      .post("/api/users/register")
      .send(newUser);
    const cookie = jwtCookie(registered)!;

    const me = await request(app).get("/api/users/me").set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe("daniel");

    const logout = await request(app)
      .post("/api/users/logout")
      .set("Cookie", cookie);
    expect(logout.status).toBe(200);
    expect(jwtCookie(logout)).toMatch(/^jwt=;/); // cookie cleared
  });

  it("/me without a cookie is 401", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("removed user-management routes", () => {
  it("does not list users", async () => {
    await createTestUser();
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(404);
  });

  it("does not allow changing a password by id", async () => {
    const victim = await createTestUser();
    const res = await request(app)
      .put(`/api/users/${victim._id}`)
      .send({ username: victim.username, password: "hacked123" });
    expect(res.status).toBe(404);
  });

  it("does not allow deleting an account by id", async () => {
    const victim = await createTestUser();
    const attacker = await createTestUser();
    const res = await request(app)
      .delete(`/api/users/${victim._id}`)
      .set("Cookie", authCookie(attacker._id));
    expect(res.status).toBe(404);
    expect(await User.findById(victim._id)).not.toBeNull();
  });
});
