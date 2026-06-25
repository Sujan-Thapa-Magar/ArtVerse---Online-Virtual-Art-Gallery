import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtistDashboard.css";

const navItems = [
  { icon: "🏠", label: "Home",    path: "/home" },
  { icon: "🖼",  label: "Gallery", path: "/gallery" },
  { icon: "➕", label: "Upload",  path: "/upload" },
  { icon: "📊", label: "Studio",  path: "/dashboard", active: true },
  { icon: "👤", label: "Profile", path: "/profile" },
];

function ArtShape({ imageUrl, title }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl.startsWith("http") ? imageUrl : `http://localhost:8080${imageUrl}`}
        alt={title}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => { e.target.style.display = "none"; }}
      />
    );
  }
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <rect width="200" height="200" fill="#e8e0d5" />
      <ellipse cx="100" cy="100" rx="60" ry="55" fill="none" stroke="#c4874a" strokeWidth="6" opacity="0.4" />
      <ellipse cx="100" cy="100" rx="35" ry="32" fill="none" stroke="#8B3A1E" strokeWidth="4" opacity="0.3" transform="rotate(45 100 100)" />
    </svg>
  );
}

export default function ArtistDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [userName, setUserName] = useState("Artist");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) { navigate("/login"); return; }

      try {
        // 1. Get all artworks — filter by current user on frontend
        const artRes = await fetch("http://localhost:8080/api/artworks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (artRes.status === 401 || artRes.status === 403) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const allArtworks = await artRes.json();

        // 2. Decode JWT to get current user email
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email = payload.sub;

        // 3. Filter artworks belonging to this artist
        const myArtworks = allArtworks.filter(
          (a) => a.artist?.email === email
        );
        setArtworks(myArtworks);

        // Set user name from first artwork's artist
        if (myArtworks.length > 0) {
          setUserName(myArtworks[0].artist?.name || email);
        }

        // 4. Get like counts for each artwork
        let likes = 0;
        for (const art of myArtworks) {
          const likeRes = await fetch(`http://localhost:8080/api/likes/${art.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (likeRes.ok) {
            const likeData = await likeRes.json();
            likes += likeData.likeCount || 0;
          }
        }
        setTotalLikes(likes);

        // 5. Get follower count — need artist's user ID
        if (myArtworks.length > 0 && myArtworks[0].artist?.id) {
          const followRes = await fetch(
            `http://localhost:8080/api/follows/${myArtworks[0].artist.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (followRes.ok) {
            const followData = await followRes.json();
            setFollowerCount(followData.followerCount || 0);
          }
        }

      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalSales = artworks
    .filter((a) => a.forSale && a.price)
    .reduce((sum, a) => sum + Number(a.price), 0);

  const stats = [
    { icon: "❤️", label: "TOTAL LIKES", value: totalLikes.toLocaleString() },
    { icon: "💰", label: "LISTED VALUE", value: totalSales > 0 ? `NPR ${totalSales.toLocaleString()}` : "—" },
    { icon: "👥", label: "FOLLOWERS", value: followerCount.toLocaleString() },
    { icon: "🎨", label: "ARTWORKS", value: artworks.length.toString() },
  ];

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

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
          <div className="ad-avatar">{userName[0].toUpperCase()}</div>
        </div>
      </div>

      {/* Content */}
      <div className="ad-content">

        {/* Curation Status */}
        <p className="ad-curation-label">Curation Status</p>
        <h1 className="ad-curation-title">
          {loading
            ? "Loading your studio…"
            : artworks.length === 0
            ? "Welcome! Upload your first artwork to get started."
            : `You have ${artworks.length} artwork${artworks.length > 1 ? "s" : ""} in your gallery${followerCount > 0 ? ` and ${followerCount} follower${followerCount > 1 ? "s" : ""}` : ""}.`}
        </h1>

        {/* Stats */}
        <div className="ad-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="ad-stat-card">
              <div className="ad-stat-icon">{s.icon}</div>
              <div className="ad-stat-label">{s.label}</div>
              <div className="ad-stat-value">{loading ? "—" : s.value}</div>
            </div>
          ))}
        </div>

        {/* Recent Collections */}
        <div className="ad-section-header">
          <div>
            <h2 className="ad-section-title">My Artworks</h2>
            <p className="ad-section-sub">Your uploaded artworks — click to view details.</p>
          </div>
          <button className="ad-view-archive-btn" onClick={() => navigate("/gallery")}>
            View Gallery
          </button>
        </div>

        <div className="ad-collections-wrapper">
          {loading ? (
            <p style={{ color: "#aaa", fontSize: "13px" }}>Loading artworks…</p>
          ) : artworks.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: "13px" }}>No artworks yet.</p>
          ) : (
            <div className="ad-collections-grid">
              {artworks.slice(0, 6).map((art) => (
                <div
                  key={art.id}
                  className="ad-collection-item"
                  onClick={() => navigate(`/artwork/${art.id}`)}
                >
                  <div className="ad-collection-thumb" style={{ background: "#f0ece4" }}>
                    <ArtShape imageUrl={art.imageUrl} title={art.title} />
                  </div>
                  <div className="ad-collection-info">
                    <div>
                      <p className="ad-collection-title">{art.title}</p>
                      <p className="ad-collection-type">
                        {art.medium ? art.medium.toUpperCase() : art.category?.toUpperCase() || "ARTWORK"}
                      </p>
                    </div>
                    {art.forSale && art.price && (
                      <span className="ad-collection-price">
                        NPR {Number(art.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button className="ad-add-btn" onClick={() => navigate("/upload")}>+</button>
        </div>

        {/* Recent Artworks as Activity */}
        <h2 className="ad-section-title" style={{ marginBottom: "20px" }}>Recent Uploads</h2>
        <div className="ad-activity-list">
          {loading ? (
            <p style={{ color: "#aaa", fontSize: "13px" }}>Loading…</p>
          ) : artworks.length === 0 ? (
            <p style={{ color: "#aaa", fontSize: "13px" }}>No uploads yet.</p>
          ) : (
            artworks.slice(0, 5).map((art) => (
              <div
                key={art.id}
                className="ad-activity-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/artwork/${art.id}`)}
              >
                <div className="ad-activity-icon" style={{ background: "#f5edd6", color: "#8B3A1E" }}>
                  🎨
                </div>
                <div>
                  <p className="ad-activity-text">
                    You uploaded <strong>{art.title}</strong>
                    {art.forSale && art.price ? ` — listed for NPR ${Number(art.price).toLocaleString()}` : " — not for sale"}
                  </p>
                  <p className="ad-activity-time">{formatTime(art.createdAt)}</p>
                </div>
              </div>
            ))
          )}
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