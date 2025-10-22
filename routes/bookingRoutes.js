const express = require("express");
const Booking = require("../models/bookings");
const Property = require("../models/property");
const Notification = require("../models/notification");
const User = require("../models/users");
const { isAuthenticated, isRenter } = require("../middlewares/auth");
const sendEmail = require("../utils/mailer"); // ✅ using your existing mailer utility

const router = express.Router();

// ---------------------------------------------------------------------------
// GET: Booking details page
// ---------------------------------------------------------------------------
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("propertyId")
      .populate("renterId")
      .populate("ownerId");

    if (!booking) return res.status(404).send("Booking not found");

    const property = booking.propertyId;
    if (!property) return res.status(404).send("Property not found");

    // Only owner or renter can view
    if (
      String(booking.renterId._id) !== String(req.session.userId) &&
      String(property.ownerId) !== String(req.session.userId)
    ) {
      return res.status(403).send("Not allowed");
    }

    res.render("bookings/details", {
      booking,
      property,
      alreadyBooked: false,
      currentUserRole: req.session.role,
      currentUserId: req.session.userId,
    });
  } catch (err) {
    console.error("Error loading booking details:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------------------------
// POST: Create new booking (Renter books property)
// ---------------------------------------------------------------------------
router.post("/create/:propertyId", isAuthenticated, isRenter, async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const prop = await Property.findById(propertyId).populate("ownerId", "name email");

    if (!prop || prop.status !== "available") {
      return res.status(400).send("Property not available");
    }

    const ownerId = String(prop.ownerId._id);

    const existingBooking = await Booking.findOne({
      renterId: req.session.userId,
      propertyId,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return res.status(400).render("bookings/details", {
        booking: existingBooking,
        property: prop,
        alreadyBooked: true,
        currentUserRole: "renter",
        currentUserId: req.session.userId,
      });
    }

    const booking = new Booking({
      renterId: req.session.userId,
      propertyId,
      ownerId,
      status: "pending",
      payment: {
        amount: prop.price,
        method: req.body.method || "offline",
        status: "unpaid",
      },
    });

    await booking.save();

    await Notification.create({
      receiverId: prop.ownerId,
      propertyId: prop._id,
      bookingId: booking._id,
      message: `New booking request for your property: ${prop.title}`,
    });

    // ✅ Send email
    try {
      console.log("Sending email to owner:", prop.ownerId.email);

      await sendEmail(
        prop.ownerId.email,
        "New Booking Request Received",
        `
          <h2>Hello ${prop.ownerId.name},</h2>
          <p>You have received a new booking request for your property: <b>${prop.title}</b>.</p>
          <p><b>Booking ID:</b> ${booking._id}</p>
          <p>Visit your dashboard to review and approve or reject the booking.</p>
          <p>— Home Rental System</p>
        `
      );

      console.log("✅ Email sent to owner successfully");
    } catch (emailErr) {
      console.error("❌ Email to owner failed:", emailErr);
    }

    res.redirect("/bookings/" + booking._id);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).send("Server error");
  }
});


// ---------------------------------------------------------------------------
// POST: Owner approves booking
// ---------------------------------------------------------------------------
router.post("/:id/approve", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("propertyId")
      .populate("renterId")
      .populate("ownerId");
    if (!booking) return res.status(404).send("Booking not found");

    const property = booking.propertyId;
    if (!property) return res.status(404).send("Property not found");

    // Only property owner can approve
    if (String(property.ownerId) !== String(req.session.userId)) {
      return res.status(403).send("Not allowed");
    }

    booking.status = "confirmed";
    await booking.save();

    property.status = "rented";
    await property.save();

    // ✅ Notify renter
    await Notification.create({
      receiverId: booking.renterId,
      propertyId: property._id,
      bookingId: booking._id,
      message: `Your booking for ${property.title} has been approved!`,
    });

    // ✅ Send email to renter with owner details
    try {
      await sendEmail(
        booking.renterId.email,
        "Booking Approved",
        `
        <h2>Good news, ${booking.renterId.name}!</h2>
        <p>Your booking for <b>${property.title}</b> has been approved by the owner.</p>
        <p><b>Booking ID:</b> ${booking._id}</p>
        <p><b>Owner Name:</b> ${booking.ownerId.name}</p>
        <p><b>Owner Phone:</b> ${booking.ownerId.phone || "Not provided"}</p>
        <p>Please contact the owner to proceed further.</p>
        <p>— Home Rental System</p>
        `
      );
    } catch (emailErr) {
      console.error("Email to renter failed:", emailErr);
    }

    res.redirect("/bookings/" + booking._id);
  } catch (err) {
    console.error("Error approving booking:", err);
    res.status(500).send("Server error");
  }
});

// ---------------------------------------------------------------------------
// POST: Owner rejects booking
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// POST: Owner rejects booking
// ---------------------------------------------------------------------------
router.post("/:id/reject", isAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("propertyId")
      .populate("renterId")
      .populate("ownerId");
    if (!booking) return res.status(404).send("Booking not found");

    const property = booking.propertyId;
    if (!property) return res.status(404).send("Property not found");

    // Only property owner can reject
    if (String(property.ownerId) !== String(req.session.userId)) {
      return res.status(403).send("Not allowed");
    }

    booking.status = "rejected";
    await booking.save();

    // 🟢 Reset property status to available
    property.status = "available";
    await property.save();

    // ✅ Notify renter
    await Notification.create({
      receiverId: booking.renterId,
      propertyId: property._id,
      bookingId: booking._id,
      message: `Your booking for ${property.title} has been rejected.`,
    });

    // ✅ Send email to renter
    try {
      await sendEmail(
        booking.renterId.email,
        "Booking Rejected",
        `
        <h2>Hello ${booking.renterId.name},</h2>
        <p>Unfortunately, your booking for <b>${property.title}</b> has been rejected by the owner.</p>
        <p><b>Booking ID:</b> ${booking._id}</p>
        <p><b>Owner Name:</b> ${booking.ownerId.name}</p>
        <p>We encourage you to explore other available properties on our platform.</p>
        <p>— Home Rental System</p>
        `
      );
      console.log("✅ Email sent to renter for rejection:", booking.renterId.email);
    } catch (emailErr) {
      console.error("Email rejection notice failed:", emailErr);
    }

    res.redirect("/bookings/" + booking._id);
  } catch (err) {
    console.error("Error rejecting booking:", err);
    res.status(500).send("Server error");
  }
});


module.exports = router;
