const express = require("express");
const router = express.Router();
const customerRepository = require("../repositories/firestoreRepository");
//customerRoutes
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password)
      return res.status(400).json({ error: "All fields are required" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Invalid email address" });

    const phoneRegex = /^(\+00356|\+356)?\s?\d{8}$/;
    if (!phoneRegex.test(phone))
      return res.status(400).json({ error: "Invalid phone number" });

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

    const customer = await customerRepository.login({ email, password });
    const { passwordHash: _, ...safe } = customer;
    res.status(200).json(safe);
  } catch (err) {
    res
      .status(err.message === "Invalid credentials" ? 401 : 500)
      .json({ error: err.message });
  }
});

// GET /customers/:id
router.get("/:id", async (req, res) => {
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
