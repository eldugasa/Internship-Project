import { body } from "express-validator";
import { optionalIntBody, requiredIntParam } from "./common.validation.js";

export const createTeamValidation = [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Team name is required"),
  body("description")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Description must be under 1000 characters"),
  optionalIntBody("leadId"),
  body("memberIds")
    .optional()
    .isArray()
    .withMessage("memberIds must be an array"),
  body("memberIds.*")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Each memberId must be a positive integer"),
];

export const teamIdValidation = [requiredIntParam("teamId")];

export const teamMemberValidation = [
  requiredIntParam("teamId"),
  body("userId").isInt({ min: 1 }).withMessage("userId must be a positive integer"),
];
