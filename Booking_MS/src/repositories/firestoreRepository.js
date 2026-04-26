const db = require("../../db");
const { Booking, CAB_TYPES } = require("../models/Booking");

const COLLECTION = "bookings";

class BookingRepository {
  async create({
    customerId,
    startLocation,
    endLocation,
    dateTime,
    passengers,
    cabType,
    price,
    cabFareCents,
    durationMinutes,
    distanceKilometers,
  }) {
    if (!CAB_TYPES.includes(cabType))
      throw new Error(
        `Invalid cab type. Must be one of: ${CAB_TYPES.join(", ")}`,
      );

    const booking = new Booking({
      customerId,
      startLocation,
      endLocation,
      dateTime: new Date(dateTime),
      passengers,
      cabType,
      price,
      cabFareCents,
      durationMinutes,
      distanceKilometers,
    });

    await db.collection(COLLECTION).doc(booking.id).set(booking.toFirestore());
    return booking;
  }

  async getCurrentBookings(customerId) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("customerId", "==", customerId)
      .where("status", "==", "upcoming")
      .get();
    return snapshot.docs.map((doc) => Booking.fromFirestore(doc));
  }

  async getPastBookings(customerId) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("customerId", "==", customerId)
      .where("status", "==", "completed")
      .get();
    return snapshot.docs.map((doc) => Booking.fromFirestore(doc));
  }

  async findById(id) {
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.exists) return null;
    return Booking.fromFirestore(doc);
  }

  async updateBookingWithPaymentDetails(
    bookingId,
    { paymentId, price, cabFareCents, durationMinutes, distanceKilometers },
  ) {
    await db.collection(COLLECTION).doc(bookingId).update({
      paymentId,
      price,
      cabFareCents,
      durationMinutes,
      distanceKilometers,
      updatedAt: new Date(),
    });
  }

  async updateBookingWithPaymentId(bookingId, paymentId) {
    await db.collection(COLLECTION).doc(bookingId).update({
      paymentId,
      updatedAt: new Date(),
    });
    // Return updated booking
    return this.findById(bookingId);
  }
}

module.exports = new BookingRepository();
