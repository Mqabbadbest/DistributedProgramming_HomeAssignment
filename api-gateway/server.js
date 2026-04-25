require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const CUSTOMER_SERVICE =
  process.env.CUSTOMER_SERVICE_URL || "http://localhost:3000";

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
