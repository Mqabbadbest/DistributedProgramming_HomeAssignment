const express = require("express");
const router = express.Router();
const { getFareDetails } = require("../utils/fareService");

/**
 * POST /calculate — calculate fare details based on start and end locations
 * This endpoint is used by the Payment MS to get the base fare for a trip, which is then used in the price calculation.
 */
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
