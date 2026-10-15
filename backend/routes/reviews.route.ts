import { Router } from "express";
import {
  createReview,
  deleteReview,
  getReviews,
} from "../controllers/review.controller";
import { authenticateUser } from "../utils/auth";
import { isReviewAuthor } from "../utils/isReviewAuthor";

// mergeParams: true allows this router to see the ":id" from the parent
const router = Router({ mergeParams: true });

router.get("/", getReviews);
router.post("/", authenticateUser, createReview);
router.delete("/:reviewId", authenticateUser, isReviewAuthor, deleteReview);

export default router;
