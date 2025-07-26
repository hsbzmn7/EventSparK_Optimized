const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Booking = require("../models/Booking");
const Event = require("../models/Events");
const User = require("../models/User");
const { sendBookingConfirmationEmail } = require("../services/emailService");
const { bookingCacheService } = require("../services/cacheService");

// Get available seats for an event
router.get("/event/:eventId/seats", auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Try to get from cache first
    const cachedSeats = bookingCacheService.getEventSeats(eventId);
    if (cachedSeats) {
      return res.json(cachedSeats);
    }
    
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get all booked seats for this event
    const bookedSeats = await Booking.find({
      eventId,
      status: "active",
    }).select("seatNumber");

    const bookedSeatNumbers = bookedSeats.map((booking) => booking.seatNumber);
    const totalSeats = event.totalSeats;
    const availableSeats = [];

    // Generate seat numbers (A1, A2, A3, ..., B1, B2, B3, etc.)
    const rows = Math.ceil(totalSeats / 10); // 10 seats per row
    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
      for (let seat = 1; seat <= 10; seat++) {
        const seatNumber = `${rowLetter}${seat}`;
        if (availableSeats.length < totalSeats) {
          availableSeats.push({
            seatNumber,
            isAvailable: !bookedSeatNumbers.includes(seatNumber),
          });
        }
      }
    }

    const response = {
      success: true,
      data: {
        event,
        availableSeats,
        totalSeats: event.totalSeats,
        soldTickets: event.soldTickets,
        currentPrice: event.currentTicketPrice,
      },
    };

    // Cache the seats data
    bookingCacheService.setEventSeats(eventId, response);

    res.json(response);
  } catch (error) {
    console.error("Error fetching available seats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new booking
router.post("/create", auth, async (req, res) => {
  try {
    const { eventId, seatNumber } = req.body;
    const userId = req.user.id;

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if seat is available
    const existingBooking = await Booking.findOne({
      eventId,
      seatNumber,
      status: "active",
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Seat is already booked" });
    }

    // Check if event has available seats
    if (event.soldTickets >= event.totalSeats) {
      return res.status(400).json({ message: "Event is sold out" });
    }

    // Create booking
    const booking = new Booking({
      eventId,
      userId,
      seatNumber,
      ticketPrice: event.currentTicketPrice,
    });

    await booking.save();

    // Update event sold tickets count
    event.soldTickets += 1;
    await event.updateRevenue();

    // Invalidate relevant caches
    bookingCacheService.invalidateEventBookings(eventId);
    bookingCacheService.invalidateUserBookings(userId);

    res.status(201).json({
      success: true,
      data: {
        booking,
        event: {
          name: event.name,
          date: event.date,
          time: event.time,
          venue: event.venue,
        },
      },
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Bulk create bookings for multiple seats
router.post("/bulk-create", auth, async (req, res) => {
  try {
    const { eventId, seatNumbers } = req.body;
    const userId = req.user.id;
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ message: "No seats selected" });
    }
    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    // Check if enough seats are available
    if (event.soldTickets + seatNumbers.length > event.totalSeats) {
      return res.status(400).json({ message: "Not enough seats available" });
    }
    // Check for already booked seats
    const existingBookings = await Booking.find({
      eventId,
      seatNumber: { $in: seatNumbers },
      status: "active",
    });
    const alreadyBooked = existingBookings.map((b) => b.seatNumber);
    if (alreadyBooked.length > 0) {
      return res
        .status(400)
        .json({ message: `Seats already booked: ${alreadyBooked.join(", ")}` });
    }
    // Create bookings
    const bookings = [];
    for (const seatNumber of seatNumbers) {
      const booking = new Booking({
        eventId,
        userId,
        seatNumber,
        ticketPrice: event.currentTicketPrice,
      });
      booking.generateQRCode(); // Ensure QR code is set
      await booking.save();
      bookings.push(booking);
    }
    // Update event sold tickets count
    event.soldTickets += seatNumbers.length;
    await event.updateRevenue();
    
    // Invalidate relevant caches
    bookingCacheService.invalidateEventBookings(eventId);
    bookingCacheService.invalidateUserBookings(userId);
    
    res.status(201).json({
      success: true,
      data: {
        bookings,
        event: {
          name: event.name,
          date: event.date,
          time: event.time,
          venue: event.venue,
        },
      },
    });
  } catch (error) {
    console.error("Error in bulk booking:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Process payment (pseudo implementation)
router.post("/:bookingId/payment", auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Pseudo payment processing
    // In a real implementation, this would integrate with a payment gateway
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (paymentSuccess) {
      booking.paymentStatus = "completed";
      await booking.save();

      // Send confirmation email
      const user = await User.findById(req.user.id);
      const event = await Event.findById(booking.eventId);

      await sendBookingConfirmationEmail(
        user.email,
        user.name,
        event.name,
        booking.seatNumber,
        booking.ticketPrice,
        booking.qrCode,
        event.date,
        event.time,
        event.venue
      );

      // Invalidate booking caches
      bookingCacheService.invalidateUserBookings(req.user.id);
      bookingCacheService.invalidateEventBookings(booking.eventId);

      res.json({
        success: true,
        data: {
          booking,
          message: "Payment successful! Booking confirmed.",
        },
      });
    } else {
      booking.paymentStatus = "failed";
      await booking.save();

      res.status(400).json({
        success: false,
        message: "Payment failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's bookings
router.get("/my-bookings", auth, async (req, res) => {
  try {
    // Try to get from cache first
    const cachedBookings = bookingCacheService.getUserBookings(req.user.id);
    if (cachedBookings) {
      return res.json(cachedBookings);
    }

    const bookings = await Booking.find({ userId: req.user.id })
      .populate("eventId", "name date time venue imageUrl")
      .sort({ createdAt: -1 });

    const response = {
      success: true,
      data: bookings,
    };

    // Cache the bookings
    bookingCacheService.setUserBookings(req.user.id, response);

    res.json(response);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all bookings for the authenticated user
router.get("/my", auth, async (req, res) => {
  try {
    // Try to get from cache first
    const cachedBookings = bookingCacheService.getUserBookings(req.user._id);
    if (cachedBookings) {
      return res.json(cachedBookings);
    }

    const bookings = await Booking.find({ userId: req.user._id })
      .populate("eventId", "name date time venue imageUrl")
      .sort({ createdAt: -1 });
      
    const response = { success: true, data: bookings };
    
    // Cache the bookings
    bookingCacheService.setUserBookings(req.user._id, response);
    
    res.json(response);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get booking details
router.get("/:bookingId", auth, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("eventId", "name date time venue imageUrl")
      .populate("userId", "name email");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if booking belongs to user
    if (booking.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
