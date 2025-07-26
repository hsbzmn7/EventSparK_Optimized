const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventImage,
} = require("../services/eventServices");
//test
const Event = require("../models/Events");

// GET /api/events/raw - Get all events with organizer populated (without service layer)
router.get("/raw", async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "name email");
    const eventsWithOrganizer = events.map((ev) => ({
      ...ev.toObject(),
      organizer: ev.createdBy,
    }));
    res.json({ success: true, events: eventsWithOrganizer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events/organizer/:organizerId - Get events for a specific organizer
router.get("/organizer/:organizerId", async (req, res) => {
  try {
    const events = await Event.find({
      createdBy: req.params.organizerId,
    }).populate("createdBy", "name email");
    const eventsWithOrganizer = events.map((ev) => ({
      ...ev.toObject(),
      organizer: ev.createdBy,
    }));
    res.json({ success: true, events: eventsWithOrganizer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events
router.post("/", verifyToken, uploadEventImage, createEvent);

// GET /api/events
router.get("/", verifyToken, getEvents);

// GET /api/events/:id
router.get("/:id", verifyToken, getEventById);

// PUT /api/events/:id
router.put("/:id", verifyToken, uploadEventImage, updateEvent);

// DELETE /api/events/:id
router.delete("/:id", verifyToken, deleteEvent);

// POST /api/events/:id/sell-tickets - Simulate selling tickets (for testing)
router.post("/:id/sell-tickets", verifyToken, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    // Check if enough seats are available
    const availableSeats = event.totalSeats - event.soldTickets;
    if (quantity > availableSeats) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableSeats} seats available`,
      });
    }

    // Calculate ticket price based on dynamic pricing
    let ticketPrice = event.ticketPrice;
    if (event.dynamicPricing.enabled) {
      const currentAvailableSeats = availableSeats - quantity;
      for (const rule of event.dynamicPricing.rules) {
        if (currentAvailableSeats <= rule.threshold) {
          ticketPrice = ticketPrice * (1 + rule.percentage / 100);
        }
      }
      ticketPrice = Math.round(ticketPrice * 100) / 100;
    }

    // Update event with sold tickets and revenue
    event.soldTickets += quantity;
    event.revenue = event.soldTickets * event.ticketPrice;
    await event.save();

    res.json({
      success: true,
      data: {
        event,
        soldQuantity: quantity,
        ticketPrice: ticketPrice,
        totalRevenue: event.revenue,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
