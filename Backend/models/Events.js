const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      index: true, // Optimize event name searches
    },
    description: { type: String, required: true },
    date: { 
      type: String, 
      required: true,
      index: true, // Optimize date-based queries
    }, // ISO or yyyy-mm-dd
    time: { type: String, required: true }, // HH:mm
    venue: { 
      type: String, 
      required: true,
      index: true, // Optimize venue-based searches
    },
    category: { 
      type: String, 
      required: true,
      index: true, // Optimize category filtering
    },
    totalSeats: { type: Number, required: true },
    imageUrl: { type: String }, // optional
    // Ticket pricing fields
    ticketPrice: {
      type: Number,
      required: true,
      min: [0, "Ticket price cannot be negative"],
      default: 0,
    },
    dynamicPricing: {
      enabled: { type: Boolean, default: false },
      rules: [
        {
          threshold: { type: Number, required: true }, // seats remaining threshold
          percentage: { type: Number, required: true }, // price increase percentage
          description: { type: String },
        },
      ],
    },
    soldTickets: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    createdBy: {
      // linkage to User
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimize organizer-based queries
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true, // Optimize status-based queries
    },
  },
  { timestamps: true }
);

// Compound indexes for common query patterns
eventSchema.index({ status: 1, date: 1 }); // For approved upcoming events
eventSchema.index({ createdBy: 1, status: 1 }); // For organizer's events
eventSchema.index({ category: 1, status: 1, date: 1 }); // For category filtering
eventSchema.index({ date: 1, time: 1 }); // For date-time sorting
eventSchema.index({ name: 1, description: 1 }); // For text search optimization

// Virtual for available seats
eventSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - this.soldTickets;
});

// Virtual for current ticket price based on dynamic pricing
eventSchema.virtual("currentTicketPrice").get(function () {
  if (!this.dynamicPricing.enabled) {
    return this.ticketPrice;
  }

  const availableSeats = this.availableSeats;
  let currentPrice = this.ticketPrice;

  // Apply dynamic pricing rules in order
  for (const rule of this.dynamicPricing.rules) {
    if (availableSeats <= rule.threshold) {
      currentPrice = currentPrice * (1 + rule.percentage / 100);
    }
  }

  return Math.round(currentPrice * 100) / 100; // Round to 2 decimal places
});

// Method to calculate revenue
eventSchema.methods.calculateRevenue = function () {
  return this.soldTickets * this.ticketPrice;
};

// Method to update revenue
eventSchema.methods.updateRevenue = function () {
  this.revenue = this.calculateRevenue();
  return this.save();
};

module.exports = mongoose.model("Event", eventSchema);
