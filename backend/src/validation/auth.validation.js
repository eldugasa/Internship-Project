import { body } from "express-validator";
import { passwordRule } from "./common.validation.js";

export const loginValidation = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidation = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
];

export const resetPasswordValidation = [
  body("token").isString().notEmpty().withMessage("Reset token is required"),
  passwordRule("newPassword"),
];
