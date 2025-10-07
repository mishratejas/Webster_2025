import twilio from "twilio";
import { ApiError } from "./ApiError.js";

// Create client lazily (when first needed)
let twilioClient = null;
let credentialsChecked = false;

const getTwilioClient = () => {
  if (!credentialsChecked) {
    credentialsChecked = true;

    const sid = process.env.TWILIO_SID?.trim();
    const auth = process.env.TWILIO_AUTH?.trim();
    const phone = process.env.TWILIO_PHONE?.trim();

    if (sid && auth && phone) {
      try {
        twilioClient = twilio(sid, auth);
        console.log("Twilio SMS configured");
      } catch (error) {
        console.log("Twilio SMS disabled - Invalid credentials");
        twilioClient = null;
      }
    } else {
      console.log("Twilio SMS disabled - Missing credentials in .env");
    }
  }

  return twilioClient;
};

const sendSMS = async (to, message) => {
  const client = getTwilioClient();

  try {
    if (!client) {
      if (process.env.NODE_ENV === "development") {
        console.log("SMS (Dev Mode) to:", to);
        console.log("Message:", message);
        return;
      }
      throw new Error("Twilio not configured");
    }

    if (!to || !message) {
      throw new Error("Recipient phone number and message are required.");
    }

    const phoneNumber = to.startsWith("+") ? to : `+91${to}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE.trim(),
      to: phoneNumber,
    });

    console.log(`SMS sent successfully to ${phoneNumber}`);
  } catch (error) {
    console.error("SMS sending failed:", error.message);

    if (process.env.NODE_ENV !== "development") {
      throw new ApiError(500, `Failed to send SMS to ${to}: ${error.message}`);
    }
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
const sendOTP = async (to) => {
  const otp = generateOTP();
  const message = `Your verification code is ${otp}. It will expire in 5 minutes.`;
  await sendSMS(to, message);
  return otp; // return OTP so you can store/verify it later
};

export { sendSMS, sendOTP, generateOTP };
