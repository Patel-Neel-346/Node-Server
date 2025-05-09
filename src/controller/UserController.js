import { validationResult } from "express-validator";
import { ApiError } from "../helpers/ApiError.js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import User from "../models/UserModel.js";
import Otp from "../models/OtpModelSchema.js";
import RefreshToken from "../models/RefreshTokenModel.js";
import tokenService from "../services/TokenService.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../services/EmailService.js";
import jwt from "jsonwebtoken";
import { config } from "../Config/index.js";
// const { SendSMS } = await import("../services/SMS_Service.js");
import { SendSMS } from "../services/SMS_Service.js";

export const InitiateRegistration = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, "Validation Error", errors.array()));
  }

  const { firstName, lastName, email, password, phoneNumber } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.status === "pending") {
      await Otp.deleteMany({
        userId: existingUser._id,
        purpose: "registration",
      });

      const hashedPassword = await bcrypt.hash(password, 10);
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.password = hashedPassword;
      // Update phone number if provided
      if (phoneNumber) {
        existingUser.phoneNumber = phoneNumber;
      }
      await existingUser.save();
    } else if (existingUser.status === "active") {
      return next(
        new ApiError(409, "User already exists. Please login instead.")
      );
    }
  }

  const hashedPassword = !existingUser
    ? await bcrypt.hash(password, 10)
    : existingUser.password;

  const pendingUser =
    existingUser ||
    (await User.create({
      firstName,
      lastName,
      email,
      phoneNumber, // Add phone number to the new user
      password: hashedPassword,
      status: "pending",
    }));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Determine notification methods based on available contact information
  const notificationMethods = [];
  if (email) notificationMethods.push("email");
  if (phoneNumber) notificationMethods.push("sms");

  const otpDoc = await Otp.create({
    email,
    phoneNumber,
    otp,
    notificationMethods,
    purpose: "registration",
    userId: pendingUser._id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Send OTP via email
  if (email) {
    await sendOTP(email, otp);
  }

  // Send OTP via SMS if phone number provided
  if (phoneNumber) {
    await SendSMS(phoneNumber, otp);
  }

  res.status(200).json({
    success: true,
    message:
      "OTP sent to your email" +
      (phoneNumber ? " and phone" : "") +
      ". Please verify to complete registration.",
    email: email,
    phoneNumber: phoneNumber || null,
  });
});

export const VerifyOtpAndRegister = asyncHandler(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError(422, "Validation Error", errors.array()));
    }

    const { email, phoneNumber, otp } = req.body;

    if (!email && !phoneNumber) {
      return next(
        new ApiError(400, "Please provide either email or phone number")
      );
    }

    if (!otp) {
      return next(new ApiError(400, "Please provide OTP"));
    }

    // Find OTP document based on email and/or phone number
    const query = {
      purpose: "registration",
      expiresAt: { $gt: Date.now() },
    };

    // Add identifier conditions to the query
    if (email) query.email = email;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const otpDocument = await Otp.findOne(query).populate("userId");

    if (!otpDocument) {
      return next(new ApiError(400, "OTP expired or not found"));
    }

    if (otpDocument.otp !== otp) {
      return next(new ApiError(400, "Invalid OTP"));
    }

    const user = await User.findOne({
      _id: otpDocument.userId,
      status: "pending",
    });

    if (!user) {
      return next(new ApiError(404, "Registration session expired or invalid"));
    }

    user.status = "active";
    await user.save();

    await Otp.deleteOne({ _id: otpDocument._id });

    const payload = {
      sub: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = tokenService.generateAccessToken(payload);
    const refreshTokenDoc = await tokenService.persistRefreshToken(user._id);
    const refreshToken = tokenService.generateRefreshToken({
      ...payload,
      id: refreshTokenDoc._id,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      success: true,
      message: "Welcome to Our Website! User registered successfully.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber || null,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "internal server error");
  }
});

export const cleanupPendingUsers = asyncHandler(async () => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredUsers = await User.find({
    status: "pending",
    createdAt: { $lt: twentyFourHoursAgo },
  });

  const expiredUserIds = expiredUsers.map((user) => user._id);

  if (expiredUserIds.length > 0) {
    await Otp.deleteMany({ userId: { $in: expiredUserIds } });
  }

  await User.deleteMany({
    status: "pending",
    createdAt: { $lt: twentyFourHoursAgo },
  });

  console.log(
    `Cleaned up ${expiredUserIds.length} expired pending user accounts`
  );
});

export const LoginUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, "Validation Error", errors.array()));
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, "Invalid credentials"));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return next(new ApiError(401, "Invalid credentials"));
    }

    const payload = {
      sub: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = tokenService.generateAccessToken(payload);
    const refreshTokenDoc = await tokenService.persistRefreshToken(user._id);
    const refreshToken = tokenService.generateRefreshToken({
      ...payload,
      id: refreshTokenDoc._id,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      success: true,
      message: "Welcome back! You are successfully logged in.",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error(err);
    next(new ApiError(500, "Internal Server Error"));
  }
});

// New controller for refreshing tokens
export const RefreshTokens = asyncHandler(async (req, res, next) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!refreshToken) {
    return next(new ApiError(401, "Refresh token is required"));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.JWT_EXPIRES_REFRESH_SECRET);

    // Check if token exists in database
    const refreshTokenDoc = await RefreshToken.findById(decoded.id).populate(
      "user"
    );
    if (!refreshTokenDoc) {
      return next(new ApiError(401, "Invalid refresh token"));
    }

    // Check if user exists
    const user = await User.findById(decoded.sub);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    // Generate new tokens
    const payload = {
      sub: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Delete old refresh token
    await RefreshToken.deleteOne({ _id: decoded.id });

    // Create new tokens
    const newAccessToken = tokenService.generateAccessToken(payload);
    const newRefreshTokenDoc = await tokenService.persistRefreshToken(user._id);
    const newRefreshToken = tokenService.generateRefreshToken({
      ...payload,
      id: newRefreshTokenDoc._id,
    });

    // Set cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      refreshTokenDoc,
    });
  } catch (err) {
    console.error(err);
    return next(new ApiError(401, "Invalid refresh token"));
  }
});

export const LogoutUser = asyncHandler(async (req, res, next) => {
  try {
    const refreshTokenId = req.user?.id;

    if (refreshTokenId) {
      await tokenService.deleteRefreshToken(refreshTokenId);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (err) {
    console.error(err);
    next(new ApiError(500, "Internal Server Error"));
  }
});

export const getCurrentUser = asyncHandler(async (req, res, next) => {
  const userId = req.user?.sub;

  if (!userId) {
    return next(new ApiError(401, "Unauthorized: No user found in token"));
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  res.status(200).json({
    success: true,
    message: "User data fetched successfully",
    data: user,
  });
});

export const RegistrationStatus = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select("status");

  if (!user) {
    return res.status(200).json({
      registered: false,
      status: null,
      message: "Email not registered",
    });
  }

  return res.status(200).json({
    registered: true,
    status: user.status,
    message:
      user.status === "pending"
        ? "Registration started but not completed"
        : "User registration complete",
  });
});

export const ResendOtp = asyncHandler(async (req, res, next) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return next(
      new ApiError(400, "Please provide either email or phone number")
    );
  }

  // Build query based on provided identifiers
  const query = { status: "pending" };
  if (email) query.email = email;
  if (phoneNumber) query.phoneNumber = phoneNumber;

  const pendingUser = await User.findOne(query);
  if (!pendingUser) {
    return next(
      new ApiError(
        404,
        "No pending registration found for this contact information"
      )
    );
  }

  // Delete any existing OTPs for this user
  await Otp.deleteMany({ userId: pendingUser._id, purpose: "registration" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Determine notification methods based on available contact information
  const notificationMethods = [];
  if (email) notificationMethods.push("email");
  if (phoneNumber) notificationMethods.push("sms");

  const otpDoc = await Otp.create({
    email,
    phoneNumber,
    otp,
    notificationMethods,
    purpose: "registration",
    userId: pendingUser._id,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Send OTP via email if email is provided
  if (email) {
    await sendOTP(email, otp);
  }

  // Send OTP via SMS if phone number is provided
  if (phoneNumber) {
    await SendSMS(phoneNumber, otp);
  }

  res.status(200).json({
    success: true,
    message: `New OTP sent to your ${notificationMethods.join(" and ")}`,
    email: email || null,
    phoneNumber: phoneNumber || null,
  });
});

// Updated InitiatePasswordReset function
export const InitiatePasswordReset = asyncHandler(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError(422, "Validation Error", errors.array()));
    }

    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return next(
        new ApiError(400, "Please provide either email or phone number")
      );
    }

    // Build query based on provided identifiers
    const query = { status: "active" };
    if (email) query.email = email;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const user = await User.findOne(query);
    if (!user) {
      return next(
        new ApiError(
          404,
          "No active account found with this contact information"
        )
      );
    }

    // Delete any existing OTPs for this purpose
    const otpDeleteQuery = { userId: user._id, purpose: "password-reset" };
    await Otp.deleteMany(otpDeleteQuery);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Determine notification methods based on provided contact information
    const notificationMethods = [];
    if (email) notificationMethods.push("email");
    if (phoneNumber) notificationMethods.push("sms");

    await Otp.create({
      email: user.email,
      phoneNumber: user.phoneNumber,
      otp,
      notificationMethods,
      purpose: "password-reset",
      userId: user._id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP via email if available
    if (email) {
      await sendOTP(email, otp, "Password Reset");
    }

    // Send OTP via SMS if phone number is available
    if (phoneNumber) {
      await SendSMS(phoneNumber, otp, "Password Reset");
    }

    res.status(200).json({
      success: true,
      message: `Password reset OTP sent to your ${notificationMethods.join(
        " and "
      )}. Please check for the verification code.`,
      email: email || null,
      phoneNumber: phoneNumber || null,
    });
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Internal server Error");
  }
});

// Updated VerifyOtpAndResetPassword function
export const VerifyOtpAndResetPassword = asyncHandler(
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(422, "Validation Error", errors.array()));
      }

      const { otp, email, phoneNumber, newPassword } = req.body;

      if (!email && !phoneNumber) {
        return next(
          new ApiError(400, "Please provide either email or phone number")
        );
      }

      if (!otp) {
        return next(new ApiError(400, "Please provide OTP"));
      }

      if (!newPassword) {
        return next(new ApiError(400, "Please provide new password"));
      }

      // Build query to find the OTP record
      const query = {
        purpose: "password-reset",
        expiresAt: { $gt: Date.now() },
        otp: otp,
      };

      // Add identifier conditions to the query
      if (email) query.email = email;
      if (phoneNumber) query.phoneNumber = phoneNumber;

      const otpRecord = await Otp.findOne(query).populate("userId");

      if (!otpRecord) {
        return next(
          new ApiError(
            404,
            "OTP not found or expired. Please request a new one."
          )
        );
      }

      if (otpRecord.otp !== otp) {
        return next(new ApiError(400, "Invalid OTP. Please try again."));
      }

      // Find the user using the user ID from the OTP record
      const user = await User.findOne({
        _id: otpRecord.userId,
        status: "active",
      });

      if (!user) {
        return next(
          new ApiError(404, "User not found or account is not active")
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;
      await user.save();

      await Otp.deleteOne({ _id: otpRecord._id });

      res.status(200).json({
        success: true,
        message:
          "Password has been reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error(error);
      throw new ApiError(500, "Internal server Error");
    }
  }
);

// Updated ResendPasswordResetOtp function
export const ResendPasswordResetOtp = asyncHandler(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ApiError(422, "Validation Error", errors.array()));
    }

    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return next(
        new ApiError(400, "Please provide either email or phone number")
      );
    }

    // Build query based on provided identifiers
    const query = { status: "active" };
    if (email) query.email = email;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const user = await User.findOne(query);
    if (!user) {
      return next(
        new ApiError(
          404,
          "No active account found with this contact information"
        )
      );
    }

    // Delete any existing OTPs for this purpose
    const otpDeleteQuery = { userId: user._id, purpose: "password-reset" };
    await Otp.deleteMany(otpDeleteQuery);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Determine notification methods based on provided contact information
    const notificationMethods = [];
    if (email) notificationMethods.push("email");
    if (phoneNumber) notificationMethods.push("sms");

    await Otp.create({
      email: user.email,
      phoneNumber: user.phoneNumber,
      otp,
      notificationMethods,
      purpose: "password-reset",
      userId: user._id,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP via email if available
    if (email) {
      await sendOTP(email, otp, "Password Reset");
    }

    // Send OTP via SMS if phone number is available
    if (phoneNumber) {
      await SendSMS(phoneNumber, otp, "Password Reset");
    }

    res.status(200).json({
      success: true,
      message: `New password reset OTP sent to your ${notificationMethods.join(
        " and "
      )}. Please check for the verification code.`,
      email: email || null,
      phoneNumber: phoneNumber || null,
    });
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Internal Server Error");
  }
});
