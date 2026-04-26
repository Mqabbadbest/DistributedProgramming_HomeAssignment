const CAB_MULTIPLIERS = {
  Economic: 1,
  Premium: 1.2,
  Executive: 1.4,
};

const getPassengersMultiplier = (passengers) => {
  if (passengers >= 1 && passengers <= 4) return 1;
  if (passengers >= 5 && passengers <= 8) return 2;
  throw new Error("Passengers must be between 1 and 8");
};

const getDaytimeMultiplier = (dateTime) => {
  if (!dateTime) return 1; // Default if no time provided
  const date = new Date(dateTime);
  const hour = date.getHours();
  // Between 12:00 AM (0) and 7:59 AM: 1.2x
  // Between 8:00 AM (8) and 11:59 PM (23): 1x
  if (hour >= 0 && hour < 8) {
    return 1.2; // Late night surcharge
  }
  return 1; // Normal rate
};

/**
 * Calculates the total price for a cab booking.
 * Formula: cabFare × cabMultiplier × passengersMultiplier × daytimeMultiplier
 * @param {number} cabFare - The base fare from the external API in euros
 * @param {string} cabType - Economic | Premium | Executive
 * @param {number} passengers - Number of passengers
 * @param {string} dateTime - ISO datetime string for the ride
 * @returns {number} Total price rounded to 2 decimal places
 */
const calculatePrice = (cabFare, cabType, passengers, dateTime) => {
  const cabMultiplier = CAB_MULTIPLIERS[cabType];
  if (!cabMultiplier) throw new Error(`Invalid cab type: ${cabType}`);

  const passengersMultiplier = getPassengersMultiplier(passengers);
  const daytimeMultiplier = getDaytimeMultiplier(dateTime);

  console.log(`Fare breakdown:
    cabFare:              €${cabFare}
    cabMultiplier:        x${cabMultiplier}  (${cabType})
    passengersMultiplier: x${passengersMultiplier}
    daytimeMultiplier:    x${daytimeMultiplier}  (${new Date(dateTime).toLocaleTimeString()})
  `);

  const total =
    cabFare * cabMultiplier * passengersMultiplier * daytimeMultiplier;
  return parseFloat(total.toFixed(2));
};

module.exports = { calculatePrice, getDaytimeMultiplier };
