import express from "express";
import Joi from "joi";

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword
} from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import { validate } from "../utils/validate.js";

const router = express.Router();

const registerValidation = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(32).required(),
  role: Joi.string().valid("admin", "customer", "tailor", "delivery").optional()
});

const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const forgotPasswordValidation = Joi.object({
  email: Joi.string().email().required()
});

const verifyOtpValidation = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required()
});

const resetPasswordValidation = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: Joi.string().min(6).max(32).required()
});


const changePasswordValidation = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(32).required()
});

router.post("/register", validate(registerValidation), registerUser);
router.post("/login", validate(loginValidation), loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", validate(forgotPasswordValidation), forgotPassword);
router.post("/verify-otp", validate(verifyOtpValidation), verifyOtp);
router.post("/reset-password", validate(resetPasswordValidation), resetPassword);
router.post("/change-password", verifyJWT, validate(changePasswordValidation), changePassword);

export default router;
