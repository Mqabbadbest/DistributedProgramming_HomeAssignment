const axios = require("axios");

const getFareDetails = async (startLocation, endLocation) => {
  const response = await axios.get(
    "https://taxi-fare-calculator.p.rapidapi.com/search-geo",
    {
      params: {
        dep_lat: startLocation.lat,
        dep_lng: startLocation.lng,
        arr_lat: endLocation.lat,
        arr_lng: endLocation.lng,
      },
      headers: {
        "x-rapidapi-host": "taxi-fare-calculator.p.rapidapi.com",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY2,
      },
    },
  );

  // Log response for debugging
  console.log("Fare API Response:", JSON.stringify(response.data, null, 2));

  // Validate response structure
  if (
    !response.data.journey ||
    !response.data.journey.fares ||
    !Array.isArray(response.data.journey.fares)
  ) {
    throw new Error(
      `Invalid fare response: fares array not found. Response: ${JSON.stringify(response.data)}`,
    );
  }

  // Find the "by Day" fare from the fares array
  const dayFare = response.data.journey.fares.find((f) => f.name === "by Day");
  if (!dayFare) {
    throw new Error(
      `Day fare not found in response. Available fares: ${response.data.journey.fares.map((f) => f.name).join(", ")}`,
    );
  }

  return {
    durationMinutes: response.data.journey.duration, // in minutes
    distanceKilometers: response.data.journey.distance, // in kilometers
    cabFareCents: dayFare.price_in_cents, // in cents
    cabFare: dayFare.price_in_cents / 100, // converted to euros
  };
};

module.exports = { getFareDetails };
