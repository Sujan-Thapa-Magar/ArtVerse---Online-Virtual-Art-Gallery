import { useState } from "react";
import "./Notifications.css";

// --- Thumbnail SVGs ---
function Thumb({ type }) {
  if (type === "void") return (
    <svg viewBox="0 0 46 46">
      <rect width="46" height="46" fill="#3a1a1a" />
      <ellipse cx="23" cy="23" rx="14" ry="16" fill="#8B3A1E" opacity="0.8" />
      <ellipse cx="23" cy="23" rx="8" ry="10" fill="#c4874a" opacity="0.6" />
    </svg>
  );
  if (type === "fragments") return (
    <svg viewBox="0 0 46 46">
      <rect width="46" height="46" fill="#c4874a" />
      <rect x="0" y="28" width="46" height="18" fill="#8B3A1E" opacity="0.8" />
      <polygon points="10,28 23,10 36,28" fill="#2A1A0E" opacity="0.6" />
    </svg>
  );
  if (type === "julian") return (
    <svg viewBox="0 0 46 46">
      <rect width="46" height="46" fill="#2a2a2a" />
      <circle cx="23" cy="18" r="10" fill="#888" opacity="0.8" />
      <ellipse cx="23" cy="38" rx="14" ry="10" fill="#555" opacity="0.7" />
    </svg>
  );
  if (type === "salon") return (
    <svg viewBox="0 0 46 46">
      <rect width="46" height="46" fill="#1a1a3a" />
      <circle cx="23" cy="23" r="14" fill="none" stroke="#6a6aaa" strokeWidth="2" />
      <circle cx="23" cy="23" r="8" fill="#4a4a8a" opacity="0.8" />
      <circle cx="23" cy="23" r="4" fill="#8a8acf" opacity="0.9" />
    </svg>
  );
  if (type === "comment") return (
    <svg viewBox="0 0 46 46">
      <rect width="46" height="46" fill="#2a3a1a" />
      <ellipse cx="23" cy="23" rx="14" ry="12" fill="#4a6a2a" opacity="0.8" />
      <ellipse cx="23" cy="20" rx="9" ry="8" fill="#6a8a3a" opacity="0.7" />
    </svg>
  );
  return null;
}

const allNotifications = [
  {
    id: 1,
    category: "all",
    icon: "♥",
    iconBg: "#fce8e8",
    iconColor: "#e05c5c",
    text: <>Elena Rossi liked your artwork <em>"The Ethereal Void"</em></>,
    time: "3 minutes ago",
    thumb: "void",
    unread: true,
  },
  {
    id: 2,
    category: "offers",
    icon: "🏷",
    iconBg: "#fff4e8",
    iconColor: "#c4874a",
    text: <>New offer received for <em>"Fragments of Silence"</em> from The Nui Collection</>,
    time: "1 hour ago",
    thumb: "fragments",
    unread: true,
  },
  {
    id: 3,
    category: "all",
    icon: "👤",
    iconBg: "#f0f0f0",
    iconColor: "#555",
    text: <><strong>Julian Vane</strong> started following your curated collection</>,
    time: "Yesterday",
    thumb: "julian",
    unread: false,
  },
  {
    id: 4,
    category: "exhibitions",
    icon: "🖼",
    iconBg: "#eaf0ff",
    iconColor: "#5a7ae0",
    text: <>The <strong>Autumn Salon</strong> exhibition is now open for submissions</>,
    time: "3 days ago",
    thumb: "salon",
    unread: false,
  },
  {
    id: 5,
    category: "mentions",
    icon: "💬",
    iconBg: "#f0f5ea",
    iconColor: "#5a8a2a",
    text: <><strong>Marcus Thorne</strong> commented: "The use of negative space here is masterful..."</>,
    time: "4 days ago",
    thumb: "comment",
    unread: false,
  },
];

const filters = ["ALL", "OFFERS", "MENTIONS", "EXHIBITIONS"];

const navItems = [
  { icon: "🏠", label: "Home",          path: "/home",          active: false },
  { icon: "🔍", label: "Search",        path: "/gallery",       active: false },
  { icon: "🔔", label: "Notifications", path: "/notifications", active: true,  dot: true },
  { icon: "👤", label: "Profile",       path: "/profile",       active: false },
];

export default function Notifications() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [notifications, setNotifications] = useState(allNotifications);

  const filtered = activeFilter === "ALL"
    ? notifications
    : notifications.filter(n => n.category === activeFilter.toLowerCase());

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  const markOneRead = (id) =>
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );

  return (
    <div className="notif-page">

      {/* Navbar */}
      <nav className="notif-navbar">
        <span className="notif-logo">ArtVerse</span>
        <div className="notif-navbar-right">
          <button className="notif-mark-all" onClick={markAllRead}>
            Mark all read
          </button>
          <div className="notif-nav-avatar">
            S
            {unreadCount > 0 && <span className="notif-nav-badge" />}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="notif-content">

        <h1 className="notif-heading">Notifications</h1>
        <p className="notif-subheading">Your daily curation of activity</p>

        {/* Filter pills */}
        <div className="notif-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`notif-filter-btn ${activeFilter === f ? "active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="notif-list">
          {filtered.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
              No notifications in this category.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.unread ? "unread" : ""}`}
                onClick={() => markOneRead(n.id)}
              >
                <div className="notif-icon" style={{ background: n.iconBg, color: n.iconColor }}>
                  {n.icon}
                </div>
                <div className="notif-text-block">
                  <p className="notif-text">{n.text}</p>
                  <p className="notif-time">{n.time}</p>
                </div>
                <div className="notif-thumb">
                  <Thumb type={n.thumb} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load archive */}
        <div className="notif-load-more">
          <button className="notif-load-btn">Load Archive</button>
        </div>

      </div>

      {/* Bottom Nav */}
      <div className="notif-bottom-nav">
        {navItems.map((item) => (
          <a key={item.label} href={item.path} className="notif-nav-item">
            <span className="notif-nav-icon">
              {item.icon}
              {item.dot && unreadCount > 0 && <span className="notif-nav-dot" />}
            </span>
            <span className={`notif-nav-label ${item.active ? "active" : ""}`}>
              {item.label}
            </span>
          </a>
        ))}
      </div>

    </div>
  );
}