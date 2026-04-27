const express = require("express");
const router = express.Router();
const customerRepository = require("../repositories/firestoreRepository");
const db = require("../../db");

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];
  if (!token) return res.status(401).json({ error: "Missing session token" });

  const customer = await customerRepository.findByToken(token);
  if (!customer)
    return res.status(401).json({ error: "Invalid or expired token" });

  req.customer = customer; // attach to request so route can use it
  next();
};

//customerRoutes
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password)
      return res.status(400).json({ error: "All fields are required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Invalid email address" });

    const phoneRegex = /^(\+39|0039)?\s?\d{9,11}$/;
    if (!phoneRegex.test(phone))
      return res.status(400).json({ error: "Invalid Italian phone number" });

    const customer = await customerRepository.register({
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    const { passwordHash: _, ...safe } = customer;
    res.status(201).json(safe);
  } catch (err) {
    res
      .status(err.message === "Email already registered" ? 409 : 500)
      .json({ error: err.message });
  }
});

// POST /customers/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { customer, token } = await customerRepository.login({
      email,
      password,
    });
    const { passwordHash: _, ...safe } = customer;
    res.status(200).json({ customerId: safe.id, token }); // return both
  } catch (err) {
    res
      .status(err.message === "Invalid credentials" ? 401 : 500)
      .json({ error: err.message });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers["x-session-token"];
    if (!token) return res.status(401).json({ error: "Missing session token" });
    const customer = await customerRepository.findByToken(token);
    if (!customer)
      return res.status(401).json({ error: "Invalid or expired token" });

    const { passwordHash: _, ...safe } = customer;
    res.status(200).json(safe);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// GET /customers/notifications — get notifications for logged in customer
router.get("/notifications", requireAuth, async (req, res) => {
  try {
    console.log(
      "[CustomerMS] GET /customers/notifications for customer:",
      req.customer.id,
    );
    const notifications = await customerRepository.getNotifications(
      req.customer.id,
    );
    console.log(`[CustomerMS] ✓ Found ${notifications.length} notifications`);
    res.status(200).json(notifications);
  } catch (err) {
    console.error("[CustomerMS] ✗ Error fetching notifications:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /customers/discount-status — get discount status for logged in customer
router.get("/discount-status", requireAuth, async (req, res) => {
  try {
    const status = await customerRepository.getDiscountStatus(req.customer.id);
    console.log(
      `[CustomerMS] ✓ Found discount status for customer ${req.customer.id}:`,
      status,
    );
    res.status(200).json(status);
  } catch (err) {
    console.error(
      "[CustomerMS] ✗ Error fetching discount status:",
      err.message,
    );
    res.status(500).json({ error: err.message });
  }
});

// POST /customers/mark-discount-used — mark discount as used
router.post("/mark-discount-used", requireAuth, async (req, res) => {
  try {
    await customerRepository.markDiscountUsed(req.customer.id);
    res.status(200).json({ message: "Discount marked as used" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /customers/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const customer = await customerRepository.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const { passwordHash: _, ...safe } = customer;
    res.status(200).json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const THREE_MINUTES = 3 * 60 * 1000;

// POST /internal/events — receives events from other microservices
router.post("/internal/events", async (req, res) => {
  const { type, data } = req.body;
  console.log(`[CustomerMS] [Events] Received event: ${type}`, data);

  // Acknowledge immediately
  res.status(202).json({ received: true });

  if (type === "booking-created") {
    const {
      customerId,
      bookingId,
      cabType,
      startLocation,
      endLocation,
      passengers,
      price,
    } = data;

    console.log(
      `[CustomerMS] [CabReady] Scheduling notification in 3 minutes for booking:`,
      bookingId,
    );

    setTimeout(async () => {
      try {
        await customerRepository.createNotification(
          customerId,
          `Your ${cabType} cab is on the way! Your driver has been assigned and is heading to your pickup location.`,
          "cab_ready",
        );
        console.log(
          `[CustomerMS] [CabReady] ✓ Notification created for booking:`,
          bookingId,
        );
      } catch (err) {
        console.error(
          "[CustomerMS] [CabReady] ✗ Error creating notification:",
          err.message,
        );
      }
    }, THREE_MINUTES);
  }
});

// POST /internal/check-discount — called by Booking MS after booking created
router.post("/internal/check-discount", async (req, res) => {
  try {
    const { customerId, bookingCount } = req.body;
    console.log(
      "[CustomerMS] Checking discount for customer:",
      customerId,
      "bookings:",
      bookingCount,
    );

    if (bookingCount < 3) {
      return res.status(200).json({ discountIssued: false });
    }

    const status = await customerRepository.getDiscountStatus(customerId);

    if (status.isDiscountNotificationSent) {
      console.log(
        "[CustomerMS] Discount already sent for customer:",
        customerId,
      );
      return res.status(200).json({ discountIssued: false, alreadySent: true });
    }

    // Issue notification
    await customerRepository.createNotification(
      customerId,
      "You have completed 3 bookings! You have earned a 30% discount on your next ride.",
      "discount",
    );

    await customerRepository.markDiscountNotificationSent(customerId);

    console.log(
      "[CustomerMS] ✓ Discount notification issued for customer:",
      customerId,
    );
    res.status(200).json({ discountIssued: true });
  } catch (err) {
    console.error("[CustomerMS] Error checking discount:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
