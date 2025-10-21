// routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const Booking = require("../models/bookings");
const Property = require("../models/property");
const User = require("../models/users");
const { isAuthenticated } = require("../middlewares/auth");

// =========================
// SHOW ALL NOTIFICATIONS
// =========================
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.find({ receiverId: req.session.userId })
      .populate({
        path: "bookingId",
        populate: { path: "propertyId", select: "title price location ownerId" },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.render("notifications/index", {
      notifications,
      userRole: req.session.role || "renter",
    });
  } catch (err) {
    console.error("❌ Notification list error:", err);
    res.status(500).send("Server Error");
  }
});

// =========================
// VIEW SINGLE NOTIFICATION DETAILS
// =========================
// =========================
// VIEW SINGLE NOTIFICATION DETAILS
// =========================
router.get("/view/:id", isAuthenticated, async (req, res) => {
  try {
    // ✅ Find notification
    const notification = await Notification.findById(req.params.id)
      .populate({
        path: "bookingId",
        populate: [
          { path: "propertyId", model: "Property" },
          { path: "renterId", model: "User" },
        ],
      });

    if (!notification) return res.status(404).send("Notification not found");

    // ✅ Mark as read (only update the status, no other logic touched)
    if (notification.status === "unread") {
      notification.status = "read";
      await notification.save();
    }

    const booking = notification.bookingId || {};
    const property = booking.propertyId || {};
    const renter = booking.renterId || {};
    let owner = {};

    if (property && property.ownerId) {
      owner = (await User.findById(property.ownerId).lean()) || {};
    }

    const currentUserId = req.session.userId?.toString();
    const isOwner = currentUserId === property?.ownerId?.toString();
    const isRenter = currentUserId === renter?._id?.toString();

    res.render("notifications/view", {
      notification: notification.toObject(),
      booking,
      property,
      renter,
      owner,
      isOwner,
      isRenter,
      userRole: req.session.role,
    });
  } catch (err) {
    console.error("❌ Notification view error:", err);
    res.status(500).send("Error loading notification details");
  }
});


// =========================
// DELETE NOTIFICATION
// =========================
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.redirect("/notifications");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
