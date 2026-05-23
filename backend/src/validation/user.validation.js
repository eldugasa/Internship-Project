import { body } from "express-validator";
import {
  ROLES,
  USER_STATUSES,
  passwordRule,
  requiredIntParam,
} from "./common.validation.js";

export const createUserValidation = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  passwordRule("password"),
  body("role")
    .optional()
    .isIn(ROLES)
    .withMessage("Role is invalid"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array"),
  body("permissions.*")
    .optional()
    .isString()
    .isLength({ min: 3, max: 64 })
    .withMessage("Permission values must be strings"),
  body("status")
    .optional()
    .toLowerCase()
    .isIn(USER_STATUSES)
    .withMessage("Status must be active or inactive"),
  body("phone")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 30 })
    .withMessage("Phone is invalid"),
  body("location")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 120 })
    .withMessage("Location is invalid"),
  body("skill")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 120 })
    .withMessage("Skill is invalid"),
];

export const updateUserAccessValidation = [
  requiredIntParam("id"),
  body("role").optional().isIn(ROLES).withMessage("Role is invalid"),
  body("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array"),
  body("permissions.*")
    .optional()
    .isString()
    .isLength({ min: 3, max: 64 })
    .withMessage("Permission values must be strings"),
  body("status")
    .optional()
    .toLowerCase()
    .isIn(USER_STATUSES)
    .withMessage("Status must be active or inactive"),
];

export const updateCurrentUserValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Name must be between 2 and 120 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("A valid email is required")
    .normalizeEmail(),
  body("phone")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 30 })
    .withMessage("Phone is invalid"),
  body("location")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 120 })
    .withMessage("Location is invalid"),
  body("skill")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 120 })
    .withMessage("Skill is invalid"),
];

export const changePasswordValidation = [
  body("currentPassword").isString().notEmpty().withMessage("Current password is required"),
  passwordRule("newPassword"),
];
