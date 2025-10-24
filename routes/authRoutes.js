const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/users");
const router = express.Router();
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/mailer");
require("dotenv").config();

// ======================= SHOW SIGNUP FORM =======================
router.get("/signup", (req, res) => {
  res.render("auth/signup");
});

// ======================= SIGNUP =======================
router.post(
  "/signup",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).render("auth/signup", { errors: errors.array() });

    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing)
        return res
          .status(400)
          .render("auth/signup", { errors: [{ msg: "Email already used" }] });

      const user = new User({
        name,
        email: email.toLowerCase().trim(),
        password,
        role,
      });

      await user.save();

      // ✅ Send welcome email
    await sendEmail(
  user.email,
  "🎉 Welcome to Home Rental!",
  `
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    background-color: #f4f6f8;
    padding: 40px 0;
    text-align: center;
  ">
    <div style="
      background-color: #ffffff;
      max-width: 600px;
      margin: auto;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    ">
      <img src="https://i.ibb.co/BwYSttv/home-rental-logo.png" alt="Home Rental Logo" width="100" style="margin-bottom: 15px;" />
      
      <h2 style="color: #2c3e50;">Welcome, ${user.name}! 👋</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        We’re thrilled to have you join <b>Home Rental</b> — your one-stop platform for finding and listing rental properties with ease.
      </p>

      <a href="https://localhost:5000/properties" 
         style="
           display: inline-block;
           margin-top: 25px;
           background-color: #007bff;
           color: #fff;
           text-decoration: none;
           padding: 12px 25px;
           border-radius: 6px;
           font-size: 16px;
           transition: background-color 0.3s ease;
         ">
        🏠 Explore Properties
      </a>

      <p style="margin-top: 30px; font-size: 14px; color: #999;">
        If you have any questions, feel free to reach out at 
        <a href="mailto:support@homerental.com" style="color:#007bff; text-decoration:none;">support@homerental.com</a>
      </p>
    </div>

    <p style="font-size: 12px; color: #aaa; margin-top: 20px;">
      © ${new Date().getFullYear()} Home Rental. All rights reserved.
    </p>
  </div>
  `
);


      // req.session.userId = user._id;
      // req.session.role = user.role;
      res.redirect("/auth/login");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// ======================= SHOW LOGIN FORM =======================
router.get("/login", (req, res) => {
  res.render("auth/login");
});

// ======================= LOGIN =======================
router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password");

      if (!user)
        return res.status(401).render("auth/login", { error: "Invalid credentials" });

      // console.log("USER FOUND:", {
      //   _id: user._id,
      //   email: user.email,
      //   password: user.password,
      // });

      const ok = await user.comparePassword(password);
      console.log("PASSWORD MATCH RESULT:", ok);

      if (!ok)
        return res.status(401).render("auth/login", { error: "Invalid credentials" });

      req.session.userId = user._id;
      req.session.role = user.role;
      res.redirect("/properties");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  }
);

// ======================= LOGOUT =======================
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ======================= FORGOT PASSWORD FORM =======================
router.get("/forgetpassword", (req, res) => {
  res.render("auth/forgetpassword");
});

// ======================= HANDLE FORGOT PASSWORD =======================
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).render("auth/forgetpassword", {
        error: "No account found with that email.",
        success: null,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetLink = `${req.protocol}://${req.get("host")}/auth/reset-password/${token}`;

    await sendEmail(
      user.email,
      "Reset Your Password - Home Rental",
      `
      <h3>Hello ${user.name},</h3>
      <p>You requested to reset your password.</p>
      <p>Click below to set a new password (valid for 15 minutes):</p>
      <a href="${resetLink}" style="background:#007bff;color:#fff;padding:10px 15px;text-decoration:none;border-radius:5px;">Reset Password</a>
      `
    );

    res.render("auth/forgetpassword", {
      success: "Password reset link has been sent to your email.",
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("auth/forgetpassword", {
      error: "Something went wrong, please try again later.",
      success: null,
    });
  }
});


// ======================= RESET PASSWORD PAGE =======================
router.get("/reset-password/:token", async (req, res) => {
  const user = await User.findOne({
    resetToken: req.params.token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user) return res.status(400).send("Invalid or expired reset link");

  res.render("auth/resetpassword", { token: req.params.token });
});

// ======================= HANDLE RESET PASSWORD SUBMISSION =======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).send("Invalid or expired token");

    user.password = req.body.password; // ✅ will be auto-hashed by pre-save
    user.resetToken = null;
    user.resetTokenExpire = null;
    await user.save();

    await sendEmail(
      user.email,
      "Password Changed Successfully",
      `
      <h3>Hello ${user.name},</h3>
      <p>Your password has been successfully updated.</p>
      <p>If this wasn’t you, please contact support immediately.</p>
      `
    );

    res.render("auth/login", { success: "Password successfully updated! Please log in." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
