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

module.exports = router;
