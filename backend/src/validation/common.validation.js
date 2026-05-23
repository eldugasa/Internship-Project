import { body, param } from "express-validator";

export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PROJECT_MANAGER",
  "QA_TESTER",
  "TEAM_MEMBER",
];

export const USER_STATUSES = ["active", "inactive"];
export const PROJECT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"];
export const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "IN_TEST",
  "PENDING_RETEST",
  "FAILED",
  "PASSED",
  "COMPLETED",
];
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// FIX: Uses native isInt() and checkFalsy to safely catch empty strings, decimals, and edge cases
export const optionalIntBody = (field) =>
  body(field)
    .optional({ checkFalsy: true })
    .isInt()
    .withMessage(`${field} must be a valid integer`);

export const requiredIntParam = (field) =>
  param(field)
    .isInt({ min: 1 })
    .withMessage(`${field} must be a positive integer`);

// OPTIMIZATION: Reusable helper to validate against your arrays above (e.g., enumBodyRule("role", ROLES))
export const enumBodyRule = (field, allowedValues) =>
  body(field)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(", ")}`);

export const passwordRule = (field = "password") =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage(`${field} must be between 8 and 128 characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage(
      `${field} must include at least one uppercase letter, one lowercase letter, and one number`,
    );

export const attachmentRule = (field = "attachment") =>
  body(field)
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null) return true;
      if (typeof value !== "object") {
        throw new Error("Attachment must be an object");
      }

      if (!value.content || !value.name) {
        throw new Error("Attachment must include content and name");
      }

      if (typeof value.content !== "string" || !value.content.startsWith("data:")) {
        throw new Error("Attachment content must be a base64 data URL");
      }

      // FIX: Protection against malicious or accidental massive uploads (~5MB limit)
      if (value.content.length > 7000000) {
        throw new Error("Attachment size must be under 5MB");
      }

      if (typeof value.name !== "string" || value.name.length > 255) {
        throw new Error("Attachment name is invalid");
      }

      if (value.type && typeof value.type !== "string") {
        throw new Error("Attachment MIME type is invalid");
      }

      return true;
    });