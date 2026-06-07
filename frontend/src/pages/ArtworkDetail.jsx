import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const artworkData = {
  1: {
    id: 1,
    title: "The Fragmented Memory",
    artist: "Adrian Valen",
    artistBio: "Contemporary artist based in Kathmandu, known for exploring themes of memory and urban decay.",
    price: "12,400",
    medium: "Oil on Canvas",
    dimensions: "24 × 36 inches",
    year: "2023",
    edition: "1 of 1 Original",
    category: "CONTEMPORARY",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80",
    artistImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    description: "This piece explores the mechanics of memory and urban decay. The work uses heavy impasto techniques that detail the deep spiritual connection between ancient Buddhist mathematics and contemporary digital art forms. Each stroke is a deliberate act between the past and the present.",
    tags: ["Contemporary", "Abstract", "Urban", "Memory"],
    likes: 247,
    views: 1840,
  },
};

const relatedWorks = [
  { id: 2, title: "Eternal Nocturne", artist: "Julian Kahlo", image: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=300&q=80", price: "15,200" },
  { id: 3, title: "Silence in Geometry", artist: "Elena Rossi", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80", price: "8,900" },
  { id: 4, title: "Form of Wind", artist: "Sasha Moratti", image: "https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=300&q=80", price: "24,000" },
];

const comments = [
  { id: 1, name: "Ramesh B.", time: "2 days ago", text: "This truly captures the essence of Kathmandu's forgotten corners. The textures feel alive." },
  { id: 2, name: "Priya M.", time: "5 days ago", text: "Absolutely breathtaking. The structural balance is so precise yet emotional at the same time." },
];

export default function ArtworkDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const artwork = artworkData[id] || artworkData[1];

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(artwork.likes);
  const [comment, setComment] = useState("");
  const [commentList, setCommentList] = useState(comments);
  const [following, setFollowing] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((prev) => liked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    setCommentList([
      { id: Date.now(), name: "You", time: "Just now", text: comment },
      ...commentList,
    ]);
    setComment("");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8", fontFamily: "Inter, sans-serif", paddingBottom: "80px" }}>

      {/* Top Bar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", backgroundColor: "#fff",
        borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 50
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#333", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#f5f5f5" }}
        >
          ←
        </button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: "700", letterSpacing: "2px" }}>
          Artwork
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#555", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: "#f5f5f5" }}>
            ↑
          </button>
          <button
            onClick={handleLike}
            style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", backgroundColor: liked ? "#fff0f0" : "#f5f5f5", color: liked ? "#e53e3e" : "#555" }}
          >
            ♥
          </button>
        </div>
      </nav>

      {/* Hero Image */}
      <div style={{ width: "100%", backgroundColor: "#0d0305", position: "relative" }}>
        <img
          src={artwork.image}
          alt={artwork.title}
          style={{ width: "100%", height: "360px", objectFit: "cover", display: "block", opacity: 0.92 }}
        />
        {/* Category Badge */}
        <div style={{
          position: "absolute", top: "16px", left: "16px",
          backgroundColor: "rgba(0,0,0,0.6)", color: "#fff",
          padding: "5px 12px", borderRadius: "50px",
          fontSize: "9px", fontWeight: "700", letterSpacing: "2px"
        }}>
          {artwork.category}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 16px" }}>

        {/* Title + Price */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", padding: "24px", marginTop: "-24px", position: "relative", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div style={{ flex: 1, paddingRight: "16px" }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: "700", color: "#111", margin: "0 0 4px", lineHeight: 1.2 }}>
                {artwork.title}
              </h1>
              <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
                {artwork.artist} · {artwork.year}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: "22px", fontWeight: "700", color: "#c0392b", margin: 0 }}>
                NPR {artwork.price}
              </p>
              <p style={{ fontSize: "10px", color: "#aaa", margin: "2px 0 0", letterSpacing: "1px" }}>
                {artwork.edition}
              </p>
            </div>
          </div>

          {/* Like + View counts */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", color: "#888" }}>♥ {likeCount} likes</span>
            <span style={{ fontSize: "12px", color: "#888" }}>👁 {artwork.views} views</span>
          </div>

          {/* Artist Row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", backgroundColor: "#f8f8f8", borderRadius: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img
                src={artwork.artistImage}
                alt={artwork.artist}
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#111" }}>{artwork.artist}</p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#aaa" }}>Verified Artist</p>
              </div>
            </div>
            <button
              onClick={() => setFollowing(!following)}
              style={{
                padding: "8px 20px", borderRadius: "50px", fontSize: "11px",
                fontWeight: "700", letterSpacing: "1px", cursor: "pointer",
                border: following ? "1px solid #ddd" : "none",
                backgroundColor: following ? "#fff" : "#111",
                color: following ? "#888" : "#fff",
                transition: "all 0.2s"
              }}
            >
              {following ? "FOLLOWING" : "FOLLOW"}
            </button>
          </div>

          {/* Purchase Button */}
          <button
            onClick={() => alert("Purchase flow coming soon!")}
            style={{
              width: "100%", padding: "16px", backgroundColor: "#c0392b",
              border: "none", borderRadius: "12px", color: "#fff",
              fontSize: "13px", fontWeight: "700", letterSpacing: "2px",
              cursor: "pointer", marginBottom: "12px"
            }}
          >
            PURCHASE ARTWORK
          </button>

          {/* Tags */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {artwork.tags.map((tag) => (
              <span key={tag} style={{ padding: "5px 12px", backgroundColor: "#f0f0f0", borderRadius: "50px", fontSize: "11px", color: "#666", fontWeight: "600" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Curator's Note */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", marginTop: "12px" }}>
          <h3 style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#aaa", margin: "0 0 12px", textTransform: "uppercase" }}>
            Curator's Note
          </h3>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, margin: 0 }}>
            {artwork.description}
          </p>
        </div>

        {/* Specifications */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", marginTop: "12px" }}>
          <h3 style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#aaa", margin: "0 0 16px", textTransform: "uppercase" }}>
            Specifications
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {[
              { label: "Medium", value: artwork.medium },
              { label: "Dimensions", value: artwork.dimensions },
              { label: "Year", value: artwork.year },
              { label: "Edition", value: artwork.edition },
              { label: "Category", value: artwork.category },
              { label: "Signed by Artist", value: "Yes" },
            ].map((spec) => (
              <div key={spec.label}>
                <p style={{ margin: 0, fontSize: "10px", color: "#aaa", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "600" }}>
                  {spec.label}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "13px", color: "#333", fontWeight: "600" }}>
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Works */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#aaa", margin: 0, textTransform: "uppercase" }}>
              Related Works
            </h3>
            <button onClick={() => navigate("/gallery")} style={{ background: "none", border: "none", fontSize: "11px", color: "#c0392b", cursor: "pointer", fontWeight: "700", letterSpacing: "1px" }}>
              VIEW ALL
            </button>
          </div>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
            {relatedWorks.map((work) => (
              <div
                key={work.id}
                onClick={() => navigate(`/artwork/${work.id}`)}
                style={{ flexShrink: 0, width: "140px", cursor: "pointer" }}
              >
                <div style={{ width: "140px", height: "140px", borderRadius: "12px", overflow: "hidden", backgroundColor: "#111" }}>
                  <img src={work.image} alt={work.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <p style={{ margin: "8px 0 2px", fontSize: "12px", fontWeight: "700", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {work.title}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>{work.artist}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", fontWeight: "700", color: "#c0392b" }}>NPR {work.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div style={{ backgroundColor: "#fff", borderRadius: "16px", padding: "20px", marginTop: "12px" }}>
          <h3 style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "2px", color: "#aaa", margin: "0 0 16px", textTransform: "uppercase" }}>
            Collector Insights
          </h3>

          {/* Comment Input */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#111", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: "700" }}>
              Y
            </div>
            <div style={{ flex: 1, display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Add your impression..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                style={{
                  flex: 1, padding: "10px 14px", backgroundColor: "#f5f5f5",
                  border: "1px solid #eee", borderRadius: "50px",
                  fontSize: "13px", color: "#333", outline: "none"
                }}
              />
              <button
                onClick={handleComment}
                style={{ padding: "10px 16px", backgroundColor: "#111", border: "none", borderRadius: "50px", color: "#fff", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
              >
                POST
              </button>
            </div>
          </div>

          {/* Comment List */}
          {commentList.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#e0e0e0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#555" }}>
                {c.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#111" }}>{c.name}</span>
                  <span style={{ fontSize: "11px", color: "#bbb" }}>{c.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: 1.5 }}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

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
              color: "#aaa"
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span style={{ fontSize: "10px" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}