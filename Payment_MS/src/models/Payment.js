const { v4: uuidv4 } = require("uuid");

class Payment {
  constructor({
    id = uuidv4(),
    customerId,
    bookingId,
    price,
    status = "pending",
    cardHolderName = "",
    maskedCardNumber = "", // 411111......1111
    cardToken = "", // encrypted card details
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.customerId = customerId;
    this.bookingId = bookingId;
    this.price = price;
    this.status = status;
    this.cardHolderName = cardHolderName;
    this.maskedCardNumber = maskedCardNumber;
    this.cardToken = cardToken;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      id: this.id,
      customerId: this.customerId,
      bookingId: this.bookingId,
      price: this.price,
      status: this.status,
      cardHolderName: this.cardHolderName,
      maskedCardNumber: this.maskedCardNumber,
      cardToken: this.cardToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Payment({
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}

module.exports = { Payment };
