// utils/isReviewAuthor.ts
import { NextFunction, Request, Response } from "express";
import Review from "../models/review.model";
import { AppError } from "./AppError";

export const isReviewAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review?.author?.equals(req.user._id)) {
    throw new AppError({ message: "Not authorized", httpCode: 403 });
  }
  next();
};
