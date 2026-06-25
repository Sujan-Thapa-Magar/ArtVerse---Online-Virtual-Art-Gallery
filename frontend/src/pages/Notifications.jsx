import { useState, useEffect } from "react";
import "./Notifications.css";

const API = "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getIconForType(type) {
  switch (type) {
    case "LIKE":    return { icon: "♥", iconBg: "#fce8e8", iconColor: "#e05c5c" };
    case "COMMENT": return { icon: "💬", iconBg: "#f0f5ea", iconColor: "#5a8a2a" };
    case "FOLLOW":  return { icon: "👤", iconBg: "#f0f0f0", iconColor: "#555" };
    default:        return { icon: "🔔", iconBg: "#eee", iconColor: "#888" };
  }
}

const navItems = [
  { icon: "🏠", label: "Home",          path: "/home",          active: false },
  { icon: "🔍", label: "Search",        path: "/gallery",       active: false },
  { icon: "🔔", label: "Notifications", path: "/notifications", active: true },
  { icon: "👤", label: "Profile",       path: "/profile",       active: false },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications`, { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${API}/api/notifications/mark-read`, {
        method: "PUT",
        headers,
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  }

  const filters = ["ALL", "LIKE", "COMMENT", "FOLLOW"];

  const filtered = activeFilter === "ALL"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notif-page">

      {/* Navbar */}
      <nav className="notif-navbar">
        <span className="notif-logo">ArtVerse</span>
        <div className="notif-navbar-right">
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={markAllRead}>
              Mark all read
            </button>
          )}
          <div className="notif-nav-avatar">
            A
            {unreadCount > 0 && <span className="notif-nav-badge" />}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="notif-content">

        <h1 className="notif-heading">Notifications</h1>
        <p className="notif-subheading">Your activity updates</p>

        {/* Filter pills */}
        <div className="notif-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`notif-filter-btn ${activeFilter === f ? "active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f === "LIKE" ? "LIKES" : f === "COMMENT" ? "COMMENTS" : f === "FOLLOW" ? "FOLLOWS" : f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="notif-list">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
              No notifications yet.
            </div>
          ) : (
            filtered.map((n) => {
              const { icon, iconBg, iconColor } = getIconForType(n.type);
              return (
                <div
                  key={n.id}
                  className={`notif-item ${!n.read ? "unread" : ""}`}
                >
                  <div className="notif-icon" style={{ background: iconBg, color: iconColor }}>
                    {icon}
                  </div>
                  <div className="notif-text-block">
                    <p className="notif-text">{n.message}</p>
                    <p className="notif-time">{formatTime(n.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Bottom Nav */}
      <div className="notif-bottom-nav">
        {navItems.map((item) => (
          <a key={item.label} href={item.path} className="notif-nav-item">
            <span className="notif-nav-icon">
              {item.icon}
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className="notif-nav-dot" />
              )}
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
