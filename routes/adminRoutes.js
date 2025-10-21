const express = require("express");
const Property = require("../models/property");
const User = require("../models/users");
const Booking = require("../models/bookings");
const Notification = require("../models/notification");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const sendEmail = require("../utils/mailer"); // ✅ use existing mailer

const router = express.Router();

// ---------------------------------------------------------------------------
// GET: Admin dashboard
// ---------------------------------------------------------------------------
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const pendingProperties = await Property.find({ status: "pending" }).lean();
    const users = await User.find().lean();
    const bookings = await Booking.find()
      .populate("propertyId")
      .populate("renterId")
      .lean();

    res.render("admin/dashboard", {
      pendingProperties,
      users,
      bookings,
      pageTitle: "Admin Dashboard",
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------------------------
// POST: Approve Property
// ---------------------------------------------------------------------------
router.post("/properties/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const prop = await Property.findByIdAndUpdate(
      req.params.id,
      { status: "available" },
      { new: true }
    ).populate("ownerId");

    if (!prop) return res.status(404).send("Property not found");

    // ✅ Create notification
    await Notification.create({
      receiverId: prop.ownerId._id,
      propertyId: prop._id,
      message: `Your property "${prop.title}" has been approved and is now listed.`,
    });

    // ✅ Send email to owner
    try {
      await sendEmail(
        prop.ownerId.email,
        "Property Approved - Home Rental",
        `
        <h2>Hello ${prop.ownerId.name},</h2>
        <p>Good news! Your property <b>${prop.title}</b> has been approved by the admin.</p>
        <p><b>Property ID:</b> ${prop._id}</p>
        <p><b>Status:</b> Approved ✅</p>
        <p>Your listing is now live and visible to renters.</p>
        <br>
        <p>— Home Rental Admin Team</p>
        `
      );
    } catch (emailErr) {
      console.error("Email to owner (approval) failed:", emailErr);
    }

    res.redirect("/admin");
  } catch (err) {
    console.error("Error approving property:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------------------------
// POST: Reject Property
// ---------------------------------------------------------------------------
router.post("/properties/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const prop = await Property.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("ownerId");

    if (!prop) return res.status(404).send("Property not found");

    // ✅ Create notification
    await Notification.create({
      receiverId: prop.ownerId._id,
      propertyId: prop._id,
      message: `Your property "${prop.title}" has been rejected by the admin.`,
    });

    // ✅ Send email to owner
    try {
      await sendEmail(
        prop.ownerId.email,
        "Property Rejected - Home Rental",
        `
        <h2>Hello ${prop.ownerId.name},</h2>
        <p>We’re sorry to inform you that your property <b>${prop.title}</b> has been rejected by the admin.</p>
        <p><b>Property ID:</b> ${prop._id}</p>
        <p><b>Status:</b> Rejected ❌</p>
        <p>Please review your listing and ensure all details meet our platform's requirements before resubmitting.</p>
        <br>
        <p>— Home Rental Admin Team</p>
        `
      );
    } catch (emailErr) {
      console.error("Email to owner (rejection) failed:", emailErr);
    }

    res.redirect("/admin");
  } catch (err) {
    console.error("Error rejecting property:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
