const express = require("express");
const router = express.Router();
const axios = require("axios");
const bookingRepository = require("../repositories/firestoreRepository");

const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL || "http://localhost:3000";
const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3002";

/**
 * Middleware to require authentication for protected routes.
 * Checks for x-session-token header and validates it with Customer Service.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];
  if (!token) {
    console.warn("[BookingMS] [Auth] Missing session token");
    return res.status(401).json({ error: "Missing session token" });
  }

  try {
    const response = await axios.get(`${CUSTOMER_SERVICE_URL}/customers/me`, {
      headers: { "x-session-token": token },
    });
    req.customer = response.data;
    req.customerId = response.data.id;
    console.log("[BookingMS] [Auth] ✓ Authenticated customer:", req.customerId);
    next();
  } catch (err) {
    console.error("[BookingMS] [Auth] ✗ Token validation failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Helper function to validate location objects
 * @param {*} loc
 * @returns
 */
const isValidLocation = (loc) =>
  loc && typeof loc.lat === "number" && typeof loc.lng === "number";

/**
 * POST /bookings — create a new booking
 * Body: { startLocation: { lat, lng }, endLocation: { lat, lng }, passengers, cabType, price, cabFareCents, durationMinutes, distanceKilometers, applyDiscount }
 * Response: 201 Created with booking data, or 400 Bad Request if missing/invalid fields, or 500 Internal Server Error on failure
 * After creating booking, also creates payment in Payment MS and checks for discount eligibility in Customer MS
 * Finally, sends a "booking-created" event to Customer MS for notification purposes
 */
router.post("/", requireAuth, async (req, res) => {
  console.log("[BookingMS] POST /bookings called");
  console.log(
    "[BookingMS] Raw request body:",
    JSON.stringify(req.body, null, 2),
  );

  try {
    const {
      startLocation,
      endLocation,
      passengers,
      cabType,
      price,
      cabFareCents,
      durationMinutes,
      distanceKilometers,
      applyDiscount,
    } = req.body;

    console.log("[BookingMS] Destructured fields:", {
      startLocation,
      endLocation,
      passengers,
      cabType,
      price,
      cabFareCents,
      durationMinutes,
      distanceKilometers,
    });

    // Validation
    if (
      !startLocation ||
      !endLocation ||
      !passengers ||
      !cabType ||
      price === undefined
    ) {
      console.warn("[BookingMS] ✗ Validation failed - missing fields:", {
        hasStartLocation: !!startLocation,
        hasEndLocation: !!endLocation,
        hasPassengers: !!passengers,
        hasCabType: !!cabType,
        hasPrice: price !== undefined,
      });
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!isValidLocation(startLocation) || !isValidLocation(endLocation)) {
      console.warn("[BookingMS] ✗ Invalid location format:", {
        startLocation,
        endLocation,
      });
      return res
        .status(400)
        .json({ error: "Locations must have lat and lng as numbers" });
    }

    if (!Number.isInteger(passengers) || passengers < 1) {
      console.warn(
        "[BookingMS] ✗ Invalid passengers value:",
        passengers,
        typeof passengers,
      );
      return res
        .status(400)
        .json({ error: "Passengers must be a positive integer" });
    }

    if (typeof price !== "number" || price <= 0) {
      console.warn("[BookingMS] ✗ Invalid price:", price, typeof price);
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    console.log(
      "[BookingMS] ✓ Validation passed, creating booking for customer:",
      req.customerId,
    );

    const booking = await bookingRepository.create({
      customerId: req.customerId,
      startLocation,
      endLocation,
      passengers,
      cabType,
      price,
      cabFareCents,
      durationMinutes: durationMinutes || null,
      distanceKilometers: distanceKilometers || null,
      applyDiscount: applyDiscount || false,
    });

    console.log("[BookingMS] ✓ Booking created in Firestore:", {
      bookingId: booking.id,
      customerId: booking.customerId,
      cabType: booking.cabType,
      price: booking.price,
      status: booking.status,
    });

    // Create payment in Payment MS
    try {
      console.log("[BookingMS] Calling Payment MS to create payment:", {
        url: `${PAYMENT_SERVICE_URL}/payments/create`,
        customerId: req.customerId,
        bookingId: booking.id,
        price: booking.price,
      });

      const paymentResponse = await axios.post(
        `${PAYMENT_SERVICE_URL}/payments/create`,
        {
          customerId: req.customerId,
          bookingId: booking.id,
          price: booking.price,
        },
      );

      console.log("[BookingMS] ✓ Payment MS response:", paymentResponse.data);

      const bookingWithPayment =
        await bookingRepository.updateBookingWithPaymentId(
          booking.id,
          paymentResponse.data.paymentId,
        );

      console.log("[BookingMS] ✓ Booking updated with paymentId:", {
        bookingId: booking.id,
        paymentId: paymentResponse.data.paymentId,
      });

      try {
        const allBookings = await bookingRepository.getAllBookings(
          req.customerId,
        );
        const bookingCount = allBookings.length;

        console.log(
          `[BookingMS] Customer ${req.customerId} has ${bookingCount} total bookings`,
        );

        await axios.post(
          `${CUSTOMER_SERVICE_URL}/customers/internal/check-discount`,
          {
            customerId: req.customerId,
            bookingCount,
          },
        );

        console.log("[BookingMS] ✓ Discount check completed");
      } catch (discountErr) {
        console.error(
          "[BookingMS] ✗ Discount check failed:",
          discountErr.message,
        );
      }

      res.status(201).json(bookingWithPayment);

      try {
        await axios.post(`${CUSTOMER_SERVICE_URL}/customers/internal/events`, {
          type: "booking-created",
          data: {
            customerId: req.customerId,
            bookingId: booking.id,
            cabType,
            startLocation,
            endLocation,
            passengers,
            price,
          },
        });
        console.log("[BookingMS] ✓ booking-created event sent to Customer MS");
      } catch (err) {
        console.error(
          "[BookingMS] ✗ Failed to send booking-created event:",
          err.message,
        );
      }
    } catch (paymentError) {
      console.error("[BookingMS] ✗ Payment MS call failed:", {
        message: paymentError.message,
        status: paymentError.response?.status,
        data: paymentError.response?.data,
      });
      res.status(201).json({
        ...booking,
        paymentError: "Payment creation failed, but booking was created",
      });
    }
  } catch (err) {
    console.error("[BookingMS] ✗ Unexpected error in POST /bookings:", {
      message: err.message,
      stack: err.stack,
    });
    res
      .status(err.message.startsWith("Invalid cab type") ? 400 : 500)
      .json({ error: err.message });
  }
});

/**
 * GET /bookings/current — get current active bookings for authenticated customer
 * Response: 200 OK with array of bookings, or 500 Internal Server Error on failure
 * Note: This endpoint is protected and requires a valid x-session-token header
 * to identify the customer. It returns only bookings that are currently active.
 */
router.get("/current", requireAuth, async (req, res) => {
  console.log(
    "[BookingMS] GET /bookings/current for customer:",
    req.customerId,
  );
  try {
    const bookings = await bookingRepository.getCurrentBookings(req.customerId);
    console.log(`[BookingMS] ✓ Found ${bookings.length} current bookings`);
    res.status(200).json(bookings);
  } catch (err) {
    console.error(
      "[BookingMS] ✗ Error fetching current bookings:",
      err.message,
    );
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /bookings/past — get past bookings for authenticated customer
 * Response: 200 OK with array of past bookings, or 500 Internal Server Error on failure
 * Note: This endpoint is protected and requires a valid x-session-token header
 * to identify the customer. It returns only bookings that are completed or cancelled.
 */
router.get("/past", requireAuth, async (req, res) => {
  console.log("[BookingMS] GET /bookings/past for customer:", req.customerId);
  try {
    const bookings = await bookingRepository.getPastBookings(req.customerId);
    console.log(`[BookingMS] ✓ Found ${bookings.length} past bookings`);
    res.status(200).json(bookings);
  } catch (err) {
    console.error("[BookingMS] ✗ Error fetching past bookings:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /bookings/internal/:id — get booking by id (internal use only, no auth)
 * Response: 200 OK with booking data, or 404 Not Found if booking doesn't exist, or 500 Internal Server Error on failure
 * Note: This endpoint is for internal use by other services (e.g. Payment MS) and does not require authentication.
 * It should return the booking regardless of its status or customerId.
 */
router.get("/internal/:id", async (req, res) => {
  console.log("[BookingMS] GET /internal/bookings/:id →", req.params.id);
  try {
    const booking = await bookingRepository.findById(req.params.id);
    if (!booking) {
      console.warn("[BookingMS] ✗ Booking not found:", req.params.id);
      return res.status(404).json({ error: "Booking not found" });
    }

    console.log("[BookingMS] ✓ Returning booking (internal):", booking.id);
    res.status(200).json(booking);
  } catch (err) {
    console.error(
      "[BookingMS] ✗ Error fetching booking (internal):",
      err.message,
    );
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /bookings/:id — get booking by id
 * Response: 200 OK with booking data, or 404 Not Found if booking doesn't exist, or 500 Internal Server Error on failure
 * Note: This endpoint is protected and requires a valid x-session-token header
 * to identify the customer. It returns the booking only if it belongs to the authenticated customer.
 */
router.get("/:id", requireAuth, async (req, res) => {
  console.log("[BookingMS] GET /bookings/:id →", req.params.id);
  try {
    const booking = await bookingRepository.findById(req.params.id);
    if (!booking) {
      console.warn("[BookingMS] ✗ Booking not found:", req.params.id);
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.customerId) {
      console.warn("[BookingMS] ✗ Unauthorized access attempt:", {
        bookingCustomerId: booking.customerId,
        requestCustomerId: req.customerId,
      });
      return res.status(403).json({ error: "Unauthorized" });
    }

    console.log("[BookingMS] ✓ Returning booking:", booking.id);
    res.status(200).json(booking);
  } catch (err) {
    console.error("[BookingMS] ✗ Error fetching booking by id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
