// src/repositories/CustomerRepository.js
require("dotenv").config();
const db = require("../../db");
const Customer = require("../models/Customer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const COLLECTION = "customers";

class CustomerRepository {
  async register({ firstName, lastName, email, phone, password }) {
    console.log("Registering customer with email:", email);
    const existing = await this.findByEmail(email);
    if (existing) {
      console.log("Customer with email:", email, "already exists");
      throw new Error("Email already registered");
    }

    console.log("Creating new customer with email:", email);
    const passwordHash = await bcrypt.hash(password, 10);
    const customer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
    });

    try {
      console.log("Saving customer to Firestore with ID:", customer.id);
      await db
        .collection(COLLECTION)
        .doc(customer.id)
        .set(customer.toFirestore());
    } catch (error) {
      console.error("Error saving customer to Firestore:", error);
      throw new Error("Failed to register customer");
    }

    return customer;
  }

  async login({ email, password }) {
    console.log("Attempting login for email:", email);
    const customer = await this.findByEmail(email);
    if (!customer) {
      console.log("Customer with email:", email, "not found");
      throw new Error("Invalid credentials");
    }

    const match = await bcrypt.compare(password, customer.passwordHash);
    if (!match) {
      console.log("Password mismatch for email:", email);
      throw new Error("Invalid credentials");
    }

    const token = uuidv4();
    await db.collection("sessions").doc(token).set({
      customerId: customer.id,
      createdAt: new Date(),
    });

    console.log("Login successful for email:", email);
    return { customer, token };
  }

  async findById(id) {
    try {
      console.log("Finding customer by ID:", id);
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      return Customer.fromFirestore(doc);
    } catch (error) {
      console.error("Error finding customer by ID:", error);
      throw new Error("Failed to find customer");
    }
  }

  async findByToken(token) {
    const doc = await db.collection("sessions").doc(token).get();
    if (!doc.exists) return null;
    const { customerId } = doc.data();
    return this.findById(customerId);
  }

  async findByEmail(email) {
    let snapshot;
    try {
      console.log("Finding customer by email:", email);
      snapshot = await db
        .collection(COLLECTION)
        .where("email", "==", email)
        .limit(1)
        .get();
    } catch (error) {
      console.error("Error finding customer by email:", error);
      throw new Error("Failed to find customer");
    }

    if (snapshot.empty) return null;
    return Customer.fromFirestore(snapshot.docs[0]);
  }

  async getNotifications(customerId) {
    console.log(
      "[CustomerMS] Fetching notifications for customer:",
      customerId,
    );
    const snapshot = await db
      .collection("notifications")
      .where("customerId", "==", customerId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return { ...data, createdAt: data.createdAt?.toDate() };
    });
  }

  async createNotification(customerId, message, type = "info") {
    const Notification = require("../models/Notifications");
    const notification = new Notification({ customerId, message, type });
    await db
      .collection("notifications")
      .doc(notification.id)
      .set(notification.toFirestore());
    return notification;
  }

  async markDiscountNotificationSent(customerId) {
    await db.collection("customers").doc(customerId).update({
      isDiscountNotificationSent: true,
      updatedAt: new Date(),
    });
  }

  async markDiscountUsed(customerId) {
    await db.collection("customers").doc(customerId).update({
      isDiscountUsed: true,
      updatedAt: new Date(),
    });
  }

  async getDiscountStatus(customerId) {
    const doc = await db.collection("customers").doc(customerId).get();
    if (!doc.exists) {
      // Return default values if customer doesn't exist (shouldn't happen, but handle gracefully)
      return {
        isDiscountNotificationSent: false,
        isDiscountUsed: false,
      };
    }
    const data = doc.data();
    return {
      isDiscountNotificationSent: data.isDiscountNotificationSent || false,
      isDiscountUsed: data.isDiscountUsed || false,
    };
  }
}

module.exports = new CustomerRepository();
