import express from "express";
import { 
  register, 
  login, 
  refresh,
  logout,
  forgotPassword, 
  resetPassword 
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  forgotPasswordValidation,
  loginValidation,
  resetPasswordValidation,
} from "../validation/auth.validation.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", loginValidation, validateRequest, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordValidation, validateRequest, forgotPassword);
router.post("/reset-password", resetPasswordValidation, validateRequest, resetPassword);

export default router;
