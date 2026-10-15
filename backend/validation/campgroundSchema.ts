import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const validateCampground = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const campgroundSchema = Joi.object({
    title: Joi.string().required().trim(),
    location: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().required().min(0),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().required(),
          filename: Joi.string().required(),
        }),
      )
      .required(),
    // Sent by the edit page: filenames of existing images to remove
    imagesToDelete: Joi.array().items(Joi.string()),
  });

  // shows all errors at once
  const { error, value } = campgroundSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const msg = error.details.map((e) => e.message).join(", ");
    throw new AppError({ message: msg, httpCode: 400 });
  }

  req.body = value;

  next();
};
