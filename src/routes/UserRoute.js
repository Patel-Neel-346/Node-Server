import express from "express";
import {
  getCurrentUser,
  InitiateRegistration,
  LoginUser,
  LogoutUser,
  // RegisterUser,
  VerifyOtpAndRegister,
} from "../controller/UserController.js";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
// import { sendOtpToEmail } from "../controller/SendOtpController.js";
const UserRoute = express.Router();

UserRoute.route("/Register", [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter"),
]).post(InitiateRegistration);

UserRoute.route("/Register/verify-otp", [
  body("verificationId").notEmpty().withMessage("Verification ID is required"),
  body("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),
]).post(VerifyOtpAndRegister);

UserRoute.route("/login", [
  body("email").isEmail().withMessage("Email is required"),
  body("password").notEmpty().withMessage("Password is required"),
]).post(LoginUser);

UserRoute.route("/Logout").get(authMiddleware, LogoutUser);

UserRoute.route("/getUser").get(authMiddleware, getCurrentUser);

// UserRoute.route("/send-otp").post(sendOtpToEmail);
export default UserRoute;
