import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";
import fetch from "node-fetch";

dotenv.config();

/**
 * Sends an email using Brevo API (works on Render).
 * @param {string} to - recipient email
 * @param {string} subject - subject line
 * @param {string} text - plain text version
 * @param {string} html - HTML version
 */
export const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "ResolveX", email: "hbro2126@gmail.com" },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Email sending failed:", data);
      throw new ApiError(500, `Failed to send email: ${data.message || "Unknown error"}`);
    }

    console.log(`✅ Email sent successfully to ${to}`);
    return data;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new ApiError(500, `Failed to send email to ${to}: ${error.message}`);
  }
};