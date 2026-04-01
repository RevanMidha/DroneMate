<div align="center">

<!-- Animated Banner -->
<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:0a0f1e,50:0d2137,100:1a3a5c&height=200&section=header&text=DroneMate&fontSize=72&fontColor=4fc3f7&fontAlignY=40&desc=Drone%20Control%20and%20Monitoring%20Platform&descAlignY=65&descSize=20&descColor=90caf9&animation=fadeIn" />

<br/>

<!-- Badges -->
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

<br/>

<p align="center">
  <b>A full-stack drone management web application — capture, store, and manage imagery from an ESP32 CAM drone.</b>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API</a> •
  <a href="#%EF%B8%8F-hardware-note">Hardware Note</a>
</p>

</div>

---

> **⚠️ Hardware Status:** The ESP32 CAM drone is **no longer connected** to this system. The Capture and Live Stream features on the dashboard will show a warning when clicked. The upload API endpoint (`/save-image`) is still fully functional — reconnecting any ESP32 CAM to the server will restore full functionality without any code changes.

> **📝 ESP32 Firmware:** The Arduino/ESP32 firmware code that originally ran on the drone is **not included** in this repository — it was developed separately and has been lost. A [reference sketch](#-esp32-reference-sketch) is provided below for anyone who wants to recreate the hardware integration.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 Secure Authentication
Firebase Auth with Login, Registration, Password Reset, and **username-based login**. Usernames are stored in Firestore for lookup. Every dashboard route is protected.

</td>
<td width="50%">

### 🖼️ Image Gallery
Photo gallery with glassmorphism overlay — images captured by the drone are uploaded via the API, stored locally, and displayed chronologically with lazy loading.

</td>
</tr>
<tr>
<td width="50%">

### 📡 Live Stream *(Hardware Required)*
Dashboard UI is wired up and ready for live video feed. Requires an ESP32 CAM to be connected to the server.

</td>
<td width="50%">

### 📸 Remote Capture *(Hardware Required)*
Trigger photo capture from the dashboard. The endpoint and UI are pre-configured — just connect the hardware.

</td>
</tr>
<tr>
<td width="50%">

### 🚀 Upload API
Express.js endpoint (`/save-image`) accepts multipart image uploads with file-type validation (JPEG, PNG, WebP, GIF, BMP) and a 10MB size limit.

</td>
<td width="50%">

### 🗄️ Auto-Provisioned DB
MySQL table is created automatically on server startup. Image files in `/uploads` are auto-synced to the database on every boot.

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           ESP32 CAM (Drone) — NOT CONNECTED         │
│         POST /save-image  (multipart/form-data)     │
└────────────────────────┬────────────────────────────┘
                         │  (reconnect any ESP32 CAM
                         │   to restore this link)
                         ▼
┌─────────────────────────────────────────────────────┐
│              Express.js Backend  :5000              │
│  • Multer → /uploads (file-type + size validation)  │
│  • MySQL → image metadata + timestamps              │
│  • CORS configured via ALLOWED_ORIGINS              │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              React Frontend  :3000                  │
│  • Firebase Auth (Login / Register / Reset)         │
│  • Firestore (Username → Email mapping)             │
│  • Protected Dashboard with glassmorphism UI        │
│  • Axios for API communication                      │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router, Axios |
| **UI** | Custom CSS, Glassmorphism, CSS Animations |
| **Authentication** | Firebase Auth (Email/Password) |
| **User Data** | Cloud Firestore (username mapping) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL (image metadata) |
| **File Handling** | Multer (validated uploads → local `/uploads`) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `v18+`
- [MySQL Server](https://dev.mysql.com/downloads/)
- A Firebase project with **Email/Password Authentication** and **Firestore** enabled

---

### Step 1 — Database Setup

```sql
CREATE DATABASE dronemate;
```

> The server auto-creates the `images` table on first startup.

---

### Step 2 — Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dronemate
ALLOWED_ORIGINS=*
```

> Firebase config is in `src/firebase.js`. Update it with your own keys if using a different project.

---

### Step 3 — Install & Run

```bash
# Install dependencies
npm install

# Start the backend (Terminal 1)
node server.js

# Start the frontend (Terminal 2)
npm start
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:5000` |

---

### Firestore Security Rules

For username-based login to work, set these rules in **Firebase Console → Firestore → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/save-image` | Upload an image (multipart, field: `image`) |
| `GET` | `/get-images` | Retrieve all stored images with timestamps |

**Example upload:**
```bash
curl -X POST http://localhost:5000/save-image \
  -F "image=@photo.jpg"
```

---

## ⚠️ Hardware Note

This project was originally built to interface with an **ESP32 CAM module** mounted on a custom drone. The hardware is **no longer connected**, and the original ESP32 Arduino firmware has been **lost** and is not included in this repository.

**What still works without the hardware:**
- ✅ User authentication (login, register, password reset, username login)
- ✅ Dashboard UI with all action cards
- ✅ Gallery (displays any images already in `/uploads`)
- ✅ Upload API — you can manually upload images via `curl` or Postman to test

**What requires the ESP32 CAM:**
- ❌ Live Stream — shows "ESP32 CAM is not connected" warning
- ❌ Remote Capture — shows "ESP32 CAM is not connected" warning
- ❌ Automatic image uploads from the drone

### 🔧 ESP32 Reference Sketch

If you want to recreate the hardware integration, configure your ESP32 CAM to POST captured images to the server:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* serverUrl = "http://<SERVER_IP>:5000/save-image";

void uploadPhoto() {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) return;

    HTTPClient http;
    http.begin(serverUrl);

    String boundary = "----DroneMate";
    String head = "--" + boundary + "\r\n"
                  "Content-Disposition: form-data; name=\"image\"; "
                  "filename=\"capture.jpg\"\r\n"
                  "Content-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--" + boundary + "--\r\n";

    size_t totalLen = head.length() + fb->len + tail.length();
    uint8_t *payload = (uint8_t *)malloc(totalLen);
    memcpy(payload, head.c_str(), head.length());
    memcpy(payload + head.length(), fb->buf, fb->len);
    memcpy(payload + head.length() + fb->len, tail.c_str(), tail.length());

    http.addHeader("Content-Type",
                   "multipart/form-data; boundary=" + boundary);
    http.POST(payload, totalLen);
    free(payload);
    http.end();
    esp_camera_fb_return(fb);
}
```

> Replace `<SERVER_IP>` with the local IP of the machine running `server.js`.

---

## 📁 Project Structure

```
DroneMate/
├── public/
│   └── index.html              # App shell
├── src/
│   ├── Components/
│   │   ├── Assets/             # Background image
│   │   ├── Dashboard/          # Dashboard UI + CSS
│   │   └── LoginSignup/        # Auth UI + CSS
│   ├── firebase.js             # Firebase + Firestore config
│   ├── App.js                  # Routes + protected route logic
│   ├── index.js                # Entry point
│   └── index.css               # Global styles + animations
├── uploads/                    # Stored images (auto-created, gitignored)
├── server.js                   # Express backend
├── .env                        # Environment variables (not committed)
└── package.json
```

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=0:1a3a5c,50:0d2137,100:0a0f1e&height=100&section=footer&animation=fadeIn" />

Made with ❤️ for drone enthusiasts

</div>
