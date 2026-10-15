import { describe, it, expect, spyOn, beforeEach, afterEach, mock } from "bun:test";
import request from "supertest";
import axios from "axios";
import mongoose from "mongoose";
import { app } from "../../app";
import Campground from "../../models/campground.model";
import Review from "../../models/review.model";
import { utapi } from "../../uploads/utapi";
import { useTestDb } from "../db";
import { authCookie, createTestCampground, createTestUser, validCampgroundBody } from "../helpers";

useTestDb();

beforeEach(() => {
  // Never call MapTiler or UploadThing from tests.
  spyOn(axios, "get").mockResolvedValue({
    data: { features: [{ geometry: { type: "Point", coordinates: [-119.5, 37.8] } }] },
  });
  spyOn(utapi, "deleteFiles").mockResolvedValue({ success: true, deletedCount: 1 } as any);
});

afterEach(() => {
  mock.restore();
});

describe("GET /api/campgrounds", () => {
  it("paginates 20 per page, newest first", async () => {
    const author = await createTestUser();
    for (let i = 1; i <= 25; i++) {
      await createTestCampground(author._id, { title: `Camp ${i}` });
    }

    const page1 = await request(app).get("/api/campgrounds?page=1");
    expect(page1.status).toBe(200);
    expect(page1.body.campgrounds).toHaveLength(20);
    expect(page1.body.campgrounds[0].title).toBe("Camp 25");
    expect(page1.body.totalPages).toBe(2);
    expect(page1.body.totalItems).toBe(25);

    const page2 = await request(app).get("/api/campgrounds?page=2");
    expect(page2.body.campgrounds).toHaveLength(5);
  });

  it("searches title and location, ignoring case", async () => {
    const author = await createTestUser();
    await createTestCampground(author._id, { title: "Pine Ridge", location: "Oregon" });
    await createTestCampground(author._id, { title: "Desert Bloom", location: "Arizona" });
    await createTestCampground(author._id, { title: "Lakeside", location: "Pine Valley" });

    const res = await request(app).get("/api/campgrounds?search=pine");
    const titles = res.body.campgrounds.map((c: any) => c.title).sort();
    expect(titles).toEqual(["Lakeside", "Pine Ridge"]);
  });
});

describe("GET /api/campgrounds/:id", () => {
  it("returns the campground with its author", async () => {
    const author = await createTestUser({ username: "daniel" });
    const camp = await createTestCampground(author._id);

    const res = await request(app).get(`/api/campgrounds/${camp._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Pine Ridge");
    expect(res.body.author.username).toBe("daniel");
  });

  it("returns 404 for an id that doesn't exist", async () => {
    const res = await request(app).get(`/api/campgrounds/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const res = await request(app).get("/api/campgrounds/not-an-id");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/campgrounds", () => {
  it("requires login", async () => {
    const res = await request(app).post("/api/campgrounds").send(validCampgroundBody());
    expect(res.status).toBe(401);
  });

  it("validates the body", async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post("/api/campgrounds")
      .set("Cookie", authCookie(user._id))
      .send({ title: "No price or images" });
    expect(res.status).toBe(400);
  });

  it("geocodes the location and saves the logged-in user as author", async () => {
    const user = await createTestUser();
    const someoneElse = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/campgrounds")
      .set("Cookie", authCookie(user._id))
      .send({ ...validCampgroundBody(), author: someoneElse });

    expect(res.status).toBe(201);
    expect(res.body.campground.geometry.coordinates).toEqual([-119.5, 37.8]);
    expect(String(res.body.campground.author)).toBe(String(user._id));
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});

describe("PUT /api/campgrounds/:id", () => {
  it("lets the author update it", async () => {
    const author = await createTestUser();
    const camp = await createTestCampground(author._id);

    const res = await request(app)
      .put(`/api/campgrounds/${camp._id}`)
      .set("Cookie", authCookie(author._id))
      .send({ ...validCampgroundBody(), title: "Renamed", images: [] });

    expect(res.status).toBe(200);
    expect(res.body.campground.title).toBe("Renamed");
  });

  it("returns 403 for anyone else", async () => {
    const author = await createTestUser();
    const other = await createTestUser();
    const camp = await createTestCampground(author._id);

    const res = await request(app)
      .put(`/api/campgrounds/${camp._id}`)
      .set("Cookie", authCookie(other._id))
      .send({ ...validCampgroundBody(), title: "Hijacked" });

    expect(res.status).toBe(403);
    expect((await Campground.findById(camp._id))!.title).toBe("Pine Ridge");
  });

  it("enforces the 15 image limit", async () => {
    const author = await createTestUser();
    const camp = await createTestCampground(author._id); // already has 1 image
    const images = Array.from({ length: 15 }, (_, i) => ({ url: `https://utfs.io/f/${i}.jpg`, filename: `${i}.jpg` }));

    const res = await request(app)
      .put(`/api/campgrounds/${camp._id}`)
      .set("Cookie", authCookie(author._id))
      .send({ ...validCampgroundBody(), images });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Max 15");
  });
});

describe("DELETE /api/campgrounds/:id", () => {
  it("deletes the campground, its reviews and its images", async () => {
    const author = await createTestUser();
    const review = await Review.create({ body: "Nice", rating: 5, author: author._id });
    const camp = await createTestCampground(author._id, { reviews: [review._id] });

    const res = await request(app)
      .delete(`/api/campgrounds/${camp._id}`)
      .set("Cookie", authCookie(author._id));

    expect(res.status).toBe(200);
    expect(await Campground.findById(camp._id)).toBeNull();
    expect(await Review.findById(review._id)).toBeNull();
    expect(utapi.deleteFiles).toHaveBeenCalledWith(["pine.jpg"]);
  });

  it("returns 403 for anyone else", async () => {
    const author = await createTestUser();
    const other = await createTestUser();
    const camp = await createTestCampground(author._id);

    const res = await request(app)
      .delete(`/api/campgrounds/${camp._id}`)
      .set("Cookie", authCookie(other._id));

    expect(res.status).toBe(403);
    expect(await Campground.findById(camp._id)).not.toBeNull();
  });
});
