import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./BuyerProfile.css";

const API = "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function BuyerProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Orders");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [liked, setLiked] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAll();
    fetch(`${API}/api/notifications/unread-count`, { headers })
      .then(res => res.json())
      .then(data => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [ordersRes, likedRes, followingRes] = await Promise.all([
        fetch(`${API}/api/orders/my`, { headers }),
        fetch(`${API}/api/likes/my`, { headers }),
        fetch(`${API}/api/follows/following`, { headers }),
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const likedData = likedRes.ok ? await likedRes.json() : [];
      const followingData = followingRes.ok ? await followingRes.json() : [];

      setOrders(ordersData);
      setLiked(likedData);
      setFollowing(followingData);

      if (ordersData.length > 0) {
        setProfile(ordersData[0].buyer);
      } else {
        const user = getCurrentUser();
        setProfile({ name: user?.sub || "User", createdAt: null });
      }
    } catch (err) {
      console.error("Failed to fetch profile data", err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;

  if (loading) {
    return (
      <div className="bp-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "#aaa", fontSize: "14px" }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bp-page">

      {/* Navbar */}
      <nav className="bp-navbar">
        <button className="bp-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <span className="bp-logo" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>ArtVerse</span>
        <div className="bp-nav-right">
          <button className="bp-notif-btn" onClick={() => navigate("/notification")}>
            🔔
            {unreadCount > 0 && <span className="bp-notif-badge">{unreadCount}</span>}
          </button>
          <div className="bp-nav-avatar" onClick={() => navigate("/profile")}>
            {initials[0] || "?"}
          </div>
        </div>
      </nav>

      {/* Slide-in Menu */}
      {menuOpen && (
        <div className="bp-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="bp-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="bp-menu-header">
              <span>Menu</span>
              <button onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            {[
              { label: "🏠  Home", path: "/home" },
              { label: "🖼  Gallery", path: "/gallery" },
              { label: "🎭  Exhibition", path: "/exhibition" },
              { label: "💬  Messages", path: "/chat" },
              { label: "🔔  Notifications", path: "/notification" },
              { label: "👤  My Profile", path: "/profile" },
            ].map((item) => (
              <button key={item.path} onClick={() => { navigate(item.path); setMenuOpen(false); }} className="bp-menu-item">
                {item.label}
              </button>
            ))}
            <div className="bp-menu-logout-wrap">
              <button onClick={handleLogout} className="bp-menu-logout">🚪  Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bp-header">
        <div className="bp-profile-row">
          <div className="bp-profile-left">
            <div className="bp-avatar-wrap">
              {profile?.profilePhoto ? (
                <img src={`${API}/${profile.profilePhoto}`} alt="avatar" />
              ) : (
                <div className="bp-avatar-placeholder">{initials[0]}</div>
              )}
            </div>
            <div>
              <h1 className="bp-name">{profile?.name || "User"}</h1>
              {memberSince && <p className="bp-since">Collector Since {memberSince}</p>}
              <div className="bp-badges">
                {orders.length >= 5 && <span className="bp-badge">Top Collector</span>}
                {following.length >= 3 && <span className="bp-badge">Art Enthusiast</span>}
              </div>
            </div>
          </div>

          <div className="bp-stats">
            <div className="bp-stat">
              <span className="bp-stat-value">{orders.length}</span>
              <span className="bp-stat-label">Purchased</span>
            </div>
            <div className="bp-stat-divider" />
            <div className="bp-stat">
              <span className="bp-stat-value">{liked.length}</span>
              <span className="bp-stat-label">Saved</span>
            </div>
            <div className="bp-stat-divider" />
            <div className="bp-stat">
              <span className="bp-stat-value">{following.length}</span>
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

        {activeTab === "Orders" && (
          <div className="bp-orders-section" style={{ gridColumn: "1 / -1" }}>
            <p className="bp-orders-label">{orders.length} Order{orders.length !== 1 ? "s" : ""}</p>
            {orders.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: "14px" }}>No orders yet.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bp-order-item">
                  <div className="bp-order-thumb">
                    <img src={order.artwork.imageUrl} alt={order.artwork.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="bp-order-info">
                    <p className="bp-order-title">{order.artwork.title}</p>
                    <p className="bp-order-artist">{order.artwork.artist.name}</p>
                    <p className="bp-order-price-label">Price Paid</p>
                    <p className="bp-order-price">Rs. {Number(order.pricePaid).toLocaleString()}</p>
                  </div>
                  <div className="bp-order-right">
                    <span className={`bp-status ${order.status.toLowerCase().replace("_", "-")}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Saved Items" && (
          <div className="bp-orders-section" style={{ gridColumn: "1 / -1" }}>
            <p className="bp-orders-label">{liked.length} Saved Artwork{liked.length !== 1 ? "s" : ""}</p>
            {liked.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: "14px" }}>No saved artworks yet.</p>
            ) : (
              <div className="bp-liked-grid">
                {liked.map((artwork) => (
                  <a key={artwork.id} href={`/artwork/${artwork.id}`} className="bp-liked-card">
                    <img src={artwork.imageUrl} alt={artwork.title} className="bp-liked-img" />
                    <div className="bp-liked-info">
                      <p className="bp-liked-title">{artwork.title}</p>
                      <p className="bp-liked-artist">{artwork.artist.name}</p>
                    </div>
                    <span className="bp-saved-heart">♥</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Following" && (
          <div className="bp-orders-section" style={{ gridColumn: "1 / -1" }}>
            <p className="bp-orders-label">Following {following.length} Artist{following.length !== 1 ? "s" : ""}</p>
            {following.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: "14px" }}>Not following any artists yet.</p>
            ) : (
              following.map((artist) => (
                <div key={artist.id} className="bp-order-item">
                  <div className="bp-avatar-wrap" style={{ width: 48, height: 48, flexShrink: 0 }}>
                    {artist.profilePhoto ? (
                      <img src={`${API}/${artist.profilePhoto}`} alt={artist.name} />
                    ) : (
                      <div className="bp-avatar-placeholder" style={{ fontSize: 18 }}>
                        {artist.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="bp-order-info">
                    <p className="bp-order-title">{artist.name}</p>
                    <p className="bp-order-artist">{artist.bio || "Nepali Artist"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Bottom Nav */}
      <nav className="bp-bottom-nav">
        <button onClick={() => navigate("/home")} className="bp-bottom-btn">
          <span>🏠</span><span>Home</span>
        </button>
        <button onClick={() => navigate("/gallery")} className="bp-bottom-btn">
          <span>🖼</span><span>Gallery</span>
        </button>
        <button onClick={() => navigate("/chat")} className="bp-bottom-btn">
          <span>💬</span><span>Chat</span>
        </button>
        <button onClick={() => navigate("/notification")} className="bp-bottom-btn" style={{ position: "relative" }}>
          <span>🔔</span>
          {unreadCount > 0 && <span className="bp-bottom-dot" />}
          <span>Alerts</span>
        </button>
        <button onClick={() => navigate("/profile")} className="bp-bottom-btn active">
          <span>👤</span><span>Profile</span>
        </button>
      </nav>

    </div>
  );
}
