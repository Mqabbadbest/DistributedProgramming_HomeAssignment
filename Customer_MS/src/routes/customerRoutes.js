const express = require("express");
const router = express.Router();
const customerRepository = require("../repositories/firestoreRepository");
const db = require("../../db");
const notificationEmitter = require("../events/notificationEmitter");

/**
 * Middleware to require authentication for routes that need it. Checks for x-session-token header, validates it against the sessions collection in Firestore, and attaches the customer data to the request object if valid.
 * If the token is missing or invalid, responds with 401 Unauthorized.
 * This middleware is used for routes that require the user to be logged in, such as fetching notifications or discount status.
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];
  if (!token) return res.status(401).json({ error: "Missing session token" });

  const customer = await customerRepository.findByToken(token);
  if (!customer)
    return res.status(401).json({ error: "Invalid or expired token" });

  req.customer = customer; // attach to request so route can use it
  next();
};

/**
 * POST /customers/register — register a new customer, no authentication required
 * Body: { firstName, lastName, email, phone, password }
 * Response: 201 Created with customer data (excluding password), or 400 Bad Request if missing/invalid fields, or 409 Conflict if email already registered, or 500 Internal Server Error on failure
 */
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

/**
 * POST /customers/login — log in an existing customer
 * Body: { email, password }
 * Response: 200 OK with customer ID and session token, or 400 Bad Request if missing/invalid fields, or 401 Unauthorized if credentials are invalid, or 500 Internal Server Error on failure
 */
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

/**
 * GET /customers/me — get the authenticated customer's profile information
 * Headers: x-session-token
 * Response: 200 OK with customer data (excluding password), or 401 Unauthorized if token is missing/invalid, or 500 Internal Server Error on failure
 * This method is used by other microservices to validate session tokens and get customer info, so it should be efficient and secure.
 */
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

/**
 * GET /customers/notifications — get notifications for logged in customer
 * Headers: x-session-token
 * Response: 200 OK with notifications, or 401 Unauthorized if token is missing/invalid, or 500 Internal Server Error on failure
 */
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

/**
 * GET /customers/discount-status — get discount status for logged in customer
 * Headers: x-session-token
 * Response: 200 OK with discount status, or 401 Unauthorized if token is missing/invalid, or 500 Internal Server Error on failure
 */
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

/**
 * POST /customers/mark-discount-used — mark discount as used
 * Headers: x-session-token
 * Response: 200 OK if discount is marked as used, or 401 Unauthorized if token is missing/invalid, or 500 Internal Server Error on failure
 */
router.post("/mark-discount-used", requireAuth, async (req, res) => {
  try {
    await customerRepository.markDiscountUsed(req.customer.id);
    res.status(200).json({ message: "Discount marked as used" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /customers/:id — get customer profile by ID
 */
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

/**
 * POST /internal/events — receives events from other microservices
 * Headers: x-session-token
 * Response: 202 Accepted if event is received, or 500 Internal Server Error on failure
 */
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
      `[CustomerMS] [Events] Emitting cab-assigned event for booking:`,
      bookingId,
    );

    // Emit event to listener — listener will handle 3-minute delay and notification creation
    notificationEmitter.emit("cab-assigned", {
      customerId,
      bookingId,
      cabType,
      startLocation,
      endLocation,
      passengers,
      price,
    });
  }
});

/**
 * POST /customers/internal/check-discount — check if customer is eligible for discount based on booking count, and if so, mark discount as sent and emit event to create notification
 * Body: { customerId, bookingCount }
 * Response: 200 OK with { discountIssued: true/false, alreadySent: true/false }, or 500 Internal Server Error on failure
 * Note: This endpoint is called by the Booking MS after a booking is completed, to check if the customer has earned a discount. If they have completed 3 bookings and haven't already received the discount notification, it will mark the discount as sent in the database and emit an event that triggers the creation of the notification.
 */
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
      return res.status(200).json({ alreadySent: true });
    }

    await customerRepository.markDiscountNotificationSent(customerId);

    // Emit event — listener will create the notification
    notificationEmitter.emit("discount-earned", {
      customerId,
      discountPercentage: 30,
    });

    console.log(
      "[CustomerMS] ✓ Discount event emitted for customer:",
      customerId,
    );
    res.status(200).json({ discountIssued: true });
  } catch (err) {
    console.error("[CustomerMS] Error checking discount:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
