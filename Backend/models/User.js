const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
      index: true, // Optimize login queries
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "organizer"],
      required: [true, "Role is required"],
      default: "user",
      index: true, // Optimize role-based queries
    },
    resetPasswordToken: {
      type: String,
      index: true, // Optimize password reset queries
    },
    resetPasswordExpires: {
      type: Date,
      index: true, // Optimize token expiration queries
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true, // Optimize verification status queries
    },
    profilePic: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common query patterns
userSchema.index({ email: 1, role: 1 }); // For admin user management
userSchema.index({ role: 1, isEmailVerified: 1 }); // For user verification queries
userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 }); // For password reset

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  return userObject;
};

module.exports = mongoose.model("User", userSchema);
