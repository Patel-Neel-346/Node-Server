import nodemailer from "nodemailer";
import { ApiError } from "../helpers/ApiError.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "neelpatel.dds@gmail.com",
    pass: "ywcm daej ybsi ssuo",
  },
});

export const sendOTP = async (email, otp) => {
  const mailOptions = {
    from: "neelpatel.dds@gmail.com", // Sender's email address
    to: email, // Recipient's email address
    subject: "Your OTP Code",
    html: `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`, // Email body
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new ApiError(500, "Failed to send OTP email");
  }
};
