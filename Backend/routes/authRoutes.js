const express = require("express");
const { body, validationResult } = require("express-validator");
const authService = require("../services/authService");
const auth = require("../middleware/auth");
const User = require("../models/User");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

// S3 config for profile picture upload
const s3 = new AWS.S3();
const uploadProfilePic = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    key: function (req, file, cb) {
      cb(null, `profile-pics/${Date.now()}_${file.originalname}`);
    },
  }),
});

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors.array(),
    });
  }
  next();
};

// Sign up route
router.post(
  "/signup",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("phoneNumber")
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage("Please provide a valid phone number"),
    body("role")
      .isIn(["user", "admin", "organizer"])
      .withMessage("Role must be user, admin, or organizer"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { name, email, password, phoneNumber, role } = req.body;

      const result = await authService.registerUser({
        name,
        email,
        password,
        phoneNumber,
        role,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Sign in route
router.post(
  "/signin",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await authService.loginUser(email, password);

      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Forgot password route
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Reset password route
router.post(
  "/reset-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const result = await authService.resetPassword(email, otp, newPassword);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Verify OTP route
router.post(
  "/verify-otp",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyOTP(email, otp);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Verify email OTP route
router.post(
  "/verify-email",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage("OTP must be 6 digits"),
    handleValidationErrors,
  ],
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmailOTP(email, otp);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Get user profile route (protected)
router.get("/profile", auth, async (req, res) => {
  try {
    const result = await authService.getUserProfile(req.user._id);

    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
});

// Update user profile (name, password, profile picture)
router.patch(
  "/profile",
  auth,
  uploadProfilePic.single("profilePic"),
  async (req, res) => {
    try {
      const { name, currentPassword, newPassword, phoneNumber } = req.body;
      const profilePic = req.file ? req.file.location : undefined;
      const result = await authService.updateUserProfile({
        userId: req.user._id,
        name,
        currentPassword,
        newPassword,
        profilePic,
        phoneNumber,
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Get current user info (requires auth)
router.get("/me", auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toJSON(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user info",
    });
  }
});

// --- Admin User Management ---

// Fetch all users, grouped by role (admin only)
// TODO: Add admin authentication middleware for production
router.get("/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name email role isEmailVerified createdAt"
    );
    const grouped = { admin: [], organizer: [], user: [] };
    users.forEach((u) => grouped[u.role].push(u));
    res.json({ success: true, users: grouped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add a new user (admin/organizer), send invite email (admin only)
// TODO: Add admin authentication middleware for production
router.post("/users", async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, email, and role are required.",
        });
    }
    if (!["admin", "organizer"].includes(role)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Role must be 'admin' or 'organizer'.",
        });
    }
    const result = await authService.createUserAndSendInvite({
      name,
      email,
      role,
    });
    res.json({
      success: true,
      user: result.user,
      message: "Invite sent successfully.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update user role (admin only)
// TODO: Add admin authentication middleware for production
router.patch("/users/role", async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Email and role are required." });
    }
    if (!["admin", "organizer", "user"].includes(role)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Role must be 'admin', 'organizer', or 'user'.",
        });
    }
    // Find user
    const user = await require("../models/User").findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    if (user.role === role) {
      return res
        .status(400)
        .json({ success: false, message: `User is already a ${role}.` });
    }
    user.role = role;
    await user.save();
    // Send notification email about role change
    await require("../services/emailService").sendOTPEmail(
      email,
      "",
      "rolechange",
      role
    );
    res.json({
      success: true,
      message: `User role updated to ${role} and notified by email.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Additional User Fetch Endpoints ---
// TODO: Add admin authentication middleware for production
router.get("/users/all", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name email role isEmailVerified createdAt"
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// TODO: Add admin authentication middleware for production
router.get("/users/organizers", async (req, res) => {
  try {
    const users = await User.find(
      { role: "organizer" },
      "name email role isEmailVerified createdAt"
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// TODO: Add admin authentication middleware for production
router.get("/users/admins", async (req, res) => {
  try {
    const users = await User.find(
      { role: "admin" },
      "name email role isEmailVerified createdAt"
    );
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
