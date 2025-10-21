
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const rateLimit = require('express-rate-limit');


// Expose session and user info to EJS views
const Notification = require("./models/notification");

const Property = require("./models/property");

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const cartRoutes = require("./routes/cartRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const ordersRoutes = require("./routes/ordersRoutes");


const autoApprovePendingProperties = require('./utils/autoApprove');
const app = express();


app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use(express.static(path.join(__dirname, "public")));
// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middlewares - order is important
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride("_method"));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// session configuration for login through https:
app.set('trust proxy', 1);

console.log("✅ MONGO_URI in server.js:", process.env.MONGO_URI);
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI not found in environment!");
}

// 1. Session middleware (must be first)
// app.use(session({
//   secret: process.env.SESSION_SECRET || "keyboardcat",
//   resave: false,
//   saveUninitialized: false,
//   store: MongoStore.create({
//     mongoUrl: process.env.MONGO_URI,
//     collectionName: "sessions",
    
//   }),
 
//   cookie: {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production', // HTTPS only in production
//     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // allow cross-site cookies
//     maxAge: 1000 * 60 * 60 * 24 // 1 day
//   }
// }));


//// ---------------------------------------------
// 🔹 Global Middleware: Pass User + Notifications to All Views
// ---------------------------------------------
app.use(async (req, res, next) => {
  try {
    if (req.session.userId) {
      res.locals.currentUserId = req.session.userId;
      res.locals.currentUserRole = req.session.role;
      res.locals.currentUser = req.session.user || null;

      const unreadCount = await Notification.countDocuments({
        receiverId: req.session.userId,
        status: "unread"
      });

      res.locals.unreadCount = unreadCount;
    } else {
      res.locals.currentUserId = null;
      res.locals.currentUserRole = null;
      res.locals.currentUser = null;
      res.locals.unreadCount = 0;
    }
    next();
  } catch (err) {
    console.error("🔴 Error in navbar notification middleware:", err);
    next();
  }
});

// Remove CSRF error handler and replace with general security error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`
    <script>
      alert('Security validation failed. Please try again.');
      window.location.href = '/';
    </script>
  `);
});

// Routes (after all middleware)
app.use("/auth", authRoutes);
app.use("/properties", propertyRoutes);
app.use("/cart", cartRoutes);
app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", ordersRoutes);
app.use("/profile", profileRoutes);
app.use("/notifications", notificationRoutes);


// home

app.get("/", async (req, res) => {
  try{ res.redirect("/properties");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// About Us page
app.get("/about", (req, res) => {
  res.render("about");
});

// DB connect

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    const store = MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: "sessions",
    });

    app.use(session({
      secret: process.env.SESSION_SECRET || "keyboardcat",
      resave: false,
      saveUninitialized: false,
      store,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24
      }
    }));

    // Start server only after DB + session store ready
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });
