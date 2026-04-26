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
  const hour = new Date(dateTime).getHours();
  // Between 12:00 AM (0) and 8:00 AM → 1.2
  if (hour >= 0 && hour < 8) return 1.2;
  // Between 8:00 AM and 11:59 PM → 1
  return 1;
};

/**
 * Calculates the total price for a cab booking.
 * Formula: cabFare × cabMultiplier × daytimeMultiplier × passengersMultiplier
 * @param {number} cabFare - The base fare from the external API in euros
 * @param {string} cabType - Economic | Premium | Executive
 * @param {string} dateTime - ISO date string of the booking
 * @param {number} passengers - Number of passengers
 * @returns {number} Total price rounded to 2 decimal places
 */
const calculatePrice = (cabFare, cabType, dateTime, passengers) => {
  const cabMultiplier = CAB_MULTIPLIERS[cabType];
  if (!cabMultiplier) throw new Error(`Invalid cab type: ${cabType}`);

  const daytimeMultiplier = getDaytimeMultiplier(dateTime);
  const passengersMultiplier = getPassengersMultiplier(passengers);

  console.log(`Fare breakdown:
    cabFare:              €${cabFare}
    cabMultiplier:        x${cabMultiplier}  (${cabType})
    daytimeMultiplier:    x${daytimeMultiplier}
    passengersMultiplier: x${passengersMultiplier}
  `);

  const total =
    cabFare * cabMultiplier * daytimeMultiplier * passengersMultiplier;
  return parseFloat(total.toFixed(2));
};

module.exports = { calculatePrice };
