import twilio from "twilio";
import { ApiError } from "../helpers/ApiError";
import { config } from "../Config";

const twiliClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

export const SendSMS = async (phoneNumber, otp, purpose = "Registration") => {
  const message =
    purpose === "Password Reset"
      ? `Your password reset OTP code is: ${otp}. This code will expire in 10 minutes.`
      : `Your account verification OTP code is: ${otp}. This code will expire in 10 minutes.`;

  try {
    const result = await twiliClient.messages.create({
      body: message,
      from: config.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS Send to ${phoneNumber}:${result.sid}`);
    return result;
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      `Failed to Send ${purpose} OTP SMS:${error.message}`
    );
  }
};
