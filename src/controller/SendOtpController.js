import { asyncHandler } from "../helpers/asyncHandler.js";
import { sendOTP } from "../services/EmailService.js";
import Otp from "../models/OtpModelSchema.js";

export const sendOtpToEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ApiError(400, "Email is required"));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Delete any previous OTPs for the same email
  await Otp.deleteMany({ email });

  await Otp.create({
    email,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  await sendOTP(email, otp);

  res.status(200).json({
    success: true,
    message: `OTP has been sent to ${email}`,
  });
});
