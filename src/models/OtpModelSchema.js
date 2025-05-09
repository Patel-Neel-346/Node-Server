// src/models/OtpModelSchema.js
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function () {
      return (
        this.notificationMethods && this.notificationMethods.includes("email")
      );
    },
  },
  phoneNumber: {
    type: String,
    required: function () {
      return (
        this.notificationMethods && this.notificationMethods.includes("sms")
      );
    },
  },
  // Track which methods were used to send the OTP
  notificationMethods: {
    type: [String],
    enum: ["email", "sms", "both"],
    default: ["email"], // Default to email for backward compatibility
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["registration", "login", "password-reset"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
  },
  // If the OTP is for existing users (login, password reset)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Add index for quick searching and automatic expiry
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model("Otp", OtpSchema);
export default Otp;
