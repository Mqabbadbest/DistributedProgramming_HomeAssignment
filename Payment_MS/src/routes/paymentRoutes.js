const express = require("express");
const router = express.Router();
const axios = require("axios");
const paymentRepository = require("../repositories/firestoreRepository");
const { calculatePrice } = require("../utils/paymentCalculator");
const { isDeclined } = require("../utils/cardValidator");
const { getFareDetails } = require("../utils/fareService");

const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL || "http://localhost:3000";

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || "http://localhost:3001";

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
      passengers,
      startLocation,
      endLocation,
      applyDiscount,
      currentDateTime,
    } = req.body;

    if (
      !customerId ||
      !cabType ||
      !passengers ||
      !startLocation ||
      !endLocation
    )
      return res.status(400).json({ error: "All fields are required" });

    console.log("[PaymentMS] /calculate called with data:", {
      customerId,
      cabType,
      passengers,
      startLocation,
      endLocation,
      applyDiscount,
      currentDateTime,
    });
    // Get fare details from RapidAPI
    const { cabFare, cabFareCents, durationMinutes, distanceKilometers } =
      await getFareDetails(startLocation, endLocation);

    let price = calculatePrice(cabFare, cabType, passengers, currentDateTime);

    let discountApplied = false;

    if (applyDiscount && customerId) {
      try {
        const statusRes = await axios.get(
          `${CUSTOMER_SERVICE_URL}/customers/discount-status`,
          {
            headers: {
              "x-session-token": req.headers["x-session-token"] || "",
            },
          },
        );

        const { isDiscountNotificationSent, isDiscountUsed } = statusRes.data;
        console.log(
          "[PaymentMS] Discount status for customer:",
          customerId,
          "isDiscountNotificationSent:",
          isDiscountNotificationSent,
          "isDiscountUsed:",
          isDiscountUsed,
        );
        if (isDiscountNotificationSent && !isDiscountUsed) {
          price = parseFloat((price * 0.7).toFixed(2)); // 30% off
          discountApplied = true;
          console.log("[PaymentMS] ✓ 30% discount applied, new price:", price);
        }
      } catch (err) {
        console.error(
          "[PaymentMS] Could not verify discount status:",
          err.message,
        );
      }
    }

    console.log("[PaymentMS] /calculate: Calculated price:", {
      customerId,
      price,
      durationMinutes,
      distanceKilometers,
      cabFareCents,
      discountApplied,
    });

    // Return price & trip details (no payment created yet)
    res.status(200).json({
      price,
      cabFareCents,
      durationMinutes,
      distanceKilometers,
      discountApplied,
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

    // Discount is applied only if:
    // 1. The customer selected applyDiscount=true during booking, AND
    // 2. The discount was available (notification sent and not yet used)
    let discountApplied = false;
    try {
      console.log("[PaymentMS] /pay: Checking discount eligibility...");
      console.log("[PaymentMS] Payment bookingId:", payment.bookingId);

      if (payment.bookingId) {
        console.log(
          `[PaymentMS] /pay: Fetching booking ${payment.bookingId} from Booking MS...`,
        );
        // Get the booking to check if customer requested the discount
        const bookingRes = await axios.get(
          `${BOOKING_SERVICE_URL}/bookings/internal/${payment.bookingId}`,
        );
        const { applyDiscount } = bookingRes.data;
        console.log("[PaymentMS] /pay: Booking applyDiscount:", applyDiscount);

        // Only apply discount if customer explicitly requested it during booking
        if (applyDiscount) {
          console.log(
            "[PaymentMS] /pay: Customer requested discount, checking availability...",
          );
          // Also verify the discount is still available
          const statusRes = await axios.get(
            `${CUSTOMER_SERVICE_URL}/customers/discount-status`,
            {
              headers: {
                "x-session-token": req.headers["x-session-token"] || "",
              },
            },
          );
          const { isDiscountNotificationSent, isDiscountUsed } = statusRes.data;
          console.log(
            "[PaymentMS] /pay: Discount status - sent:",
            isDiscountNotificationSent,
            "used:",
            isDiscountUsed,
          );
          // Only mark as applied if discount was available and requested
          discountApplied = isDiscountNotificationSent && !isDiscountUsed;
          console.log("[PaymentMS] /pay: Discount applied?", discountApplied);
        } else {
          console.log(
            "[PaymentMS] /pay: Customer did NOT request discount in booking",
          );
        }
      } else {
        console.log("[PaymentMS] /pay: No bookingId found on payment");
      }
    } catch (err) {
      console.error(
        "[PaymentMS] Could not verify discount eligibility:",
        err.message,
      );
      console.error("[PaymentMS] Error details:", err.response?.data || err);
    }

    console.log(
      "[PaymentMS] /pay: Returning discountApplied:",
      discountApplied,
    );
    res.status(200).json({ ...payment, discountApplied });
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
