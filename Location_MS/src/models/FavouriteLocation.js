const { v4: uuidv4 } = require("uuid");

class FavouriteLocation {
  constructor({
    id = uuidv4(),
    customerId,
    name,
    lat,
    lng,
    createdAt = new Date(),
    updatedAt = new Date(),
  }) {
    this.id = id;
    this.customerId = customerId;
    this.name = name;
    this.lat = lat;
    this.lng = lng;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toFirestore() {
    return {
      id: this.id,
      customerId: this.customerId,
      name: this.name,
      lat: this.lat,
      lng: this.lng,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new FavouriteLocation({
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    });
  }
}

module.exports = { FavouriteLocation };
