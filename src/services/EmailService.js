// import nodemailer from "nodemailer";
// import { ApiError } from "../helpers/ApiError.js";
// import { config } from "../Config/index.js";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: config.EMAIL,
//     pass: config.EMAIL_PASSWORD,
//   },
// });

// export const sendOTP = async (email, otp) => {
//   const mailOptions = {
//     from: config.EMAIL, // Sender's email address
//     to: email, // Recipient's email address
//     subject: "Your OTP Code",
//     html: `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 10 minutes.</p>`, // Email body
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//   } catch (err) {
//     console.error("Error sending OTP email:", err);
//     throw new ApiError(500, "Failed to send OTP email");
//   }
// };

import nodemailer from "nodemailer";
import { ApiError } from "../helpers/ApiError.js";
import { config } from "../Config/index.js";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL,
    pass: config.EMAIL_PASSWORD,
  },
  // Enable secure SSL/TLS connection
  secure: true,
});

export const sendOTP = async (email, otp, purpose = "Registration") => {
  // Generate email subject based on purpose
  const subject =
    purpose === "Password Reset"
      ? "Password Reset Request - Your OTP Code"
      : "Account Verification - Your OTP Code";

  // Generate action text based on purpose
  const actionText =
    purpose === "Password Reset"
      ? "reset your password"
      : "verify your account";

  // Create HTML email template with better styling
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
    from: `"Auth Service" <${config.EMAIL}>`, // Sender name and email
    to: email, // Recipient's email address
    subject: subject,
    html: html,
  };

  try {
    // Verify connection configuration
    await transporter.verify();

    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);

    // Log message ID for debugging if needed
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
