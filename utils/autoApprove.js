// Auto-approve pending properties after 1 hour and notify owner
const mongoose = require("mongoose");
const Property = require("../models/property");
const Notification = require("../models/notification");
const User = require("../models/users");
const sendEmail = require("../utils/mailer"); // ✅ added for nodemailer integration

async function autoApprovePendingProperties() {
  try {
    // Find properties pending for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const pendingProps = await Property.find({
      status: "pending",
      createdAt: { $lte: oneHourAgo },
    });

    for (const prop of pendingProps) {
      prop.status = "available";
      await prop.save();

      await Notification.create({
        receiverId: prop.ownerId,
        propertyId: prop._id,
        message: `Your house (ID: ${prop._id}) is now listed on the site.`,
      });

      // ✅ Send email to property owner
      try {
        const owner = await User.findById(prop.ownerId);
        if (owner && owner.email) {
          await sendEmail(
            owner.email,
            "Property Automatically Approved",
            `
            <h3>Hello ${owner.name || "User"},</h3>
            <p>Your property <strong>${prop.title}</strong> has been automatically approved because it remained pending for over an hour.</p>
            <p><strong>Property ID:</strong> ${prop._id}</p>
            <p><strong>Status:</strong> Approved ✅</p>
            <br/>
            <p>Your property is now visible to renters on the platform.</p>
            <p>— Home Rental Team</p>
            `
          );
          console.log(`📧 Auto-approval email sent to: ${owner.email}`);
        }
      } catch (emailErr) {
        console.error("❌ Failed to send auto-approval email:", emailErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Error in autoApprovePendingProperties:", err);
  }
}

module.exports = autoApprovePendingProperties;
