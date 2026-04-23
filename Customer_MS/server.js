// server.js
require("dotenv").config();
const express = require("express");
const customerRoutes = require("./src/routes/customerRoutes");

const app = express();
app.use(express.json());

app.use("/customers", customerRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Customer service running on port ${PORT}`));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
