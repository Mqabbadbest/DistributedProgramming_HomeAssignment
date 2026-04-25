require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const CUSTOMER_SERVICE =
  process.env.CUSTOMER_SERVICE_URL || "http://localhost:3000";
const BOOKING_SERVICE =
  process.env.BOOKING_SERVICE_URL || "http://localhost:3001";

// Health check
app.get("/health", (req, res) =>
  res.status(200).json({ status: "ok", service: "api-gateway" }),
);

// Customers
app.post("/customers/register", async (req, res) => {
  try {
    const response = await axios.post(
      `${CUSTOMER_SERVICE}/customers/register`,
      req.body,
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Customer service unavailable" });
  }
});

app.post("/customers/login", async (req, res) => {
  try {
    const response = await axios.post(
      `${CUSTOMER_SERVICE}/customers/login`,
      req.body,
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Customer service unavailable" });
  }
});

app.get("/customers/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${CUSTOMER_SERVICE}/customers/${req.params.id}`,
      {
        headers: {
          "x-session-token": req.headers["x-session-token"],
        },
      },
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Customer service unavailable" });
  }
});

// ─── Bookings ─────────────────────────────────────────────────────────────
// POST /bookings — create a booking
app.post("/bookings", async (req, res) => {
  try {
    const response = await axios.post(`${BOOKING_SERVICE}/bookings`, req.body, {
      headers: {
        "x-session-token": req.headers["x-session-token"],
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Booking service unavailable" });
  }
});

// GET /bookings/current — get upcoming bookings
app.get("/bookings/current", async (req, res) => {
  try {
    const response = await axios.get(`${BOOKING_SERVICE}/bookings/current`, {
      headers: {
        "x-session-token": req.headers["x-session-token"],
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Booking service unavailable" });
  }
});

// GET /bookings/past — get completed bookings
app.get("/bookings/past", async (req, res) => {
  try {
    const response = await axios.get(`${BOOKING_SERVICE}/bookings/past`, {
      headers: {
        "x-session-token": req.headers["x-session-token"],
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Booking service unavailable" });
  }
});

// GET /bookings/:id — get booking by id
app.get("/bookings/:id", async (req, res) => {
  try {
    const response = await axios.get(
      `${BOOKING_SERVICE}/bookings/${req.params.id}`,
      {
        headers: {
          "x-session-token": req.headers["x-session-token"],
        },
      },
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Booking service unavailable" });
  }
});

const PAYMENT_SERVICE =
  process.env.PAYMENT_SERVICE_URL || "http://localhost:3002";

// ─── Payments ─────────────────────────────────────────────────────────────
// POST /payments/calculate — calculate price (frontend only)
app.post("/payments/calculate", async (req, res) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE}/payments/calculate`,
      req.body,
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Payment service unavailable" });
  }
});

// POST /payments/:paymentId/pay — process payment
app.post("/payments/:paymentId/pay", async (req, res) => {
  try {
    const response = await axios.post(
      `${PAYMENT_SERVICE}/payments/${req.params.paymentId}/pay`,
      req.body,
      {
        headers: {
          "x-session-token": req.headers["x-session-token"],
        },
      },
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Payment service unavailable" });
  }
});

// GET /payments/:paymentId — get payment details
app.get("/payments/:paymentId", async (req, res) => {
  try {
    const response = await axios.get(
      `${PAYMENT_SERVICE}/payments/${req.params.paymentId}`,
      {
        headers: {
          "x-session-token": req.headers["x-session-token"],
        },
      },
    );
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Payment service unavailable" });
  }
});

// GET /payments — get all payments for logged in customer
app.get("/payments", async (req, res) => {
  try {
    const response = await axios.get(`${PAYMENT_SERVICE}/payments`, {
      headers: {
        "x-session-token": req.headers["x-session-token"],
      },
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res
      .status(err.response?.status || 502)
      .json(err.response?.data || { error: "Payment service unavailable" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
