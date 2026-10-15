import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const validateUserInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userSchema = Joi.object({
    username: Joi.string().required().trim(),
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
    password: Joi.string().min(8).max(72).required(),
  });

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const msg = error.details.map((e) => e.message).join(", ");
    throw new AppError({ message: msg, httpCode: 400 });
  }

  next();
};
