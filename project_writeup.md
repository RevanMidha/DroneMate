# DroneMate: Project Writeup

## Overview
DroneMate is a serverless control and monitoring station designed for an ESP32 CAM-equipped drone. The goal of this project is to provide a user-friendly, secure, and responsive web application where drone operators can view historical captures and manage live feeds natively on the cloud.

## Motivation
With the advent of affordable IoT components like the ESP32 CAM, building custom drones has become highly accessible. DroneMate bridges the gap between hardware and a robust web interface by dropping traditional heavy backend structures in favor of a fast, ephemeral, Vercel-ready serverless stack.

## System Architecture

The project has been refactored into a modern serverless model:

### 1. Frontend (React)
The frontend is built using React to ensure a highly responsive SPA experience.
- **Authentication Flow**: Driven by Firebase Authentication. Users must log in to access the system.
- **Dashboard Interface**: Presents a clean UI where the user can open a side menu to log out, view live streams, or capture photos. 
- **Direct Cloud connection**: The gallery connects directly to **Firebase Firestore** to pull Image URLs securely and rapidly, skipping unnecessary hops through standard REST backends.

### 2. Serverless API (Vercel Node.js)
The backend routes ESP32 hardware uploads safely into the cloud.
- **Memory Storage Middleware**: Using `multer` memory storage ensures that incoming image payloads from the ESP32 CAM are kept strictly in execution RAM since serverless environments do not have persistent hard drives.
- **Firebase integration**: The API function accepts the image, natively passes it to **Firebase Storage** over an encrypted stream, and generates a public URL. This URL, alongside a server timestamp, is logged instantly to **Firebase Firestore**.

### 3. Data Persistence (Firebase Suite)
The entire persistence layer relies on Firebase. This makes the project highly scalable and infinitely flexible for future client apps (e.g., an iOS controller app tracking identical Firestore documents without needing an API).

## Future Enhancements
- **Live Video Streaming**: Integrating WebSockets or WebRTC to stream the ESP32 CAM feed directly into the Dashboard.
- **Remote Telemetry**: Capturing and displaying drone telemetry (battery, altitude, GPS) via Firestore Real-Time document snapshots overlaid on the dashboard.

## Conclusion
DroneMate successfully pivots from legacy VM-hosted infrastructure (MySQL/Local Disk) to a Vercel-optimized serverless topology. It separates concerns gracefully and heavily relies on Firebase to deliver instantaneous and infinitely scalable drone photo management.
