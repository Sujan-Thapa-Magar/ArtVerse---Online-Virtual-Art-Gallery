import { useState } from "react";
import "./ArtistDashboard.css";

const stats = [
  { icon: "👁", label: "TOTAL VIEWS", value: "12.4k" },
  { icon: "💰", label: "SALES", value: "Rs. 4,28,000" },
  { icon: "👥", label: "FOLLOWERS", value: "2,841" },
  { icon: "🎨", label: "ARTWORKS", value: "58" },
];

const collections = [
  {
    id: 1,
    title: "The Void Series #12",
    type: "PHYSICAL / OIL ON CANVAS",
    price: "Rs. 4,500",
    bg: "#b0b0b0",
    shape: "swirl",
  },
  {
    id: 2,
    title: "Ether Dreams",
    type: "DIGITAL / NFT EDITION",
    price: "Rs. 24,000",
    bg: "#1a1a1a",
    shape: "dark-abstract",
  },
  {
    id: 3,
    title: "Silent Geometry",
    type: "PHYSICAL / MARBLE",
    price: "",
    bg: "#888",
    shape: "marble",
  },
];

const activities = [
  {
    iconEmoji: "♡",
    iconBg: "#fce8e8",
    iconColor: "#e05c5c",
    text: <>Elena Rodriguez and 12 others liked <strong>Lumina Flux</strong>.</>,
    time: "2 HOURS AGO",
  },
  {
    iconEmoji: "🛒",
    iconBg: "#e8f0fe",
    iconColor: "#3b7ae0",
    text: <>Artwork <strong>Shattered Echoes</strong> was sold to a private collector in London.</>,
    time: "5 HOURS AGO",
  },
  {
    iconEmoji: "💬",
    iconBg: "#f0f0f0",
    iconColor: "#555",
    text: <>Art curator <strong>Julian Vane</strong> left a comment on your profile.</>,
    time: "YESTERDAY",
  },
];

const navItems = [
  { icon: "🏠", label: "Home",    path: "/home" },
  { icon: "🖼",  label: "Gallery", path: "/gallery" },
  { icon: "➕", label: "Upload",  path: "/upload" },
  { icon: "📊", label: "Studio",  path: "/dashboard", active: true },
  { icon: "👤", label: "Profile", path: "/profile" },
];

function ArtShape({ shape, bg }) {
  if (shape === "swirl") {
    return (
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <rect width="200" height="200" fill="#c0c0c0" />
        <ellipse cx="100" cy="100" rx="70" ry="65" fill="none" stroke="#888" strokeWidth="8" opacity="0.7" />
        <ellipse cx="100" cy="100" rx="50" ry="45" fill="none" stroke="#666" strokeWidth="6" opacity="0.6" transform="rotate(30 100 100)" />
        <ellipse cx="100" cy="100" rx="30" ry="28" fill="none" stroke="#444" strokeWidth="5" opacity="0.5" transform="rotate(60 100 100)" />
        <circle cx="100" cy="35" r="6" fill="#555" opacity="0.7" />
        <circle cx="165" cy="100" r="5" fill="#555" opacity="0.6" />
        <circle cx="100" cy="165" r="7" fill="#444" opacity="0.7" />
        <circle cx="35" cy="100" r="5" fill="#555" opacity="0.6" />
        <ellipse cx="70" cy="70" rx="15" ry="10" fill="#999" opacity="0.5" transform="rotate(45 70 70)" />
        <ellipse cx="130" cy="130" rx="12" ry="8" fill="#777" opacity="0.5" transform="rotate(-30 130 130)" />
      </svg>
    );
  }
  if (shape === "dark-abstract") {
    return (
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <rect width="200" height="200" fill="#111" />
        <polygon points="0,200 80,60 160,200" fill="#222" opacity="0.9" />
        <polygon points="60,200 140,40 220,200" fill="#1a1a1a" opacity="0.8" />
        <polygon points="100,200 160,80 200,200" fill="#2a2a2a" opacity="0.7" />
        <ellipse cx="100" cy="90" rx="40" ry="50" fill="#333" opacity="0.5" transform="rotate(15 100 90)" />
        <ellipse cx="60" cy="120" rx="25" ry="35" fill="#222" opacity="0.6" transform="rotate(-10 60 120)" />
      </svg>
    );
  }
  if (shape === "marble") {
    return (
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <rect width="200" height="200" fill="#999" />
        <ellipse cx="120" cy="80" rx="35" ry="70" fill="#bbb" opacity="0.8" transform="rotate(20 120 80)" />
        <ellipse cx="80" cy="130" rx="28" ry="55" fill="#aaa" opacity="0.7" transform="rotate(-15 80 130)" />
        <ellipse cx="150" cy="150" rx="22" ry="45" fill="#ccc" opacity="0.6" transform="rotate(10 150 150)" />
        <ellipse cx="50" cy="60" rx="18" ry="40" fill="#bbb" opacity="0.5" transform="rotate(30 50 60)" />
        <ellipse cx="100" cy="100" rx="15" ry="35" fill="#ddd" opacity="0.4" transform="rotate(-5 100 100)" />
      </svg>
    );
  }
  return null;
}

export default function ArtistDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="ad-page">

      {/* Navbar */}
      <div className="ad-navbar">
        <span className="ad-logo">My Studio</span>
        <div className="ad-nav-right">
          {["Dashboard", "Analytics", "Inventory"].map((tab) => (
            <button
              key={tab}
              className={`ad-nav-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <div className="ad-avatar">S</div>
        </div>
      </div>

      {/* Content */}
      <div className="ad-content">

        {/* Curation Status */}
        <p className="ad-curation-label">Curation Status</p>
        <h1 className="ad-curation-title">
          Your gallery is gaining momentum. Three new pieces are trending in the Paris circuit.
        </h1>

        {/* Stats */}
        <div className="ad-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="ad-stat-card">
              <div className="ad-stat-icon">{s.icon}</div>
              <div className="ad-stat-label">{s.label}</div>
              <div className="ad-stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Collections */}
        <div className="ad-section-header">
          <div>
            <h2 className="ad-section-title">Recent Collections</h2>
            <p className="ad-section-sub">Manage your latest digital and physical exhibitions.</p>
          </div>
          <button className="ad-view-archive-btn">View Archive</button>
        </div>

        <div className="ad-collections-wrapper">
          <div className="ad-collections-grid">
            {collections.map((c) => (
              <div key={c.id} className="ad-collection-item">
                <div className="ad-collection-thumb" style={{ background: c.bg }}>
                  <ArtShape shape={c.shape} bg={c.bg} />
                </div>
                <div className="ad-collection-info">
                  <div>
                    <p className="ad-collection-title">{c.title}</p>
                    <p className="ad-collection-type">{c.type}</p>
                  </div>
                  {c.price && <span className="ad-collection-price">{c.price}</span>}
                </div>
              </div>
            ))}
          </div>
          <button className="ad-add-btn">+</button>
        </div>

        {/* Recent Activity */}
        <h2 className="ad-section-title" style={{ marginBottom: "20px" }}>Recent Activity</h2>
        <div className="ad-activity-list">
          {activities.map((a, i) => (
            <div key={i} className="ad-activity-item">
              <div
                className="ad-activity-icon"
                style={{ background: a.iconBg, color: a.iconColor }}
              >
                {a.iconEmoji}
              </div>
              <div>
                <p className="ad-activity-text">{a.text}</p>
                <p className="ad-activity-time">{a.time}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Nav */}
      <div className="ad-bottom-nav">
        {navItems.map((item) => (
          <a key={item.label} href={item.path} className="ad-nav-item">
            <span className="ad-nav-item-icon">{item.icon}</span>
            <span className={`ad-nav-item-label ${item.active ? "active" : ""}`}>
              {item.label}
            </span>
          </a>
        ))}
      </div>

    </div>
  );
}