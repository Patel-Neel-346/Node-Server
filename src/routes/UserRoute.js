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

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phoneNumber:
 *           type: string
 *           description: User's phone number (optional)
 *         status:
 *           type: string
 *           enum: [pending, active]
 *           description: User account status
 *         profilePicture:
 *           type: string
 *           description: Path to profile picture
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 */

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication operations including login, logout, and token management
 *   - name: Registration
 *     description: User registration process including OTP verification
 *   - name: User
 *     description: User profile operations and management
 *   - name: Password
 *     description: Password management operations including reset functionality
 */

/**
 * @swagger
 * /api/v1/user/register:
 *   post:
 *     summary: Start user registration
 *     tags: [Registration]
 *     description: Initiates the user registration process by validating user data and sending OTP via email and/or SMS
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *                 description: "Must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number"
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP sent successfully"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 phoneNumber:
 *                   type: string
 *                   nullable: true
 *                   example: "+1234567890"
 *                 profilePicture:
 *                   type: boolean
 *                   example: true
 *       422:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email or phone number already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

UserRoute.post(
  "/register",
  upload.single("profilePicture"),
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

/**
 * @swagger
 * /api/v1/user/register/verify-otp:
 *   post:
 *     summary: Verify OTP and complete registration
 *     tags: [Registration]
 *     description: Verifies the OTP sent during registration and creates the user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: "6-digit OTP code received via email or SMS"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         firstName:
 *                           type: string
 *                           example: "John"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         phoneNumber:
 *                           type: string
 *                           nullable: true
 *                           example: "+1234567890"
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No pending registration found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       410:
 *         description: OTP expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  VerifyOtpAndRegister
);

/**
 * @swagger
 * /api/v1/user/register/resend-otp:
 *   post:
 *     summary: Resend registration OTP
 *     tags: [Registration]
 *     description: Resends the OTP for registration validation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP resent successfully"
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *                 phoneNumber:
 *                   type: string
 *                   nullable: true
 *                   example: "+1234567890"
 *       404:
 *         description: No pending registration found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many attempts, please try again later
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

UserRoute.post(
  "/register/resend-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  ResendOtp
);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticates a user and returns access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Account not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

UserRoute.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  LoginUser
);

/**
 * @swagger
 * /api/v1/user/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Get new access and refresh tokens using a valid refresh token
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: "The refresh token received during login or previous refresh"
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Tokens refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

UserRoute.post("/refresh-token", RefreshTokens);

/**
 * @swagger
 * /api/v1/user/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Logout the current user and invalidate tokens
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

UserRoute.get("/logout", authMiddleware, LogoutUser);

/**
 * @swagger
 * /api/v1/user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     description: Retrieves the profile of the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User profile fetched successfully"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

UserRoute.get("/me", authMiddleware, getCurrentUser);

/**
 * @swagger
 * /api/v1/user/registration-status:
 *   get:
 *     summary: Check registration status
 *     tags: [Registration]
 *     description: Check if an email is registered and its account status
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         required: true
 *         description: Email to check
 *         example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Registration status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 registered:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   nullable: true
 *                   example: "active"
 *                 message:
 *                   type: string
 *                   example: "User is registered and active"
 */
UserRoute.get(
  "/registration-status",
  [body("email").isEmail().withMessage("Valid email is required")],
  RegistrationStatus
);

/**
 * @swagger
 * /api/v1/user/password-reset/initiate:
 *   post:
 *     summary: Initiate password reset
 *     tags: [Password]
 *     description: Initiates the password reset process by sending an OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset OTP sent successfully"
 *                 email:
 *                   type: string
 *                   nullable: true
 *                   example: "john.doe@example.com"
 *                 phoneNumber:
 *                   type: string
 *                   nullable: true
 *                   example: "+1234567890"
 *       404:
 *         description: No active account found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
UserRoute.post(
  "/password-reset/initiate",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  InitiatePasswordReset
);

/**
 * @swagger
 * /api/v1/user/password-reset/verify:
 *   post:
 *     summary: Verify OTP and reset password
 *     tags: [Password]
 *     description: Verifies the OTP and resets the user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: "6-digit OTP code received via email or SMS"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewPassword123"
 *                 description: "Must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: OTP not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       410:
 *         description: OTP expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  VerifyOtpAndResetPassword
);

/**
 * @swagger
 * /api/v1/user/password-reset/resend-otp:
 *   post:
 *     summary: Resend password reset OTP
 *     tags: [Password]
 *     description: Resends the OTP for password reset verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Password reset OTP resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset OTP resent successfully"
 *                 email:
 *                   type: string
 *                   nullable: true
 *                   example: "john.doe@example.com"
 *                 phoneNumber:
 *                   type: string
 *                   nullable: true
 *                   example: "+1234567890"
 *       404:
 *         description: No active account found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many attempts, please try again later
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
UserRoute.post(
  "/password-reset/resend-otp",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("phoneNumber")
      .optional()
      .isMobilePhone()
      .withMessage("Please provide a valid phone number"),
  ],
  ResendPasswordResetOtp
);

export default UserRoute;
