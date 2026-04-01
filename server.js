require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { initializeApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL } = require("firebase/storage");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

// Setup Express
const app = express();
const port = process.env.PORT || 5000;

// CORS Middleware
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigins);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(cors());
app.use(express.json());

// =======================
// 🔥 FIREBASE SETUP
// =======================
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

// =======================
// 📦 MULTER SETUP (MEMORY FOR SERVERLESS)
// =======================
const upload = multer({ storage: multer.memoryStorage() });

// =======================
// 📤 UPLOAD IMAGE (ESP32)
// =======================
app.post("/save-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    // 1. Upload directly to Firebase Storage
    const fileName = `${Date.now()}_${req.file.originalname || 'capture.jpg'}`;
    const storageRef = ref(storage, `uploads/${fileName}`);
    
    // Pass contentType for proper rendering in dashboards
    const metadata = { contentType: req.file.mimetype || "image/jpeg" };
    const snapshot = await uploadBytes(storageRef, req.file.buffer, metadata);
    
    // 2. Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 3. Save URL & Metadata to Firestore
    await addDoc(collection(db, "images"), {
      image_path: downloadURL,
      modified_time: serverTimestamp() // automatically sets backend time
    });

    console.log("📸 Image securely stored in Firebase.");
    res.status(200).send("✅ Image saved successfully in Cloud.");
  } catch (error) {
    console.error("Error saving to Firebase:", error);
    res.status(500).send("Error saving image to Firebase.");
  }
});

// For local testing & export for Vercel
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Serverless backend running locally at http://localhost:${port}`);
  });
}

module.exports = app;