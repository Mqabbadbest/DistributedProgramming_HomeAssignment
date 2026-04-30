const express = require("express");
const router = express.Router();
const { getFareDetails } = require("../utils/fareService");

// POST /fares/calculate — calculate fare for a route
router.post("/calculate", async (req, res) => {
  try {
    const { startLocation, endLocation } = req.body;

    if (!startLocation || !endLocation)
      return res
        .status(400)
        .json({ error: "startLocation and endLocation are required" });

    if (
      !startLocation.lat ||
      !startLocation.lng ||
      !endLocation.lat ||
      !endLocation.lng
    )
      return res.status(400).json({
        error: "startLocation and endLocation must have lat and lng properties",
      });

    console.log("[FareEstimationMS] /calculate called with data:", {
      startLocation,
      endLocation,
    });

    const fareDetails = await getFareDetails(startLocation, endLocation);

    console.log(
      "[FareEstimationMS] /calculate: Fare details calculated:",
      fareDetails,
    );

    res.status(200).json(fareDetails);
  } catch (err) {
    console.error("[FareEstimationMS] /calculate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
