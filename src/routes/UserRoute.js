// src/routes/UserRoute.js
import express from "express";
import {
  getCurrentUser,
  InitiateRegistration,
  LoginUser,
  LogoutUser,
  RefreshTokens,
  VerifyOtpAndRegister,
  RegistrationStatus,
  ResendOtp,
  InitiatePasswordReset,
  VerifyOtpAndResetPassword,
  ResendPasswordResetOtp,
} from "../controller/UserController.js";
import { body, param } from "express-validator";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import upload from "../middleware/Multer_middleware.js";

const UserRoute = express.Router();

// Registration endpoints
UserRoute.post(
  "/register",
  upload.single("profilePicture"), // Properly position the middleware
  [
    body("firstName").trim().notEmpty().withMessage("First name is required"),
    body("lastName").trim().notEmpty().withMessage("Last name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter"),
  ],
  InitiateRegistration
);

UserRoute.post(
  "/register/verify-otp",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must contain only numbers"),
    // Phone number is optional for verification
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  VerifyOtpAndRegister
);

//resend-otp
UserRoute.post(
  "/register/resend-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    // Phone number is optional for resending OTP
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  ResendOtp
);

UserRoute.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  LoginUser
);

// Token management
UserRoute.post("/refresh-token", RefreshTokens);
UserRoute.get("/logout", authMiddleware, LogoutUser);

// User data
UserRoute.get("/me", authMiddleware, getCurrentUser);

// Check registration status (new endpoint)
UserRoute.get(
  "/registration-status",
  [body("email").isEmail().withMessage("Valid email is required")],
  RegistrationStatus
);

UserRoute.post(
  "/password-reset/initiate",

  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    // Phone number is optional for password reset
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  InitiatePasswordReset
);

UserRoute.post(
  "/password-reset/verify",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp")
      .notEmpty()
      .withMessage("OTP is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits")
      .isNumeric()
      .withMessage("OTP must contain only numbers"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter"),
    // Phone number is optional for verification
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  VerifyOtpAndResetPassword
);

UserRoute.post(
  "/password-reset/resend-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    // Phone number is optional for resending OTP
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  ResendPasswordResetOtp
);

export default UserRoute;
