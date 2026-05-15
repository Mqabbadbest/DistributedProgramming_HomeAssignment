require("dotenv").config();
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_PROJECT_ID,
  });
  console.log("Firebase Admin initialized.");
} else {
  admin.app();
  console.log("Reusing existing Firebase Admin instance.");
}

const db = admin.firestore();
console.log("✓ Firestore database connected");

module.exports = db;
