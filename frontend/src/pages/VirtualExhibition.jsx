import { useState } from "react";
import "./VirtualExhibition.css";

const artworks = [
  {
    id: 1,
    title: "Echoes of Silence, No. 04",
    artist: "Aarav Shrestha",
    year: "2024",
    price: "Rs. 1,24,000",
    priceNote: "Incl. framing & insurance",
    medium: "Digital Art",
    bg: "#5ecfbf",
    shape: "abstract-teal",
  },
  {
    id: 2,
    title: "Mountains of Mustang",
    artist: "Priya Maharjan",
    year: "2023",
    price: "Rs. 85,000",
    priceNote: "Incl. framing & insurance",
    medium: "Oil on Canvas",
    bg: "#c4874a",
    shape: "landscape",
  },
  {
    id: 3,
    title: "Kumari in Red",
    artist: "Bijay Tamang",
    year: "2024",
    price: "Rs. 2,10,000",
    priceNote: "Incl. framing & insurance",
    medium: "Watercolour",
    bg: "#8B3A1E",
    shape: "portrait",
  },
  {
    id: 4,
    title: "Boudhanath at Dusk",
    artist: "Sita Karki",
    year: "2023",
    price: "Rs. 1,65,000",
    priceNote: "Incl. framing & insurance",
    medium: "Acrylic",
    bg: "#2a4a7a",
    shape: "circular",
  },
];

const rooms = ["Room 1 — Identity", "Room 2 — Landscape", "Room 3 — Mythology"];

function ArtworkShape({ shape, bg }) {
  if (shape === "abstract-teal") {
    return (
      <svg viewBox="0 0 260 260" width="260" height="260" style={{ display: "block", margin: "0 auto" }}>
        <defs>
          <radialGradient id="g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7eeae0" />
            <stop offset="100%" stopColor="#1a9e90" />
          </radialGradient>
        </defs>
        <ellipse cx="130" cy="130" rx="90" ry="85" fill="url(#g1)" opacity="0.9" />
        <ellipse cx="100" cy="100" rx="50" ry="40" fill="#4fd8cc" opacity="0.7" transform="rotate(-20 100 100)" />
        <ellipse cx="160" cy="150" rx="45" ry="35" fill="#1a9e90" opacity="0.8" transform="rotate(30 160 150)" />
        <circle cx="80" cy="160" r="18" fill="#7eeae0" opacity="0.6" />
        <circle cx="190" cy="90" r="14" fill="#4fd8cc" opacity="0.6" />
        <ellipse cx="145" cy="80" rx="22" ry="14" fill="#7eeae0" opacity="0.5" transform="rotate(45 145 80)" />
        <circle cx="60" cy="120" r="10" fill="#1a9e90" opacity="0.7" />
        <circle cx="210" cy="160" r="8" fill="#4fd8cc" opacity="0.5" />
        <ellipse cx="130" cy="200" rx="30" ry="18" fill="#1a9e90" opacity="0.6" transform="rotate(-10 130 200)" />
        <circle cx="175" cy="200" r="7" fill="#7eeae0" opacity="0.5" />
        <circle cx="95" cy="75" r="6" fill="#4fd8cc" opacity="0.6" />
      </svg>
    );
  }
  if (shape === "landscape") {
    return (
      <svg viewBox="0 0 260 180" width="260" height="180" style={{ display: "block", margin: "0 auto" }}>
        <rect width="260" height="180" fill="#c4874a" rx="4" />
        <rect x="0" y="100" width="260" height="80" fill="#8B3A1E" opacity="0.8" />
        <polygon points="20,100 70,40 120,100" fill="#2A1A0E" opacity="0.7" />
        <polygon points="80,100 140,30 200,100" fill="#2A1A0E" opacity="0.8" />
        <polygon points="160,100 210,55 260,100" fill="#2A1A0E" opacity="0.6" />
        <circle cx="200" cy="30" r="20" fill="#F5EDD6" opacity="0.9" />
      </svg>
    );
  }
  if (shape === "portrait") {
    return (
      <svg viewBox="0 0 180 260" width="180" height="260" style={{ display: "block", margin: "0 auto" }}>
        <rect width="180" height="260" fill="#8B3A1E" rx="4" />
        <ellipse cx="90" cy="90" rx="45" ry="55" fill="#F5EDD6" opacity="0.9" />
        <ellipse cx="90" cy="95" rx="30" ry="35" fill="#C4874A" opacity="0.6" />
        <rect x="30" y="160" width="120" height="100" fill="#6B4A2A" opacity="0.8" rx="4" />
        <rect x="50" y="155" width="80" height="15" fill="#D4C090" opacity="0.9" rx="2" />
      </svg>
    );
  }
  if (shape === "circular") {
    return (
      <svg viewBox="0 0 260 260" width="260" height="260" style={{ display: "block", margin: "0 auto" }}>
        <circle cx="130" cy="130" r="110" fill="#1a2a4a" />
        <circle cx="130" cy="130" r="80" fill="none" stroke="#c4874a" strokeWidth="3" opacity="0.8" />
        <circle cx="130" cy="130" r="55" fill="none" stroke="#D4C090" strokeWidth="2" opacity="0.6" />
        <circle cx="130" cy="130" r="35" fill="#c4874a" opacity="0.7" />
        <circle cx="130" cy="50" r="12" fill="#D4C090" opacity="0.9" />
        <circle cx="210" cy="130" r="12" fill="#D4C090" opacity="0.9" />
        <circle cx="130" cy="210" r="12" fill="#D4C090" opacity="0.9" />
        <circle cx="50" cy="130" r="12" fill="#D4C090" opacity="0.9" />
      </svg>
    );
  }
  return null;
}

export default function VirtualExhibition() {
  const [current, setCurrent] = useState(0);
  const [activeTab, setActiveTab] = useState("EXHIBITION");
  const [liked, setLiked] = useState(false);
  const [showRoomList, setShowRoomList] = useState(false);
  const [activeRoom, setActiveRoom] = useState(0);

  const art = artworks[current];
  const prev = () => setCurrent((c) => (c - 1 + artworks.length) % artworks.length);
  const next = () => setCurrent((c) => (c + 1) % artworks.length);

  return (
    <div className="ve-page">

      {/* Navbar */}
      <div className="ve-navbar">
        <span className="ve-logo">ArtVerse</span>

        <div className="ve-nav-tabs">
          {["EXHIBITION", "ROOM LIST", "CURATOR"].map((tab) => (
            <button
              key={tab}
              className={`ve-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "ROOM LIST") setShowRoomList(!showRoomList);
                else setShowRoomList(false);
              }}
            >
              {tab}
            </button>
          ))}
          <button className="ve-close-btn" onClick={() => window.history.back()}>✕</button>
        </div>
      </div>

      {/* Room List Dropdown */}
      {showRoomList && (
        <div className="ve-room-dropdown">
          {rooms.map((room, i) => (
            <button
              key={i}
              className={`ve-room-option ${activeRoom === i ? "active" : ""}`}
              onClick={() => { setActiveRoom(i); setShowRoomList(false); }}
            >
              {room}
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="ve-counter">
        {rooms[activeRoom]} &nbsp;·&nbsp; {current + 1} / {artworks.length}
      </div>

      {/* Gallery */}
      <div className="ve-gallery">

        <button className="ve-arrow ve-arrow-left" onClick={prev}>←</button>

        <div className="ve-artwork-wrapper">
          {/* Frame */}
          <div className="ve-frame">
            <div className="ve-frame-inner" style={{ background: art.bg }}>
              <ArtworkShape shape={art.shape} bg={art.bg} />
              <span className="ve-medium-badge">{art.medium}</span>
            </div>
          </div>

          {/* Title */}
          <div className="ve-title-block">
            <h2 className="ve-artwork-title">{art.title}</h2>
            <p className="ve-artwork-meta">{art.artist} &nbsp;·&nbsp; {art.year}</p>
          </div>

          {/* Dots */}
          <div className="ve-dots">
            {artworks.map((_, i) => (
              <button
                key={i}
                className={`ve-dot ${i === current ? "active" : ""}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        </div>

        <button className="ve-arrow ve-arrow-right" onClick={next}>→</button>

        {/* Thumbnails */}
        <div className="ve-thumbnails">
          {artworks.map((a, i) => (
            <button
              key={i}
              className={`ve-thumb ${i === current ? "active" : ""}`}
              style={{ background: a.bg }}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="ve-bottom-bar">
        <div>
          <div className="ve-available-label">Available for Acquisition</div>
          <div className="ve-price-row">
            <span className="ve-price">{art.price}</span>
            <span className="ve-price-note">{art.priceNote}</span>
          </div>
        </div>

        <div className="ve-actions">
          <button
            className={`ve-icon-btn ${liked ? "liked" : ""}`}
            onClick={() => setLiked(!liked)}
          >
            {liked ? "♥" : "♡"}
          </button>
          <button className="ve-icon-btn">↗</button>
          <button className="ve-acquire-btn">Acquire Artwork</button>
        </div>
      </div>

      <div className="ve-keyboard-hint">Use ← → to navigate</div>
    </div>
  );
}