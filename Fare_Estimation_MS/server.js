require("dotenv").config();
const express = require("express");
const fareRoutes = require("./src/routes/fareRoutes");

const app = express();
app.use(express.json());

app.use("/fares", fareRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () =>
  console.log(`Fare Estimation service running on port ${PORT}`),
);
