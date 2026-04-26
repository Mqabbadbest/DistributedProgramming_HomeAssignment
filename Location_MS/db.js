require("dotenv").config();
const admin = require("firebase-admin");

try {
  if (!process.env.GOOGLE_PROJECT_ID) {
    throw new Error("GOOGLE_PROJECT_ID environment variable is not set");
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set",
    );
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_PROJECT_ID,
  });

  console.log("✓ Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("✗ Failed to initialize Firebase Admin SDK:", error.message);
  process.exit(1);
}

const db = admin.firestore();
console.log("✓ Firestore database connected");

module.exports = db;
