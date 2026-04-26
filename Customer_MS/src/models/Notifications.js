const { v4: uuidv4 } = require("uuid");

class Notification {
  constructor({
    id = uuidv4(),
    customerId,
    message,
    type = "info",
    read = false,
    createdAt = new Date(),
  }) {
    this.id = id;
    this.customerId = customerId;
    this.message = message;
    this.type = type;
    this.read = read;
    this.createdAt = createdAt;
  }

  toFirestore() {
    return {
      id: this.id,
      customerId: this.customerId,
      message: this.message,
      type: this.type,
      read: this.read,
      createdAt: this.createdAt,
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Notification({
      ...data,
      createdAt: data.createdAt?.toDate(),
    });
  }
}

module.exports = Notification;
