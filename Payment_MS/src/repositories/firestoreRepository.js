const db = require("../../db");
const { Payment } = require("../models/Payment");
const { tokenizeCard, maskCardNumber } = require("../utils/cardTokenizer");

const COLLECTION = "payments";

class PaymentRepository {
  async create({ customerId, bookingId, price }) {
    const payment = new Payment({ customerId, bookingId, price });
    await db.collection(COLLECTION).doc(payment.id).set(payment.toFirestore());
    return payment;
  }

  async markFailed(paymentId) {
    const doc = await db.collection(COLLECTION).doc(paymentId).get();
    if (!doc.exists) throw new Error("Payment not found");

    await db.collection(COLLECTION).doc(paymentId).update({
      status: "failed",
      updatedAt: new Date(),
    });
  }

  async pay(paymentId, { cardHolderName, cardNumber, cvv, cardExpiry }) {
    const doc = await db.collection(COLLECTION).doc(paymentId).get();
    if (!doc.exists) throw new Error("Payment not found");

    const payment = Payment.fromFirestore(doc);
    if (payment.status === "completed")
      throw new Error("Payment already completed");

    const cardToken = tokenizeCard({ cardNumber, cvv, cardExpiry });

    // Only store cardholder name and masked number
    const maskedCardNumber = maskCardNumber(cardNumber);

    payment.cardHolderName = cardHolderName;
    payment.maskedCardNumber = maskedCardNumber;
    payment.cardToken = cardToken;
    payment.status = "completed";
    payment.updatedAt = new Date();

    await db.collection(COLLECTION).doc(paymentId).update({
      cardHolderName,
      maskedCardNumber,
      cardToken,
      status: "completed",
      updatedAt: payment.updatedAt,
    });

    return this.safePayment(payment);
  }

  async findById(paymentId) {
    const doc = await db.collection(COLLECTION).doc(paymentId).get();
    if (!doc.exists) return null;
    return this.safePayment(Payment.fromFirestore(doc));
  }

  async findByCustomer(customerId) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("customerId", "==", customerId)
      .get();
    return snapshot.docs.map((doc) =>
      this.safePayment(Payment.fromFirestore(doc)),
    );
  }

  // Strip cardToken before returning to client — never expose it via API
  safePayment(payment) {
    const { cardToken: _, ...safe } = payment;
    return safe;
  }
}

module.exports = new PaymentRepository();
