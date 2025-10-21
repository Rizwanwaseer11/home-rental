const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({
  renterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "property" },
      addedAt: { type: Date, default: Date.now }
    }
  ]
});
module.exports = mongoose.model("Cart", cartSchema);
