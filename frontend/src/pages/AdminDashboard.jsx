import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [stats, setStats] = useState({
    totalArtworks: 0,
    totalUsers: 0,
    totalListed: 0,
  });
  const [artworks, setArtworks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      if (!token) { navigate("/login"); return; }
      try {
        const artRes = await fetch("http://localhost:8080/api/artworks", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (artRes.status === 401 || artRes.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const artData = await artRes.json();
        setArtworks(artData);

        const totalListed = artData
          .filter((a) => a.forSale && a.price)
          .reduce((sum, a) => sum + Number(a.price), 0);

        // Collect unique users from artworks
        const userMap = {};
        artData.forEach((a) => {
          if (a.artist?.id) userMap[a.artist.id] = a.artist;
        });
        const uniqueUsers = Object.values(userMap);
        setUsers(uniqueUsers);

        setStats({
          totalArtworks: artData.length,
          totalUsers: uniqueUsers.length,
          totalListed,
        });
      } catch (err) {
        console.error("Admin fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  // Bar chart data — monthly placeholder using real artwork count
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN"];
  const barData = [30, 45, 35, 60, 50, 80];
  const commData = [10, 15, 12, 20, 18, 30];
  const maxBar = Math.max(...barData);

  return (
    <div className="admin-page">

      {/* Navbar */}
      <div className="admin-navbar">
        <span className="admin-logo">Admin Panel</span>
        <div className="admin-nav-right">
          {["Dashboard", "Analytics", "System"].map((tab) => (
            <button
              key={tab}
              className={`admin-nav-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <div className="admin-avatar">A</div>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">

        {/* Alert Banner */}
        <div className="admin-alert">
          <span className="admin-alert-dot" />
          <span className="admin-alert-text">
            {loading ? "Loading platform data…" : `${artworks.length} artworks on platform · ${users.length} registered artists`}
          </span>
          <button className="admin-alert-btn" onClick={() => navigate("/gallery")}>
            VIEW ALL
          </button>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <p className="admin-stat-label">TOTAL LISTED VALUE</p>
            <p className="admin-stat-value">
              {loading ? "—" : `NPR ${stats.totalListed.toLocaleString()}`}
            </p>
            <p className="admin-stat-sub" style={{ color: "#27ae60" }}>All artworks combined</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">TOTAL ARTWORKS</p>
            <p className="admin-stat-value">{loading ? "—" : stats.totalArtworks}</p>
            <p className="admin-stat-sub">On platform</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">REGISTERED ARTISTS</p>
            <p className="admin-stat-value">{loading ? "—" : stats.totalUsers}</p>
            <p className="admin-stat-sub">Active accounts</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-label">FOR SALE</p>
            <p className="admin-stat-value">
              {loading ? "—" : artworks.filter((a) => a.forSale).length}
            </p>
            <p className="admin-stat-sub">Listed artworks</p>
          </div>
        </div>

        {/* Two column section */}
        <div className="admin-two-col">

          {/* Flagged / Recent Artworks */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Recent Artworks</h2>
              <button className="admin-panel-link" onClick={() => navigate("/gallery")}>
                VIEW ALL
              </button>
            </div>

            {loading ? (
              <p className="admin-empty">Loading…</p>
            ) : artworks.length === 0 ? (
              <p className="admin-empty">No artworks yet.</p>
            ) : (
              artworks.slice(0, 4).map((art) => (
                <div
                  key={art.id}
                  className="admin-artwork-row"
                  onClick={() => navigate(`/artwork/${art.id}`)}
                >
                  <div className="admin-artwork-thumb">
                    {getImageUrl(art.imageUrl) ? (
                      <img src={getImageUrl(art.imageUrl)} alt={art.title} />
                    ) : (
                      <div className="admin-artwork-thumb-placeholder" />
                    )}
                  </div>
                  <div className="admin-artwork-info">
                    {art.category && (
                      <span className="admin-artwork-tag">{art.category.toUpperCase()}</span>
                    )}
                    <p className="admin-artwork-title">{art.title}</p>
                    <p className="admin-artwork-meta">
                      By {art.artist?.name || art.artist?.email || "Unknown"} · {formatTime(art.createdAt)}
                    </p>
                  </div>
                  <div className="admin-artwork-actions">
                    <button className="admin-btn-approve" onClick={(e) => { e.stopPropagation(); navigate(`/artwork/${art.id}`); }}>
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Users */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Recent Artists</h2>
            </div>

            {loading ? (
              <p className="admin-empty">Loading…</p>
            ) : users.length === 0 ? (
              <p className="admin-empty">No artists yet.</p>
            ) : (
              users.slice(0, 5).map((user) => (
                <div key={user.id} className="admin-user-row">
                  <div className="admin-user-avatar">
                    {(user.name || user.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="admin-user-info">
                    <p className="admin-user-name">{user.name || user.email}</p>
                    <p className="admin-user-meta">{user.email}</p>
                  </div>
                  <span className="admin-user-badge">ARTIST</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Growth Chart */}
        <div className="admin-chart-section">
          <div className="admin-chart-header">
            <div>
              <h2 className="admin-panel-title">Platform Growth</h2>
              <p className="admin-chart-sub">Artwork uploads over the current period.</p>
            </div>
            <div className="admin-chart-legend">
              <span className="admin-legend-dot" style={{ background: "#2A1A0E" }} />
              <span>UPLOADS</span>
              <span className="admin-legend-dot" style={{ background: "#8B3A1E" }} />
              <span>SALES</span>
            </div>
          </div>

          <div className="admin-chart">
            {months.map((month, i) => (
              <div key={month} className="admin-bar-group">
                <div className="admin-bars">
                  <div
                    className="admin-bar admin-bar--dark"
                    style={{ height: `${(barData[i] / maxBar) * 100}%` }}
                  />
                  <div
                    className="admin-bar admin-bar--red"
                    style={{ height: `${(commData[i] / maxBar) * 100}%` }}
                  />
                </div>
                <span className="admin-bar-label">{month}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Nav */}
      <div className="admin-bottom-nav">
        {[
          { icon: "⌂", label: "Home", path: "/home" },
          { icon: "🔍", label: "Search", path: "/gallery" },
          { icon: "🔔", label: "Notifications", path: "/notifications" },
          { icon: "👤", label: "Profile", path: "/profile" },
        ].map((item) => (
          <button key={item.label} className="admin-nav-btn" onClick={() => navigate(item.path)}>
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}