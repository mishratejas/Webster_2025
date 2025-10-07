import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

export const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Support System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new ApiError(500, `Failed to send email to ${to}: ${error.message}`);
  }
};
