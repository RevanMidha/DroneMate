# DroneMate

DroneMate is a fully serverless web interface designed to control and monitor an ESP32 CAM mounted on a drone. It features a secure user authentication system and a central dashboard to monitor and manage captured images and live drone feeds directly from the cloud.

## Features

- **User Authentication**: Secure Login, Registration, and Password Reset powered by Firebase Authentication.
- **Serverless Image Gallery**: View photos captured by the ESP32 CAM. Images are instantly queried from Firebase Firestore and populated on the dashboard.
- **Cloud Upload API**: A Vercel-ready Serverless Function (`/save-image`) provides a persistent upload endpoint for the ESP32 CAM, saving images securely to Firebase Storage.
- **Live Stream & Capture (Upcoming/Connected)**: Placeholders configured for receiving live feed and triggering remote photo capture when the hardware is connected.

## Architecture & Tech Stack

This project is built for **Vercel** serverless environments.

- **Frontend**: React, React Router, CSS.
- **Authentication**: Firebase Auth.
- **Backend**: Serverless Node.js (via Vercel).
- **Database**: Firebase Firestore.
- **File Storage**: Firebase Storage (process memory buffer uploads).

## Getting Started

### 1. Firebase Setup
Ensure you have a Firebase project with:
- **Authentication** (Email/Password) enabled.
- **Firestore Database**.
- **Firebase Storage** enabled.

### 2. Configure Environment Variables
Create a `.env` file in the root directory and add your Firebase configurations:
```env
REACT_APP_FIREBASE_API_KEY=your_value
REACT_APP_FIREBASE_AUTH_DOMAIN=your_value
REACT_APP_FIREBASE_PROJECT_ID=your_value
REACT_APP_FIREBASE_STORAGE_BUCKET=your_value
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_value
REACT_APP_FIREBASE_APP_ID=your_value
```

### 3. Deploy to Vercel
Since this project uses a `vercel.json` config, you can push your repository to GitHub and natively deploy it on Vercel seamlessly.
Vercel will build the React Frontend natively, and allocate the Node.js Express server to handle `/save-image` requests in a serverless function!

Alternatively, run locally:
```bash
npm install
node server.js & npm start
```

## Hardware Integration (ESP32)

To integrate your ESP32 CAM, configure it to make a `POST` request to `https://<your-vercel-deployment-url>/save-image` with the image file sent as multipart form-data under the key `image`.

---
[Read the full Project Writeup](./project_writeup.md)
