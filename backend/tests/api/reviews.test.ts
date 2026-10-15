import { describe, it, expect } from "bun:test";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../app";
import Campground from "../../models/campground.model";
import Review from "../../models/review.model";
import { useTestDb } from "../db";
import { authCookie, createTestCampground, createTestUser } from "../helpers";

useTestDb();

const reviewsUrl = (campId: unknown) => `/api/campgrounds/${campId}/reviews`;

describe("POST /api/campgrounds/:id/reviews", () => {
  it("requires login", async () => {
    const author = await createTestUser();
    const camp = await createTestCampground(author._id);
    const res = await request(app)
      .post(reviewsUrl(camp._id))
      .send({ review: { rating: 5, body: "Great" } });
    expect(res.status).toBe(401);
  });

  it("adds the review to the campground with the reviewer as author", async () => {
    const owner = await createTestUser();
    const reviewer = await createTestUser({ username: "reviewer" });
    const camp = await createTestCampground(owner._id);

    const res = await request(app)
      .post(reviewsUrl(camp._id))
      .set("Cookie", authCookie(reviewer._id))
      .send({ review: { rating: 4, body: "Clean and quiet" } });

    expect(res.status).toBe(201);
    expect(res.body.review).toMatchObject({
      rating: 4,
      body: "Clean and quiet",
    });
    expect(res.body.review.author.username).toBe("reviewer");

    const updated = await Campground.findById(camp._id);
    expect(updated!.reviews.map(String)).toEqual([String(res.body.review._id)]);
  });

  it("rejects HTML in the body", async () => {
    const user = await createTestUser();
    const camp = await createTestCampground(user._id);
    const res = await request(app)
      .post(reviewsUrl(camp._id))
      .set("Cookie", authCookie(user._id))
      .send({ review: { rating: 5, body: "<img src=x onerror=alert(1)>" } });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a campground that doesn't exist", async () => {
    const user = await createTestUser();
    const res = await request(app)
      .post(reviewsUrl(new mongoose.Types.ObjectId()))
      .set("Cookie", authCookie(user._id))
      .send({ review: { rating: 5, body: "Ghost camp" } });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/campgrounds/:id/reviews/:reviewId", () => {
  it("lets the review's author delete it", async () => {
    const user = await createTestUser();
    const review = await Review.create({
      body: "Meh",
      rating: 2,
      author: user._id,
    });
    const camp = await createTestCampground(user._id, {
      reviews: [review._id],
    });

    const res = await request(app)
      .delete(`${reviewsUrl(camp._id)}/${review._id}`)
      .set("Cookie", authCookie(user._id));

    expect(res.status).toBe(200);
    expect(await Review.findById(review._id)).toBeNull();
    expect((await Campground.findById(camp._id))!.reviews).toHaveLength(0);
  });

  it("refuses to let another user delete it", async () => {
    const reviewer = await createTestUser();
    const stranger = await createTestUser();
    const review = await Review.create({
      body: "Mine",
      rating: 5,
      author: reviewer._id,
    });
    const camp = await createTestCampground(reviewer._id, {
      reviews: [review._id],
    });

    const res = await request(app)
      .delete(`${reviewsUrl(camp._id)}/${review._id}`)
      .set("Cookie", authCookie(stranger._id));

    expect(res.status).toBe(403);
  });
});
