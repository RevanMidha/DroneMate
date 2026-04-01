require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Setup Express
const app = express();
const port = process.env.PORT || 5000;

// CORS Middleware
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS || "*";
  res.header("Access-Control-Allow-Origin", allowedOrigins);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// JSON Middleware
app.use(express.json());

// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// 📦 MULTER SETUP
// =======================

// Only accept image file types
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp, bmp) are allowed."), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// =======================
// 🛢️ MYSQL CONNECTION
// =======================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "dronemate",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    process.exit(1);
  }

  console.log("✅ Connected to MySQL!");

  // Create table automatically
  db.query(`
    CREATE TABLE IF NOT EXISTS images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image_path VARCHAR(255) NOT NULL UNIQUE,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sync existing images on startup
  syncImagesToDB();
});

// =======================
// 📸 SYNC EXISTING IMAGES
// =======================
const uploadDir = path.join(__dirname, "uploads");

function syncImagesToDB() {
  if (!fs.existsSync(uploadDir)) return;

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads folder:", err);
      return;
    }

    // Filter to only image files
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(file)
    );

    imageFiles.forEach((file) => {
      const imagePath = `uploads/${file}`;

      db.query(
        "INSERT IGNORE INTO images (image_path) VALUES (?)",
        [imagePath],
        (err) => {
          if (err) console.error("Insert error:", err);
        }
      );
    });

    console.log(`📸 Synced ${imageFiles.length} image(s) to DB`);
  });
}

// =======================
// 📤 UPLOAD IMAGE (ESP32)
// =======================
app.post("/save-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const imagePath = `uploads/${req.file.filename}`;

  db.query(
    "INSERT INTO images (image_path) VALUES (?)",
    [imagePath],
    (err) => {
      if (err) {
        console.error("Error saving image:", err);
        return res.status(500).json({ error: "Error saving image." });
      }

      res.status(200).json({ message: "Image saved successfully.", path: imagePath });
    }
  );
});

// =======================
// 🖼️ GET IMAGES
// =======================
app.get("/get-images", (req, res) => {
  const query = "SELECT image_path FROM images ORDER BY timestamp DESC";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error retrieving images." });
    }

    const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;

    const images = results.map((image) => {
      const relativePath = image.image_path;
      const fullPath = path.join(__dirname, relativePath);

      let modifiedTime = null;

      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          modifiedTime = stats.mtime;
        }
      } catch (err) {
        console.error(err);
      }

      return {
        image_path: `${serverUrl}/${relativePath}`,
        modified_time: modifiedTime,
      };
    });

    res.json(images);
  });
});

// =======================
// ❌ 404 HANDLER
// =======================
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

// =======================
// 🛑 GLOBAL ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// =======================
// 🚀 START SERVER
// =======================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});