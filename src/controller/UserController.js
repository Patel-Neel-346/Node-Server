// import { validationResult } from "express-validator";
// import { ApiError } from "../helpers/ApiError.js";
// import { asyncHandler } from "../helpers/asyncHandler.js";
// import User from "../models/UserModel.js";
// import tokenService from "../services/TokenService.js";
// import bcrypt from "bcrypt";

// export const RegisterUser = asyncHandler(async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(new ApiError(422, "Validation Error", errors.array()));
//   }
//   const { firstName, lastName, email, password } = req.body;
//   console.log(firstName, lastName, email, password);
//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return next(new ApiError(409, "User already exists"));
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//     });

//     const payload = {
//       sub: user._id,
//       email: user.email,
//       firstname: user.firstName,
//       lastname: user.lastName,
//     };

//     const accessToken = tokenService.generateAccessToken(payload);
//     const refreshTokenDoc = await tokenService.presistRefreshToken(user._id);
//     const refreshToken = tokenService.generateRefreshToken({
//       ...payload,
//       id: refreshTokenDoc._id,
//     });

//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       maxAge: 60 * 60 * 1000,
//       sameSite: "strict",
//     });

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//       sameSite: "strict",
//     });

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       data: {
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//         },
//         accessToken,
//         refreshToken,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     next(new ApiError(500, "Internal Server Error"));
//   }
// });

// export const LoginUser = asyncHandler(async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(new ApiError(422, "Validation Error", errors.array()));
//   }
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return next(new ApiError(401, "Invalid credentials"));
//     }

//     const isPasswordCorrect = await bcrypt.compare(password, user.password);
//     if (!isPasswordCorrect) {
//       return next(new ApiError(401, "Invalid credentials"));
//     }

//     const payload = {
//       sub: user._id,
//       email: user.email,
//       firstname: user.firstName,
//       lastname: user.lastName,
//     };

//     const accessToken = tokenService.generateAccessToken(payload);
//     const refreshTokenDoc = await tokenService.presistRefreshToken(user._id);
//     const refreshToken = tokenService.generateRefreshToken({
//       ...payload,
//       id: refreshTokenDoc._id,
//     });

//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       maxAge: 60 * 60 * 1000,
//       sameSite: "lax",
//     });

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//       sameSite: "lax",
//     });

//     res.status(200).json({
//       success: true,
//       message: "User logged in successfully",
//       data: {
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//         },
//         accessToken,
//         refreshToken,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     next(new ApiError(500, "Internal Server Error"));
//   }
// });

import { validationResult } from "express-validator";
import { ApiError } from "../helpers/ApiError.js";
import { asyncHandler } from "../helpers/asyncHandler.js";
import User from "../models/UserModel.js";
import Otp from "../models/OtpModelSchema.js"; // Import the Otp model
import tokenService from "../services/TokenService.js";
import bcrypt from "bcrypt";
import { sendOTP } from "../services/EmailService.js"; // Assuming the sendOTP function is implemented.

// export const RegisterUser = asyncHandler(async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(new ApiError(422, "Validation Error", errors.array()));
//   }

//   const { firstName, lastName, email, password, otp } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return next(new ApiError(409, "User already exists"));
//     }

//     // Generate OTP and send it to user's email
//     const generatedOtp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
//     await sendOTP(email, generatedOtp); // Send OTP email

//     // Store OTP and expiration time in the database
//     const otpDoc = await Otp.create({
//       userId: user._id,
//       otp: generatedOtp,
//       expiresAt: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
//     });

//     // Check if OTP provided by user is correct
//     if (otp !== generatedOtp.toString()) {
//       return next(new ApiError(400, "Invalid OTP"));
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       firstName,
//       lastName,
//       email,
//       password: hashedPassword,
//     });

//     const payload = {
//       sub: user._id,
//       email: user.email,
//       firstname: user.firstName,
//       lastname: user.lastName,
//     };

//     const accessToken = tokenService.generateAccessToken(payload);
//     const refreshTokenDoc = await tokenService.presistRefreshToken(user._id);
//     const refreshToken = tokenService.generateRefreshToken({
//       ...payload,
//       id: refreshTokenDoc._id,
//     });

//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       maxAge: 60 * 60 * 1000,
//       sameSite: "strict",
//     });

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//       sameSite: "strict",
//     });

//     res.status(201).json({
//       success: true,
//       message: "Welcome to Our Website! User registered successfully.",
//       data: {
//         user: {
//           id: user._id,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//         },
//         accessToken,
//         refreshToken,
//       },
//     });
//   } catch (err) {
//     console.error(err);
//     next(new ApiError(500, "Internal Server Error"));
//   }
// });
export const InitiateRegistration = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(409, "User already exists"));
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP

  // Store registration data and OTP in temporary storage
  const otpDoc = await Otp.create({
    email,
    otp,
    registrationData: {
      firstName,
      lastName,
      email,
      password, // Will be hashed after verification
    },
    expiresAt: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
  });

  // Send OTP to user's email
  await sendOTP(email, otp);

  res.status(200).json({
    success: true,
    message: "OTP sent to your email. Please verify to complete registration.",
    verificationId: otpDoc._id, // Send back the verification ID for reference
  });
});

export const VerifyOtpAndRegister = asyncHandler(async (req, res, next) => {
  const { verificationId, otp } = req.body;

  // Find valid OTP using the verification ID
  const otpDocument = await Otp.findOne({
    _id: verificationId,
    otp,
    expiresAt: { $gt: Date.now() },
  });

  if (!otpDocument) {
    return next(new ApiError(400, "Invalid or expired OTP"));
  }

  // Extract registration data
  const { registrationData } = otpDocument;

  // Double check user doesn't exist (edge case if someone registered between initiation and verification)
  const existingUser = await User.findOne({ email: registrationData.email });
  if (existingUser) {
    await Otp.deleteOne({ _id: verificationId });
    return next(new ApiError(409, "User already exists"));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(registrationData.password, 10);

  // Create user
  const user = await User.create({
    firstName: registrationData.firstName,
    lastName: registrationData.lastName,
    email: registrationData.email,
    password: hashedPassword,
  });

  // Clean up OTP
  await Otp.deleteOne({ _id: verificationId });

  // Generate tokens
  const payload = {
    sub: user._id,
    email: user.email,
    firstname: user.firstName,
    lastname: user.lastName,
  };

  const accessToken = tokenService.generateAccessToken(payload);
  const refreshTokenDoc = await tokenService.presistRefreshToken(user._id);
  const refreshToken = tokenService.generateRefreshToken({
    ...payload,
    id: refreshTokenDoc._id,
  });

  // Set cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
    sameSite: "strict",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
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
      },
      accessToken,
      refreshToken,
    },
  });
});

export const LoginUser = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(422, "Validation Error", errors.array()));
  }

  const { email, password, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(401, "Invalid credentials"));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return next(new ApiError(401, "Invalid credentials"));
    }

    // Generate OTP and send it to user's email
    const generatedOtp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
    await sendOTP(email, generatedOtp); // Send OTP email

    // Store OTP and expiration time in the database
    const otpDoc = await Otp.create({
      userId: user._id,
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
    });

    // Check if OTP provided by user is correct
    if (otp !== generatedOtp.toString()) {
      return next(new ApiError(400, "Invalid OTP"));
    }

    const payload = {
      sub: user._id,
      email: user.email,
      firstname: user.firstName,
      lastname: user.lastName,
    };

    const accessToken = tokenService.generateAccessToken(payload);
    const refreshTokenDoc = await tokenService.presistRefreshToken(user._id);
    const refreshToken = tokenService.generateRefreshToken({
      ...payload,
      id: refreshTokenDoc._id,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Welcome back to Our Website! You are successfully logged in.",
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

export const LogoutUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    await tokenService.deleteRefreshToken(req.user.id);
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
