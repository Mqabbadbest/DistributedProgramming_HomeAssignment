require("dotenv").config();
const express = require("express");
const paymentRoutes = require("./src/routes/paymentRoutes");

const app = express();
app.use(express.json());

app.use("/payments", paymentRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Payment service running on port ${PORT}`));
