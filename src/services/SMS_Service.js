import twilio from "twilio";
import { ApiError } from "../helpers/ApiError.js";
import { config } from "../Config/index.js";

const twiliClient = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

export const SendSMS = async (phoneNumber, otp, purpose = "Registration") => {
  const appName = config.APP_NAME || "Auth";

  let formattedPhoneNumber = phoneNumber;

  if (!phoneNumber.startsWith("+")) {
    formattedPhoneNumber = `+${phoneNumber}`;
  }

  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(formattedPhoneNumber)) {
    throw new ApiError(
      400,
      `Invalid phone number format: ${phoneNumber}. Must be in E.164 format (e.g., +919979033075).`
    );
  }

  // Create a more engaging and professional message
  const message =
    purpose === "Password Reset"
      ? `${appName}: Your password reset code is ${otp}. Use this code to reset your password. Valid for 10 minutes only. Need help? Contact our support team.`
      : `${appName}: Your verification code is ${otp}. Welcome aboard! This code expires in 10 minutes. For assistance, visit our help center or reply to this message.`;

  try {
    if (
      !config.TWILIO_PHONE_NUMBER ||
      !config.TWILIO_PHONE_NUMBER.startsWith("+")
    ) {
      throw new Error(
        "Invalid Twilio phone number format. Must start with + and country code."
      );
    }

    const result = await twiliClient.messages.create({
      body: message,
      from: config.TWILIO_PHONE_NUMBER || "+15708105641",
      to: formattedPhoneNumber,
    });

    console.log(`SMS sent to ${formattedPhoneNumber}: ${result.sid}`);
    return result;
  } catch (error) {
    console.error(`Twilio SMS Error: ${error.code} - ${error.message}`);

    if (error.code === 21212) {
      throw new ApiError(
        400,
        `Invalid phone number format. Please check your Twilio sender number configuration.`
      );
    } else if (error.code === 21606) {
      throw new ApiError(400, `This number is not a valid mobile number.`);
    } else {
      throw new ApiError(
        500,
        `Failed to send ${purpose} OTP SMS: ${error.message}`
      );
    }
  }
};
