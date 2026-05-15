const { fetchWeatherApi } = require("openmeteo");

/**
 * Retrieves weather data for a given latitude and longitude using the Open-Meteo API.
 * The user can search the forecast for the next days of their favorite locations and check the weather conditions.
 *
 * @param {*} lat
 * @param {*} lng
 * @returns
 */
const getWeatherForLocation = async (lat, lng) => {
  const params = {
    latitude: lat,
    longitude: lng,
    daily: [
      "sunrise",
      "sunset",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "temperature_2m_min",
      "temperature_2m_max",
      "precipitation_probability_mean",
    ],
    past_days: 0,
    forecast_days: 7,
  };

  const url = "https://api.open-meteo.com/v1/forecast";
  const responses = await fetchWeatherApi(url, params);
  const response = responses[0];

  const utcOffsetSeconds = response.utcOffsetSeconds();
  const daily = response.daily();

  const sunrise = daily.variables(0);
  const sunset = daily.variables(1);

  const timeArray = Array.from(
    {
      length:
        (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval(),
    },
    (_, i) =>
      new Date(
        (Number(daily.time()) + i * daily.interval() + utcOffsetSeconds) * 1000,
      ),
  );

  return {
    coordinates: {
      latitude: response.latitude(),
      longitude: response.longitude(),
      elevation: response.elevation(),
    },
    daily: {
      time: timeArray,
      sunrise: [...Array(sunrise.valuesInt64Length())].map(
        (_, i) =>
          new Date((Number(sunrise.valuesInt64(i)) + utcOffsetSeconds) * 1000),
      ),
      sunset: [...Array(sunset.valuesInt64Length())].map(
        (_, i) =>
          new Date((Number(sunset.valuesInt64(i)) + utcOffsetSeconds) * 1000),
      ),
      wind_speed_10m_max: Array.from(daily.variables(2).valuesArray()),
      wind_gusts_10m_max: Array.from(daily.variables(3).valuesArray()),
      temperature_2m_min: Array.from(daily.variables(4).valuesArray()),
      temperature_2m_max: Array.from(daily.variables(5).valuesArray()),
      precipitation_probability_mean: Array.from(
        daily.variables(6).valuesArray(),
      ),
    },
  };
};

module.exports = { getWeatherForLocation };
