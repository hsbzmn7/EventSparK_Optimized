const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true, // Optimize event-based booking queries
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimize user-based booking queries
    },
    seatNumber: {
      type: String,
      required: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
      index: true, // Optimize payment status queries
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
      index: true, // Optimize QR code lookups
    },
    bookingDate: {
      type: Date,
      default: Date.now,
      index: true, // Optimize date-based booking queries
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "refunded"],
      default: "active",
      index: true, // Optimize status-based queries
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
bookingSchema.index({ eventId: 1, status: 1 }); // For event booking status
bookingSchema.index({ userId: 1, status: 1 }); // For user's active bookings
bookingSchema.index({ eventId: 1, seatNumber: 1 }); // For seat availability checks
bookingSchema.index({ eventId: 1, paymentStatus: 1 }); // For payment processing
bookingSchema.index({ bookingDate: 1, status: 1 }); // For booking history

// Generate QR code
bookingSchema.methods.generateQRCode = function () {
  const bookingData = {
    bookingId: this._id,
    eventId: this.eventId,
    userId: this.userId,
    seatNumber: this.seatNumber,
  };
  this.qrCode = Buffer.from(JSON.stringify(bookingData)).toString("base64");
  return this.qrCode;
};

// Pre-save middleware to generate QR code if not exists
bookingSchema.pre("save", function (next) {
  if (!this.qrCode) {
    this.generateQRCode();
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
