const express = require("express");
const mongoose = require("mongoose");
const Property = require("../models/property");
const Cart = require("../models/cart");
const { isAuthenticated, isRenter } = require("../middlewares/auth");
const router = express.Router();

router.get("/", isAuthenticated, isRenter, async (req, res) => {
  const cart = await Cart.findOne({ renterId: req.session.userId }).populate("items.propertyId").lean();
  const cartMessage = req.session.cartMessage;
  req.session.cartMessage = null;
  res.render("cart/index", { cart, cartMessage });
});



router.post("/add/:propertyId", isAuthenticated, isRenter, async (req, res) => {
  const renterId = req.session.userId;
  let propertyId;
  try {
    propertyId = new mongoose.Types.ObjectId(req.params.propertyId);
  } catch {
    return res.status(400).send("Invalid property ID");
  }
  // Check property exists and is available
  const property = await Property.findOne({ _id: propertyId, status: "available" });
  if (!property) return res.status(404).send("Property not found or not available");

  let cart = await Cart.findOne({ renterId });
  if (!cart) {
    cart = new Cart({ renterId, items: [{ propertyId }] });
  } else {
    if (cart.items.some(i => i.propertyId.equals(propertyId))) {
      // Already in cart
      req.session.cartMessage = "This property is already in your cart.";
      return res.redirect("/cart");
    }
    cart.items.push({ propertyId });
  }
  await cart.save();
  req.session.cartMessage = null;
  // TODO: create notification for owner
  res.redirect("/cart");
});

router.post("/remove/:propertyId", isAuthenticated, isRenter, async (req, res) => {
  const renterId = req.session.userId;
  const propertyId = req.params.propertyId;
  await Cart.updateOne({ renterId }, { $pull: { items: { propertyId } } });
  res.redirect("/cart");
});

module.exports = router;
