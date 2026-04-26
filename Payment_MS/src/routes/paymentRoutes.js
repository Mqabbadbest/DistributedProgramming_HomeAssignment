const express = require("express");
const router = express.Router();
const axios = require("axios");
const paymentRepository = require("../repositories/firestoreRepository");
const { calculatePrice } = require("../utils/paymentCalculator");
const { isDeclined } = require("../utils/cardValidator");
const { getFareDetails } = require("../utils/fareService");

const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL || "http://localhost:3000";

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];
  if (!token) return res.status(401).json({ error: "Missing session token" });

  try {
    const response = await axios.get(`${CUSTOMER_SERVICE_URL}/customers/me`, {
      headers: { "x-session-token": token },
    });
    req.customer = response.data;
    req.customerId = response.data.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// POST /payments/calculate — calculate price only (no payment creation)
router.post("/calculate", async (req, res) => {
  try {
    const {
      customerId,
      cabType,
      dateTime,
      passengers,
      startLocation,
      endLocation,
    } = req.body;

    if (
      !customerId ||
      !cabType ||
      !dateTime ||
      !passengers ||
      !startLocation ||
      !endLocation
    )
      return res.status(400).json({ error: "All fields are required" });

    // Get fare details from RapidAPI
    const { cabFare, cabFareCents, durationMinutes, distanceKilometers } =
      await getFareDetails(startLocation, endLocation);

    const price = calculatePrice(cabFare, cabType, dateTime, passengers);

    console.log("[PaymentMS] /calculate: Calculated price:", {
      customerId,
      price,
      durationMinutes,
      distanceKilometers,
      cabFareCents,
    });

    // Return price & trip details (no payment created yet)
    res.status(200).json({
      price,
      cabFareCents,
      durationMinutes,
      distanceKilometers,
    });
  } catch (err) {
    console.error("[PaymentMS] /calculate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/create — create actual payment record (called after booking is created)
router.post("/create", async (req, res) => {
  try {
    const { customerId, bookingId, price } = req.body;

    if (!customerId || !bookingId || price === undefined)
      return res
        .status(400)
        .json({ error: "customerId, bookingId, and price are required" });

    console.log("[PaymentMS] /create: Creating payment:", {
      customerId,
      bookingId,
      price,
    });

    const payment = await paymentRepository.create({
      customerId,
      bookingId,
      price,
    });

    console.log(
      "[PaymentMS] /create: Payment created successfully:",
      payment.id,
    );

    res.status(201).json({
      paymentId: payment.id,
      price: payment.price,
      status: payment.status,
    });
  } catch (err) {
    console.error("[PaymentMS] /create error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/:paymentId/pay — user submits card details
router.post("/:paymentId/pay", requireAuth, async (req, res) => {
  try {
    const { cardHolderName, cardNumber, cvv, cardExpiry } = req.body;

    if (!cardHolderName || !cardNumber || !cvv || !cardExpiry)
      return res.status(400).json({ error: "All card details are required" });

    // Check if payment should be declined
    if (isDeclined(cardHolderName)) {
      await paymentRepository.markFailed(req.params.paymentId);
      return res.status(402).json({ error: "Payment declined" });
    }

    const payment = await paymentRepository.pay(req.params.paymentId, {
      cardHolderName,
      cardNumber,
      cvv,
      cardExpiry,
    });

    res.status(200).json(payment);
  } catch (err) {
    res
      .status(
        err.message === "Payment not found"
          ? 404
          : err.message === "Payment already completed"
            ? 409
            : 500,
      )
      .json({ error: err.message });
  }
});

// GET /payments/:paymentId — get payment details
router.get("/:paymentId", requireAuth, async (req, res) => {
  try {
    const payment = await paymentRepository.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.status(200).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /payments — get all payments for logged in customer
router.get("/", requireAuth, async (req, res) => {
  try {
    const payments = await paymentRepository.findByCustomer(req.customerId);
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
