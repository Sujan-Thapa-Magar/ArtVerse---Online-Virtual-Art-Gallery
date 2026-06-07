import { useState } from "react";
import "./BuyerProfile.css";

// --- Data ---
const orders = [
  {
    id: 1,
    title: "Ephemeral Horizon No. 4",
    artist: "Elena Rosa — Mixed Media on Canvas",
    price: "Rs. 42,000",
    status: "delivered",
    statusLabel: "DELIVERED",
    btnLabel: "DETAILS",
    thumbShape: "horizon",
    thumbBg: "#3a6a8a",
  },
  {
    id: 2,
    title: "Geometry of Silence",
    artist: "Marcus Thordin — Limited Edition Print",
    price: "Rs. 18,500",
    status: "delivered",
    statusLabel: "DELIVERED",
    btnLabel: "DETAILS",
    thumbShape: "geometry",
    thumbBg: "#d0d0d0",
  },
  {
    id: 3,
    title: "Molten Core Study",
    artist: "Sarah Jenkins — Digital Sculpture",
    price: "Rs. 31,000",
    status: "in-transit",
    statusLabel: "IN TRANSIT",
    btnLabel: "TRACKING",
    thumbShape: "molten",
    thumbBg: "#555",
  },
];

const savedItems = [
  { id: 1, shape: "splash",   bg: "#1a1a2e", large: true },
  { id: 2, shape: "tree",     bg: "#e0ddd5", large: false },
  { id: 3, shape: "origami",  bg: "#111",    large: false },
  { id: 4, shape: "sand",     bg: "#c8b89a", large: false },
];

// --- Thumbnail SVGs ---
function ThumbSVG({ shape, bg }) {
  if (shape === "horizon") return (
    <svg viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" fill="#3a6a8a" />
      <rect x="0" y="36" width="64" height="28" fill="#1a3a5a" opacity="0.9" />
      <rect x="0" y="28" width="64" height="12" fill="#c4874a" opacity="0.6" />
      <circle cx="48" cy="18" r="10" fill="#F5EDD6" opacity="0.8" />
    </svg>
  );
  if (shape === "geometry") return (
    <svg viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" fill="#e8e8e8" />
      <polygon points="32,8 56,52 8,52" fill="none" stroke="#888" strokeWidth="2" />
      <polygon points="32,18 50,48 14,48" fill="#ccc" opacity="0.7" />
      <circle cx="32" cy="32" r="8" fill="#bbb" opacity="0.6" />
    </svg>
  );
  if (shape === "molten") return (
    <svg viewBox="0 0 64 64" width="64" height="64">
      <rect width="64" height="64" fill="#444" />
      <ellipse cx="32" cy="40" rx="18" ry="22" fill="#666" opacity="0.8" />
      <ellipse cx="32" cy="30" rx="12" ry="16" fill="#888" opacity="0.7" />
      <circle cx="32" cy="22" r="8" fill="#aaa" opacity="0.6" />
    </svg>
  );
  return null;
}

function SavedSVG({ shape, bg }) {
  if (shape === "splash") return (
    <svg viewBox="0 0 100 200" width="100%" height="100%" style={{ display: "block" }}>
      <rect width="100" height="200" fill="#1a1a2e" />
      <ellipse cx="50" cy="130" rx="20" ry="8" fill="#4a7a9b" opacity="0.6" />
      <ellipse cx="50" cy="110" rx="12" ry="30" fill="#6aabcb" opacity="0.7" />
      <ellipse cx="30" cy="90" rx="6" ry="18" fill="#4a9ab5" opacity="0.5" transform="rotate(-20 30 90)" />
      <ellipse cx="70" cy="85" rx="5" ry="15" fill="#4a9ab5" opacity="0.5" transform="rotate(15 70 85)" />
      <circle cx="22" cy="75" r="4" fill="#6aabcb" opacity="0.6" />
      <circle cx="78" cy="70" r="3" fill="#6aabcb" opacity="0.5" />
      <circle cx="45" cy="60" r="3" fill="#8acbdb" opacity="0.6" />
      <circle cx="58" cy="55" r="2" fill="#8acbdb" opacity="0.5" />
    </svg>
  );
  if (shape === "tree") return (
    <svg viewBox="0 0 90 90" width="100%" height="100%" style={{ display: "block" }}>
      <rect width="90" height="90" fill="#e8e5de" />
      <rect x="42" y="55" width="6" height="25" fill="#888" />
      <ellipse cx="45" cy="40" rx="22" ry="28" fill="#555" opacity="0.7" />
      <ellipse cx="30" cy="48" rx="14" ry="18" fill="#666" opacity="0.5" />
      <ellipse cx="60" cy="46" rx="12" ry="16" fill="#666" opacity="0.5" />
    </svg>
  );
  if (shape === "origami") return (
    <svg viewBox="0 0 90 90" width="100%" height="100%" style={{ display: "block" }}>
      <rect width="90" height="90" fill="#111" />
      <polygon points="45,15 75,65 45,55" fill="#555" opacity="0.9" />
      <polygon points="45,15 15,65 45,55" fill="#333" opacity="0.9" />
      <polygon points="15,65 75,65 45,55" fill="#444" opacity="0.8" />
      <polygon points="45,15 60,40 45,55 30,40" fill="#666" opacity="0.6" />
    </svg>
  );
  if (shape === "sand") return (
    <svg viewBox="0 0 90 90" width="100%" height="100%" style={{ display: "block" }}>
      <rect width="90" height="90" fill="#c8b89a" />
      <path d="M0 30 Q22 20 45 30 Q68 40 90 30" stroke="#b0a080" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M0 45 Q22 35 45 45 Q68 55 90 45" stroke="#b0a080" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M0 60 Q22 50 45 60 Q68 70 90 60" stroke="#b0a080" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M0 75 Q22 65 45 75 Q68 85 90 75" stroke="#b0a080" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
  return null;
}

export default function BuyerProfile() {
  const [activeTab, setActiveTab] = useState("Orders");

  return (
    <div className="bp-page">

      {/* Navbar */}
      <nav className="bp-navbar">
        <span className="bp-logo">ArtVerse</span>
        <div className="bp-nav-links">
          {["Home", "Search", "Notifications", "Profile"].map((link) => (
            <a key={link} href={`/${link.toLowerCase()}`}
              className={`bp-nav-link ${link === "Profile" ? "active" : ""}`}>
              {link}
            </a>
          ))}
          <div className="bp-nav-avatar">J</div>
        </div>
      </nav>

      {/* Profile Header */}
      <div className="bp-header">
        <div className="bp-profile-row">

          {/* Left — Avatar + Name */}
          <div className="bp-profile-left">
            <div className="bp-avatar-wrap">
              <div className="bp-avatar-placeholder">J</div>
            </div>
            <div>
              <h1 className="bp-name">Julian Vane</h1>
              <p className="bp-since">Collector Since 2024</p>
              <div className="bp-badges">
                <span className="bp-badge">Top Collector</span>
                <span className="bp-badge">Museum Patron</span>
              </div>
            </div>
          </div>

          {/* Right — Stats */}
          <div className="bp-stats">
            <div className="bp-stat">
              <span className="bp-stat-value">12</span>
              <span className="bp-stat-label">Purchased</span>
            </div>
            <div className="bp-stat-divider" />
            <div className="bp-stat">
              <span className="bp-stat-value">34</span>
              <span className="bp-stat-label">Saved</span>
            </div>
            <div className="bp-stat-divider" />
            <div className="bp-stat">
              <span className="bp-stat-value">8</span>
              <span className="bp-stat-label">Following</span>
            </div>
          </div>

        </div>
      </div>

      {/* Tabs */}
      <div className="bp-tabs">
        {["Orders", "Saved Items", "Following"].map((tab) => (
          <button
            key={tab}
            className={`bp-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="bp-body">

        {/* Left — Orders */}
        <div className="bp-orders-section">
          <p className="bp-orders-label">Recent — 3 of 12</p>

          {orders.map((order) => (
            <div key={order.id} className="bp-order-item">

              {/* Thumbnail */}
              <div className="bp-order-thumb">
                <ThumbSVG shape={order.thumbShape} bg={order.thumbBg} />
              </div>

              {/* Info */}
              <div className="bp-order-info">
                <p className="bp-order-title">{order.title}</p>
                <p className="bp-order-artist">{order.artist}</p>
                <p className="bp-order-price-label">Price Paid</p>
                <p className="bp-order-price">{order.price}</p>
              </div>

              {/* Status + Button */}
              <div className="bp-order-right">
                <span className={`bp-status ${order.status}`}>{order.statusLabel}</span>
                <button className="bp-order-btn">{order.btnLabel}</button>
              </div>

            </div>
          ))}
        </div>

        {/* Right — Saved for Later */}
        <div className="bp-saved-section">
          <div className="bp-saved-header">
            <span className="bp-saved-label">Saved for Later</span>
            <button className="bp-view-all">View All</button>
          </div>

          <div className="bp-saved-grid">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="bp-saved-item"
                style={item.large ? { gridRow: "span 2" } : {}}
              >
                <div className="bp-saved-img">
                  <SavedSVG shape={item.shape} bg={item.bg} />
                </div>
                <span className="bp-saved-heart">♥</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}