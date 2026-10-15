import { describe, it, expect } from "bun:test";
import { validateCampground } from "../../validation/campgroundSchema";
import { validateReview } from "../../validation/reviewSchema";
import { validateUserInput } from "../../validation/userInput";
import { AppError } from "../../utils/AppError";
import { fakeReqRes, validCampgroundBody } from "../helpers";

// Runs a validator and returns the AppError it threw, or undefined if it passed.
function run(validator: Function, body: unknown) {
  const ctx = fakeReqRes({ body });
  try {
    validator(ctx.req, ctx.res, ctx.next);
  } catch (err) {
    return { error: err as AppError, ctx };
  }
  return { error: undefined, ctx };
}

describe("validateCampground", () => {
  it("accepts a valid campground and calls next()", () => {
    const { error, ctx } = run(validateCampground, validCampgroundBody());
    expect(error).toBeUndefined();
    expect(ctx.nextCalled()).toBe(true);
  });

  it("rejects a negative price", () => {
    const { error } = run(validateCampground, { ...validCampgroundBody(), price: -5 });
    expect(error).toBeInstanceOf(AppError);
    expect(error!.httpCode).toBe(400);
    expect(error!.message).toContain("price");
  });

  it("reports every missing field at once", () => {
    const { error } = run(validateCampground, {});
    expect(error!.message).toContain("title");
    expect(error!.message).toContain("location");
    expect(error!.message).toContain("description");
    expect(error!.message).toContain("price");
    expect(error!.message).toContain("images");
  });

  it("rejects an image without a url", () => {
    const { error } = run(validateCampground, {
      ...validCampgroundBody(),
      images: [{ filename: "x.jpg" }],
    });
    expect(error!.httpCode).toBe(400);
  });

  // KNOWN BUG: `.unknown(true)` in campgroundSchema.ts lets extra fields through,
  // so PUT /api/campgrounds/:id can overwrite `author` or `reviews`.
  // `it.failing` passes while the bug exists. Once you fix the schema, Bun will
  // report this test as failing: change `it.failing` back to `it` at that point.
  it.failing("strips fields it doesn't know about", () => {
    const { ctx } = run(validateCampground, { ...validCampgroundBody(), author: "someone-else" });
    expect(ctx.req.body.author).toBeUndefined();
  });
});

describe("validateReview", () => {
  it("accepts a valid review", () => {
    const { error } = run(validateReview, { review: { rating: 4, body: "Lovely" } });
    expect(error).toBeUndefined();
  });

  it.each([0, 6])("rejects a rating of %d", (rating) => {
    const { error } = run(validateReview, { review: { rating, body: "Hi" } });
    expect(error!.httpCode).toBe(400);
  });

  it("rejects HTML in the body", () => {
    const { error } = run(validateReview, {
      review: { rating: 5, body: '<script>alert("x")</script>' },
    });
    expect(error!.message).toContain("must not include HTML");
  });

  it("rejects a missing review object", () => {
    const { error } = run(validateReview, { rating: 5, body: "Hi" });
    expect(error!.httpCode).toBe(400);
  });
});

describe("validateUserInput", () => {
  it("accepts a username and a .com email", () => {
    const { error } = run(validateUserInput, { username: "daniel", email: "d@example.com" });
    expect(error).toBeUndefined();
  });

  it("requires a username", () => {
    const { error } = run(validateUserInput, { email: "d@example.com" });
    expect(error!.httpCode).toBe(400);
  });

  it("rejects an invalid email", () => {
    const { error } = run(validateUserInput, { username: "daniel", email: "not-an-email" });
    expect(error!.httpCode).toBe(400);
  });
});
