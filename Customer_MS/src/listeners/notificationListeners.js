const notificationEmitter = require("../events/notificationEmitter");
const customerRepository = require("../repositories/firestoreRepository");

const THREE_MINUTES = 3 * 60 * 1000;

// Listen for cab-assigned events
notificationEmitter.on("cab-assigned", async (data) => {
  try {
    const { customerId, bookingId, cabType } = data;

    console.log(
      `[CustomerMS] [CabReady] Scheduling notification in 3 minutes for booking:`,
      bookingId,
    );

    setTimeout(async () => {
      try {
        await customerRepository.createNotification(
          customerId,
          `Your ${cabType} cab is on the way! Your driver has been assigned and is heading to your pickup location.`,
          "cab_ready",
        );
        console.log(
          `[CustomerMS] [CabReady] ✓ Notification created for booking:`,
          bookingId,
        );
      } catch (err) {
        console.error(
          "[CustomerMS] [CabReady] ✗ Error creating notification:",
          err.message,
        );
      }
    }, THREE_MINUTES);
  } catch (err) {
    console.error(
      "[CustomerMS] ✗ Error in cab-assigned listener:",
      err.message,
    );
  }
});

// Listen for discount-earned events
notificationEmitter.on("discount-earned", async (data) => {
  try {
    const { customerId, discountPercentage } = data;

    await customerRepository.createNotification(
      customerId,
      `You have completed 3 bookings! You have earned a ${discountPercentage}% discount on your next ride.`,
      "discount",
    );

    console.log(
      `[CustomerMS] ✓ Discount notification created for customer:`,
      customerId,
    );
  } catch (err) {
    console.error(
      "[CustomerMS] ✗ Error in discount-earned listener:",
      err.message,
    );
  }
});

module.exports = notificationEmitter;
