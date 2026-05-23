import { body } from "express-validator";
import {
  PROJECT_STATUSES,
  attachmentRule,
  optionalIntBody,
  requiredIntParam,
} from "./common.validation.js";

export const createProjectValidation = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Project name is required"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters"),
  body("teamId").isInt({ min: 1 }).withMessage("teamId must be a positive integer"),
  body("startDate").isISO8601().withMessage("startDate must be a valid date"),
  body("endDate").isISO8601().withMessage("endDate must be a valid date"),
  attachmentRule(),
];

export const updateProjectValidation = [
  requiredIntParam("id"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Project name must be between 2 and 120 characters"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 2000 })
    .withMessage("Description must be under 2000 characters"),
  optionalIntBody("teamId"),
  body("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
  body("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),
  body("status")
    .optional()
    .toUpperCase()
    .isIn(PROJECT_STATUSES)
    .withMessage("Project status is invalid"),
  body("removeAttachment")
    .optional()
    .isBoolean()
    .withMessage("removeAttachment must be a boolean"),
  attachmentRule(),
];
