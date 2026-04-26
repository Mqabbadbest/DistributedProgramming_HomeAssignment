// src/models/Customer.js
const { v4: uuidv4 } = require("uuid");

class Customer {
  constructor({
    id = uuidv4(),
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    isDiscountNotificationSent = false,
    isDiscountUsed = false,
    createdAt = new Date(),
    updatedAt = new Date(),
    isActive = true,
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    this.passwordHash = passwordHash;
    this.isDiscountNotificationSent = isDiscountNotificationSent;
    this.isDiscountUsed = isDiscountUsed;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isActive = isActive;
  }

  toFirestore() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      passwordHash: this.passwordHash,
      isDiscountNotificationSent: this.isDiscountNotificationSent,
      isDiscountUsed: this.isDiscountUsed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Customer({
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}

module.exports = Customer;
