// utils/sendEmail.js
const { Resend } = require("resend");
require("dotenv").config();




const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend API.
 * Works perfectly on Railway (no SMTP needed).
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML body of the email
 */
 const sendEmail = async (to, subject, html) => {
  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", data.id || "no-id");
    return data;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Email sending failed: " + error.message);
  }
};
module.exports = sendEmail;




