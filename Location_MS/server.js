require("dotenv").config();
const express = require("express");
const locationRoutes = require("./src/routes/LocationRoutes");

const app = express();
app.use(express.json());

app.use("/locations", locationRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Location service running on port ${PORT}`));
