import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCamera, FaVideo, FaImages } from "react-icons/fa";
import { auth, signOut } from "../../firebase.js";
import "./Dashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [warningMessage, setWarningMessage] = useState("");

  const navigate = useNavigate();
  const displayName = localStorage.getItem("username") || localStorage.getItem("userEmail") || "Pilot";

  // Auto-clear warning
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest(".menu-icon") && !e.target.closest(".dropdown-menu")) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Disabled features (ESP32 not connected)
  const openLiveStream = () => {
    setWarningMessage("⚠️ ESP32 CAM is not connected. Live Stream is unavailable.");
  };

  const capturePhoto = () => {
    setWarningMessage("⚠️ ESP32 CAM is not connected. Cannot capture images.");
  };

  // Fetch images from Firebase Firestore directly
  const fetchImages = async () => {
    try {
      // Import necessary firestore functions dynamically or ensure they are imported at the top
      const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const { db } = await import("../../firebase.js");

      const q = query(collection(db, "images"), orderBy("modified_time", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedImages = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          image_path: data.image_path,
          // Firestore Timestamp objects have a .toDate() method
          modified_time: data.modified_time ? data.modified_time.toDate() : new Date()
        };
      });
      setImages(fetchedImages);
    } catch (error) {
      setWarningMessage("⚠️ Failed to load images from Firebase.");
      console.error(error);
    }
  };

  // Toggle gallery
  const toggleGallery = () => {
    setGalleryOpen(!galleryOpen);
    if (!galleryOpen) {
      fetchImages();
    }
  };

  // Proper logout — sign out of Firebase + clear localStorage
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-greeting">
          Welcome, <strong>{displayName}</strong>
        </div>
        <div className="menu-icon" onClick={toggleMenu}>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="dropdown-menu">
          <ul>
            <li onClick={handleLogout}>Log Out</li>
          </ul>
        </div>
      )}

      {/* Title */}
      <h1 className="dashboard-title">Mission Control</h1>
      <p className="dashboard-subtitle">Manage your ESP32 CAM drone</p>

      {/* Warning */}
      {warningMessage && (
        <div className="warning-message">{warningMessage}</div>
      )}

      {/* Action Cards */}
      <div className="buttons-grid">
        <button className="dashboard-button" onClick={capturePhoto}>
          <FaCamera className="btn-icon" />
          <span className="btn-label">Capture</span>
        </button>

        <button className="dashboard-button" onClick={openLiveStream}>
          <FaVideo className="btn-icon" />
          <span className="btn-label">Live Stream</span>
        </button>

        <button className="dashboard-button" onClick={toggleGallery}>
          <FaImages className="btn-icon" />
          <span className="btn-label">Gallery</span>
        </button>
      </div>

      {/* Gallery Overlay */}
      {galleryOpen && (
        <div className="gallery">
          <h2>Gallery</h2>
          <p className="gallery-count">
            {images.length} {images.length === 1 ? "image" : "images"} captured
          </p>

          <div className="gallery-images">
            {images.length === 0 ? (
              <p className="gallery-empty">No images found</p>
            ) : (
              images.map((image, index) => (
                <div key={index} className="gallery-item">
                  <img
                    src={image.image_path}
                    alt={`Drone capture ${index + 1}`}
                    loading="lazy"
                  />
                  <p>
                    {image.modified_time
                      ? new Date(image.modified_time).toLocaleString()
                      : "Unknown time"}
                  </p>
                </div>
              ))
            )}
          </div>

          <button className="close-gallery-button" onClick={toggleGallery}>
            Close Gallery
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;