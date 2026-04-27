//db.js
require("dotenv").config();
const admin = require("firebase-admin");

// 1. Check if the SDK is already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_PROJECT_ID,
  });
  console.log("🔥 Firebase Admin initialized.");
} else {
  // 2. If it already exists, just use the existing instance
  admin.app();
  console.log("♻️  Reusing existing Firebase Admin instance.");
}

const db = admin.firestore();
console.log("✓ Firestore database connected");

module.exports = db;
