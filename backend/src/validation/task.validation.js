import { body } from "express-validator";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  attachmentRule,
  optionalIntBody,
  requiredIntParam,
} from "./common.validation.js";

export const createTaskValidation = [
  body("title").trim().isLength({ min: 2, max: 160 }).withMessage("Task title is required"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 4000 })
    .withMessage("Description must be under 4000 characters"),
  body("projectId").isInt({ min: 1 }).withMessage("projectId must be a positive integer"),
  body("assignedTo").isInt({ min: 1 }).withMessage("assignedTo must be a positive integer"),
  optionalIntBody("qaTesterId"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("dueDate must be a valid date"),
  body("priority")
    .optional()
    .toUpperCase()
    .isIn(TASK_PRIORITIES)
    .withMessage("Priority is invalid"),
  attachmentRule(),
];

export const updateTaskValidation = [
  requiredIntParam("id"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage("Task title must be between 2 and 160 characters"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 4000 })
    .withMessage("Description must be under 4000 characters"),
  optionalIntBody("assigneeId"),
  optionalIntBody("qaTesterId"),
  body("dueDate").optional({ nullable: true }).isISO8601().withMessage("dueDate must be a valid date"),
  body("priority")
    .optional()
    .toUpperCase()
    .isIn(TASK_PRIORITIES)
    .withMessage("Priority is invalid"),
  body("status")
    .optional()
    .toUpperCase()
    .isIn(TASK_STATUSES)
    .withMessage("Task status is invalid"),
  body("progress")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
  body("removeAttachment")
    .optional()
    .isBoolean()
    .withMessage("removeAttachment must be a boolean"),
  attachmentRule(),
];

export const updateTaskStatusValidation = [
  requiredIntParam("id"),
  body("status")
    .optional()
    .toUpperCase()
    .isIn(TASK_STATUSES)
    .withMessage("Task status is invalid"),
  body("progress")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be between 0 and 100"),
];

export const assignTaskValidation = [
  requiredIntParam("id"),
  body("userId").isInt({ min: 1 }).withMessage("userId must be a positive integer"),
];

export const addCommentValidation = [
  requiredIntParam("id"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Comment content is required"),
];
