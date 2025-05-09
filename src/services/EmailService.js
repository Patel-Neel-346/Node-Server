import nodemailer from "nodemailer";
import { ApiError } from "../helpers/ApiError.js";
import { config } from "../Config/index.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL,
    pass: config.EMAIL_PASSWORD,
  },
  secure: true,
});

export const sendOTP = async (email, otp, purpose = "Registration") => {
  const subject =
    purpose === "Password Reset"
      ? "Password Reset Request - Your OTP Code"
      : "Account Verification - Your OTP Code";

  const actionText =
    purpose === "Password Reset"
      ? "reset your password"
      : "verify your account";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
        }
        .header {
          background-color: #4a76a8;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          padding: 20px;
        }
        .otp-code {
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 5px;
          color: #4a76a8;
          text-align: center;
          margin: 20px 0;
          padding: 10px;
          background-color: #f7f7f7;
          border-radius: 5px;
        }
        .footer {
          font-size: 12px;
          color: #777777;
          text-align: center;
          margin-top: 20px;
          border-top: 1px solid #e0e0e0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${purpose} Code</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>Your OTP code to ${actionText} is:</p>
          <div class="otp-code">${otp}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Auth Service" <${config.EMAIL}>`,
    to: email,
    subject: subject,
    html: html,
  };

  try {
    await transporter.verify();

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${email}: ${info.messageId}`);

    return info;
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new ApiError(
      500,
      `Failed to send ${purpose} OTP email: ${err.message}`
    );
  }
};
