const db = require("../../db");
const { FavouriteLocation } = require("../models/FavouriteLocation");

const COLLECTION = "favourite_locations";

class LocationRepository {
  async create({ customerId, name, lat, lng }) {
    const location = new FavouriteLocation({ customerId, name, lat, lng });
    await db
      .collection(COLLECTION)
      .doc(location.id)
      .set(location.toFirestore());
    return location;
  }

  async update(locationId, customerId, { name, lat, lng }) {
    const doc = await db.collection(COLLECTION).doc(locationId).get();
    if (!doc.exists) throw new Error("Location not found");

    const location = FavouriteLocation.fromFirestore(doc);
    if (location.customerId !== customerId) throw new Error("Unauthorized");

    const updates = {
      ...(name !== undefined && { name }),
      ...(lat !== undefined && { lat }),
      ...(lng !== undefined && { lng }),
      updatedAt: new Date(),
    };

    await db.collection(COLLECTION).doc(locationId).update(updates);
    return { ...location, ...updates };
  }

  async delete(locationId, customerId) {
    const doc = await db.collection(COLLECTION).doc(locationId).get();
    if (!doc.exists) throw new Error("Location not found");

    const location = FavouriteLocation.fromFirestore(doc);
    if (location.customerId !== customerId) throw new Error("Unauthorized");

    await db.collection(COLLECTION).doc(locationId).delete();
  }

  async findAllByCustomer(customerId) {
    const snapshot = await db
      .collection(COLLECTION)
      .where("customerId", "==", customerId)
      .get();
    return snapshot.docs.map((doc) => FavouriteLocation.fromFirestore(doc));
  }

  async findById(locationId) {
    const doc = await db.collection(COLLECTION).doc(locationId).get();
    if (!doc.exists) return null;
    return FavouriteLocation.fromFirestore(doc);
  }
}

module.exports = new LocationRepository();
