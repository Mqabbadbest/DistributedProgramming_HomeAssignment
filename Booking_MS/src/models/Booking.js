const { v4: uuidv4 } = require("uuid");

class Booking {
  constructor({
    id = uuidv4(),
    customerId,
    startLocation,
    endLocation,
    dateTime,
    passengers,
    cabType,
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

module.exports = Booking;
