const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, index: "text" },
  description: { type: String, required: true, index: "text" },
  category: { type: String, enum: ["House", "Apartment", "Villa"], default: "House", index: true },
  price: { type: Number, required: true, index: true },
  rentType: { type: String, enum: ["perMonth", "perNight"], default: "perMonth" },
  bedrooms: { type: Number, default: 1 },
  bathrooms: { type: Number, default: 1 },
  amenities: { type: [String], default: [] },
  location: {
    city: { type: String, index: true },
    state: String,
    address: String,
    fullLocation: String,
    coordinates: { type: [Number], index: "2dsphere" } // [lng, lat]
  },
  images: { type: [String], default: [] },
  documents: { type: [String], default: [] },
  status: { type: String, enum: ["available", "rented", "pending"], default: "pending", index: true },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// text index for title + description
propertySchema.index({ title: "text", description: "text" });

// ✅ Fix: use existing model if it exists
module.exports = mongoose.model("Property", propertySchema);


