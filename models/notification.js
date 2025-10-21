// const mongoose = require("mongoose");

// const notifSchema = new mongoose.Schema({
//   bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
// propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
// receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
// message: String,
//   status: { type: String, enum: ["unread", "read"], default: "unread" },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.models.Notification || mongoose.model("Notification", notifSchema);
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  message: String,
  status: { type: String, default: "unread" },
}, { timestamps: true });

module.exports = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

