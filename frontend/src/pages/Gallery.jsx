import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const categories = [
  "ALL COLLECTIONS",
  "RENAISSANCE",
  "IMPRESSIONISM",
  "MINIMALIST",
  "CONTEMPORARY",
  "SURREALISM",
];

export default function Gallery() {
  const navigate = useNavigate();
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL COLLECTIONS");
  const [searchQuery, setSearchQuery] = useState("");
  const [liked, setLiked] = useState({});

  useEffect(() => {
    const fetchArtworks = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/api/artworks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          // Token expired or invalid — go back to login
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load artworks.");
        }

        const data = await response.json();
        setArtworks(data);
      } catch (err) {
        setError("Could not connect to server. Make sure the backend is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  const toggleLike = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getArtistName = (artist) => {
    if (!artist) return "Unknown Artist";
    if (typeof artist === "string") return artist;
    return artist.name || artist.email || "Unknown Artist";
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  const filtered = artworks.filter((art) => {
    const matchesCategory =
      activeCategory === "ALL COLLECTIONS" ||
      (art.category || "").toUpperCase() === activeCategory;
    const matchesSearch =
      (art.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      getArtistName(art.artist).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8", fontFamily: "Inter, sans-serif", paddingBottom: "80px" }}>

      {/* Top Navigation */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderBottom: "1px solid #eee",
        position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 50
      }}>
        <span
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: "700", cursor: "pointer", letterSpacing: "2px" }}
          onClick={() => navigate("/home")}
        >
          ArtVerse
        </span>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", fontSize: "11px", letterSpacing: "2px", color: "#aaa", cursor: "pointer", fontWeight: "600" }}>HOME</button>
          <button style={{ background: "none", border: "none", fontSize: "11px", letterSpacing: "2px", color: "#111", cursor: "pointer", fontWeight: "700", borderBottom: "2px solid #111", paddingBottom: "2px" }}>SEARCH</button>
          <button onClick={() => navigate("/notification")} style={{ background: "none", border: "none", fontSize: "11px", letterSpacing: "2px", color: "#aaa", cursor: "pointer", fontWeight: "600" }}>NOTIFICATIONS</button>
          <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", fontSize: "11px", letterSpacing: "2px", color: "#aaa", cursor: "pointer", fontWeight: "600" }}>PROFILE</button>
        </div>
        <div
          style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#444", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
          onClick={() => navigate("/profile")}
        >
          A
        </div>
      </nav>

      {/* Search Bar */}
      <div style={{ backgroundColor: "#fff", padding: "16px 20px 12px" }}>
        <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px" }}>🔍</span>
          <input
            type="text"
            placeholder="Search movements, artists, or mediums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px 12px 42px",
              backgroundColor: "#f5f5f5", border: "1px solid #e8e8e8",
              borderRadius: "50px", fontSize: "13px", color: "#333",
              outline: "none", boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ backgroundColor: "#fff", padding: "8px 20px 12px", borderBottom: "1px solid #eee", display: "flex", gap: "8px", overflowX: "auto" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0, padding: "6px 14px",
              borderRadius: "50px", fontSize: "10px", fontWeight: "700",
              letterSpacing: "1.5px", border: "1px solid",
              cursor: "pointer", transition: "all 0.2s",
              backgroundColor: activeCategory === cat ? "#111" : "#fff",
              color: activeCategory === cat ? "#fff" : "#888",
              borderColor: activeCategory === cat ? "#111" : "#ddd",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px", color: "#aaa", fontSize: "13px" }}>
          Loading artworks...
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#e05a5a", fontSize: "14px" }}>
          <p style={{ margin: "0 0 16px" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", backgroundColor: "#111", color: "#fff", border: "none", borderRadius: "50px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
          >
            RETRY
          </button>
        </div>
      )}

      {/* Artwork Grid */}
      {!loading && !error && (
        <div style={{ padding: "16px 12px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: "80px 0", fontSize: "14px" }}>
              {searchQuery
                ? `No artworks found for "${searchQuery}"`
                : artworks.length === 0
                ? "No artworks yet. Be the first to upload!"
                : `No artworks in ${activeCategory}`}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {filtered.map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/artwork/${art.id}`)}
                  style={{ borderRadius: "16px", overflow: "hidden", cursor: "pointer", backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
                >
                  <div style={{ position: "relative", height: "200px", overflow: "hidden", backgroundColor: "#222" }}>
                    <img
                      src={getImageUrl(art.imageUrl)}
                      alt={art.title}
                      style={{ width: "100%", height: "200px", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&q=80"; }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(art.id); }}
                      style={{
                        position: "absolute", top: "10px", right: "10px",
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: "none", cursor: "pointer", fontSize: "14px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: liked[art.id] ? "#e53e3e" : "rgba(255,255,255,0.85)",
                        color: liked[art.id] ? "#fff" : "#bbb",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        transition: "all 0.2s"
                      }}
                    >
                      ♥
                    </button>
                  </div>

                  <div style={{ padding: "12px 14px 14px", backgroundColor: "#fff" }}>
                    <p style={{ fontSize: "9px", color: "#aaa", letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 4px", fontWeight: "600" }}>
                      {art.medium || art.category || "Artwork"}
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#111", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {art.title}
                    </p>
                    <p style={{ fontSize: "11px", color: "#888", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getArtistName(art.artist)}
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: "700", color: "#c0392b", margin: 0 }}>
                      {art.forSale && art.price ? `NPR ${Number(art.price).toLocaleString()}` : "Not for sale"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff", borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around",
        alignItems: "center", padding: "10px 0", zIndex: 50
      }}>
        {[
          { icon: "⌂", label: "Home", path: "/home" },
          { icon: "🔍", label: "Search", path: "/gallery" },
          { icon: "＋", label: "Post", path: "/upload" },
          { icon: "👤", label: "Profile", path: "/profile" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
              color: item.path === "/gallery" ? "#111" : "#aaa"
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: item.path === "/gallery" ? "700" : "400" }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}