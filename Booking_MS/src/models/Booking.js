const { v4: uuidv4 } = require("uuid");

const CAB_TYPES = ["Economic", "Premium", "Executive"];

class Booking {
  constructor({
    id = uuidv4(),
    customerId,
    startLocation,
    endLocation,
    dateTime,
    passengers,
    cabType,
    price = 0,
    cabFareCents = null,
    durationMinutes = null,
    distanceKilometers = null,
    paymentId = null,
    status = "upcoming",
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.customerId = customerId;
    this.startLocation = startLocation;
    this.endLocation = endLocation;
    this.dateTime = dateTime;
    this.passengers = passengers;
    this.cabType = cabType;
    this.price = price;
    this.cabFareCents = cabFareCents;
    this.durationMinutes = durationMinutes;
    this.distanceKilometers = distanceKilometers;
    this.paymentId = paymentId;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      id: this.id,
      customerId: this.customerId,
      startLocation: this.startLocation,
      endLocation: this.endLocation,
      dateTime: this.dateTime,
      passengers: this.passengers,
      cabType: this.cabType,
      price: this.price,
      cabFareCents: this.cabFareCents,
      durationMinutes: this.durationMinutes,
      distanceKilometers: this.distanceKilometers,
      paymentId: this.paymentId,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Booking({
      ...data,
      dateTime: data.dateTime?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}

module.exports = { Booking, CAB_TYPES };
