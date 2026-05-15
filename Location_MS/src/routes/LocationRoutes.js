const express = require("express");
const router = express.Router();
const axios = require("axios");
const locationRepository = require("../repositories/firestoreRepository");
const { getWeatherForLocation } = require("../utils/weather");

const CUSTOMER_SERVICE_URL =
  process.env.CUSTOMER_SERVICE_URL || "http://localhost:3000";

const requireAuth = async (req, res, next) => {
  const token = req.headers["x-session-token"];
  if (!token) return res.status(401).json({ error: "Missing session token" });

  try {
    const response = await axios.get(`${CUSTOMER_SERVICE_URL}/customers/me`, {
      headers: { "x-session-token": token },
    });
    req.customer = response.data;
    req.customerId = response.data.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * POST /locations — create a new location for the authenticated customer
 * Body: { name, lat, lng }
 * Response: 201 Created with location data, or 400 Bad Request if missing/invalid fields, or 500 Internal Server Error on failure
 */
router.post("/", requireAuth, async (req, res) => {
  console.log("[LocationMS] POST /locations called");
  try {
    const { name, lat, lng } = req.body;

    if (!name || lat === undefined || lng === undefined)
      return res.status(400).json({ error: "name, lat and lng are required" });

    if (typeof lat !== "number" || typeof lng !== "number")
      return res.status(400).json({ error: "lat and lng must be numbers" });

    const location = await locationRepository.create({
      customerId: req.customerId,
      name,
      lat,
      lng,
    });

    console.log("[LocationMS] ✓ Location created:", location.id);
    res.status(201).json(location);
  } catch (err) {
    console.error("[LocationMS] ✗ Error creating location:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /locations — fetch all locations for the authenticated customer
 * Response: 200 OK with a list of locations, or 500 Internal Server Error on failure
 */
router.get("/", requireAuth, async (req, res) => {
  console.log("[LocationMS] GET /locations for customer:", req.customerId);
  try {
    const locations = await locationRepository.findAllByCustomer(
      req.customerId,
    );
    console.log(`[LocationMS] ✓ Found ${locations.length} locations`);
    res.status(200).json(locations);
  } catch (err) {
    console.error("[LocationMS] ✗ Error fetching locations:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /locations/:id — update an existing location for the authenticated customer
 * Path Parameters: { id }
 * Body: { name, lat, lng }
 * Response: 200 OK with updated location data, or 400 Bad Request if missing/invalid fields, or 500 Internal Server Error on failure
 */
router.put("/:id", requireAuth, async (req, res) => {
  console.log("[LocationMS] PUT /locations/:id →", req.params.id);
  try {
    const { name, lat, lng } = req.body;

    if (!name && lat === undefined && lng === undefined)
      return res
        .status(400)
        .json({ error: "At least one field to update is required" });

    if (typeof lat !== "number" || typeof lng !== "number")
      return res.status(400).json({ error: "lat and lng must be numbers" });

    const location = await locationRepository.update(
      req.params.id,
      req.customerId,
      { name, lat, lng },
    );

    console.log("[LocationMS] ✓ Location updated:", req.params.id);
    res.status(200).json(location);
  } catch (err) {
    console.error("[LocationMS] ✗ Error updating location:", err.message);
    res
      .status(
        err.message === "Location not found"
          ? 404
          : err.message === "Unauthorized"
            ? 403
            : 500,
      )
      .json({ error: err.message });
  }
});

/**
 * DELETE /locations/:id — delete a location for the authenticated customer
 * Path Parameters: { id }
 * Response: 200 OK with success message, or 404 Not Found if location doesn't exist, or 403 Forbidden if unauthorized, or 500 Internal Server Error on failure
 * Note: The service should ensure that only the owner of the location can delete it.
 */
router.delete("/:id", requireAuth, async (req, res) => {
  console.log("[LocationMS] DELETE /locations/:id →", req.params.id);
  try {
    await locationRepository.delete(req.params.id, req.customerId);
    console.log("[LocationMS] ✓ Location deleted:", req.params.id);
    res.status(200).json({ message: "Location deleted successfully" });
  } catch (err) {
    console.error("[LocationMS] ✗ Error deleting location:", err.message);
    res
      .status(
        err.message === "Location not found"
          ? 404
          : err.message === "Unauthorized"
            ? 403
            : 500,
      )
      .json({ error: err.message });
  }
});

/**
 * GET /locations/:id/weather — fetch weather data for a specific location
 * Path Parameters: { id }
 * Response: 200 OK with location and weather data, or 404 Not Found if location doesn't exist, or 403 Forbidden if unauthorized, or 500 Internal Server Error on failure
 */
router.get("/:id/weather", requireAuth, async (req, res) => {
  console.log("[LocationMS] GET /locations/:id/weather →", req.params.id);
  try {
    const location = await locationRepository.findById(req.params.id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    if (location.customerId !== req.customerId)
      return res.status(403).json({ error: "Unauthorized" });

    console.log(
      `[LocationMS] Fetching weather for: ${location.name} (${location.lat}, ${location.lng})`,
    );
    const weather = await getWeatherForLocation(location.lat, location.lng);

    console.log("[LocationMS] ✓ Weather fetched for location:", location.name);
    res.status(200).json({ location, weather });
  } catch (err) {
    console.error("[LocationMS] ✗ Error fetching weather:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
