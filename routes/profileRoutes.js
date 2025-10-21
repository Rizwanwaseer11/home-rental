const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/users");
const { isAuthenticated } = require("../middlewares/auth");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "public", "uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Show profile
router.get("/me", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId).lean();
  res.render("profile/me", { user });
});

// Add GET route for edit profile
router.get("/me/edit", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId).lean();
  res.render("profile/edit", { user });
});

// Unified profile update route
router.post("/me/edit", isAuthenticated, upload.single("profilePic"), async (req, res) => {
  try {
    console.log(req.body)
    const { name, email, phone, password } = req.body;
    const user = await User.findById(req.session.userId); // Do NOT use .lean() here
    let error = null;

    // Only update fields that are provided
    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        error = "Email already in use.";
      } else {
        user.email = email;
      }
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (req.file) {
      user.profilePic = "/uploads/" + req.file.filename;
    }
    if (password && password.length > 0) {
      if (password.length < 6) {
        error = "Password must be at least 6 characters.";
      } else {
        user.password = password;
      }
    }

    await user.save();

    // ✅ Add this line — keeps session updated so navbar shows new image
    req.session.user = user.toObject();

    const userData = await User.findById(req.session.userId).lean();
    res.render("profile/me", { user: userData, error });
  } catch (error) {
    const userData = await User.findById(req.session.userId).lean();
    res.status(403).render("profile/me", { 
      user: userData, 
      error: "Invalid form submission. Please try again." 
    });
  }
});


module.exports = router;