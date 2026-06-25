import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ArtworkDetail.css";

export default function ArtworkDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const artRes = await fetch(`http://localhost:8080/api/artworks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!artRes.ok) throw new Error("Artwork not found");
        const artData = await artRes.json();
        setArtwork(artData);

        const likeRes = await fetch(`http://localhost:8080/api/likes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          setLiked(likeData.liked);
          setLikeCount(likeData.likeCount);
        }

        const commRes = await fetch(`http://localhost:8080/api/comments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (commRes.ok) {
          setComments(await commRes.json());
        }

        if (artData.artist?.id) {
          const followRes = await fetch(
            `http://localhost:8080/api/follows/${artData.artist.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (followRes.ok) {
            const followData = await followRes.json();
            setFollowing(followData.following);
            setFollowerCount(followData.followerCount);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load artwork.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/likes/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (err) {
      console.error("Like failed", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading || !artwork?.artist?.id) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/follows/${artwork.artist.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following);
        setFollowerCount(data.followerCount);
      }
    } catch (err) {
      console.error("Follow failed", err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/comments/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        setComments((prev) => [saved, ...prev]);
        setCommentText("");
      }
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (orderLoading || orderSuccess) return;
    setOrderLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrderSuccess(true);
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        alert("Failed to place order. Please try again.");
      }
    } catch (err) {
      console.error("Order failed", err);
      alert("Something went wrong.");
    } finally {
      setOrderLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80";
    if (url.startsWith("http")) return url;
    return `http://localhost:8080${url}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return <div className="detail-loading"><p>Loading artwork...</p></div>;
  }

  if (error || !artwork) {
    return (
      <div className="detail-error">
        <p>{error || "Artwork not found."}</p>
        <button onClick={() => navigate("/gallery")}>Back to Gallery</button>
      </div>
    );
  }

  const artistName = artwork.artist?.name || artwork.artist?.email || "Unknown Artist";

  return (
    <div className="detail-page">

      <nav className="detail-nav">
        <button className="detail-nav-btn" onClick={() => navigate(-1)}>←</button>
        <span className="detail-nav-title">Artwork</span>
        <div className="detail-nav-actions">
          <button className="detail-nav-btn">↑</button>
          <button
            className={`detail-nav-btn${liked ? " detail-nav-btn--liked" : ""}`}
            onClick={handleLike}
            disabled={likeLoading}
          >
            ♥
          </button>
        </div>
      </nav>

      <div className="detail-hero">
        <img
          src={getImageUrl(artwork.imageUrl)}
          alt={artwork.title}
          className="detail-hero-img"
        />
        {artwork.category && (
          <div className="detail-category-badge">{artwork.category}</div>
        )}
      </div>

      <div className="detail-content">

        <div className="detail-card detail-card--top">
          <div className="detail-title-row">
            <div className="detail-title-left">
              <h1 className="detail-title">{artwork.title}</h1>
              <p className="detail-artist-meta">
                {artistName}
                {artwork.createdAt && (
                  <> · {new Date(artwork.createdAt).getFullYear()}</>
                )}
              </p>
            </div>
            {artwork.forSale && artwork.price && (
              <div className="detail-price-block">
                <p className="detail-price">NPR {Number(artwork.price).toLocaleString()}</p>
                <p className="detail-edition">1 of 1 Original</p>
              </div>
            )}
          </div>

          <div className="detail-stats">
            <span>♥ {likeCount} {likeCount === 1 ? "like" : "likes"}</span>
            {followerCount > 0 && (
              <span>👥 {followerCount} {followerCount === 1 ? "follower" : "followers"}</span>
            )}
          </div>

          <div className="detail-artist-row">
            <div className="detail-artist-info">
              <div className="detail-artist-avatar">
                {artistName[0].toUpperCase()}
              </div>
              <div>
                <p className="detail-artist-name">{artistName}</p>
                <p className="detail-artist-tag">Verified Artist</p>
              </div>
            </div>
            <div className="detail-artist-actions">
              <button
                className={`detail-follow-btn${following ? " detail-follow-btn--following" : ""}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {following ? "FOLLOWING" : "FOLLOW"}
              </button>
              <button
                className="detail-message-btn"
                onClick={() => navigate(`/chat/${artwork.artist.id}`)}
              >
                MESSAGE
              </button>
            </div>
          </div>

          {artwork.forSale ? (
            <button
              className="detail-purchase-btn"
              onClick={handleBuyNow}
              disabled={orderLoading || orderSuccess}
            >
              {orderSuccess
                ? "✓ ORDER PLACED! REDIRECTING..."
                : orderLoading
                ? "PLACING ORDER..."
                : "BUY NOW"}
            </button>
          ) : (
            <div className="detail-not-for-sale">Not for sale</div>
          )}

          <div className="detail-tags">
            {artwork.category && <span className="detail-tag">{artwork.category}</span>}
            {artwork.medium && <span className="detail-tag">{artwork.medium}</span>}
          </div>
        </div>

        {artwork.description && (
          <div className="detail-card">
            <h3 className="detail-section-label">Curator's Note</h3>
            <p className="detail-description">{artwork.description}</p>
          </div>
        )}

        <div className="detail-card">
          <h3 className="detail-section-label">Specifications</h3>
          <div className="detail-specs">
            {[
              { label: "Medium", value: artwork.medium },
              { label: "Dimensions", value: artwork.dimensions },
              { label: "Category", value: artwork.category },
              { label: "For Sale", value: artwork.forSale ? "Yes" : "No" },
            ]
              .filter((s) => s.value)
              .map((spec) => (
                <div key={spec.label} className="detail-spec-item">
                  <p className="detail-spec-label">{spec.label}</p>
                  <p className="detail-spec-value">{spec.value}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="detail-card">
          <h3 className="detail-section-label">
            Collector Insights {comments.length > 0 && `(${comments.length})`}
          </h3>

          <div className="detail-comment-input-row">
            <div className="detail-avatar">Y</div>
            <div className="detail-comment-input-wrap">
              <input
                type="text"
                placeholder="Add your impression..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                className="detail-comment-input"
                disabled={commentLoading}
              />
              <button
                className="detail-comment-post-btn"
                onClick={handleComment}
                disabled={commentLoading || !commentText.trim()}
              >
                {commentLoading ? "..." : "POST"}
              </button>
            </div>
          </div>

          {comments.length === 0 && (
            <p className="detail-no-comments">Be the first to leave an impression.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} className="detail-comment">
              <div className="detail-avatar detail-avatar--sm">
                {(c.user?.name || c.user?.email || "?")[0].toUpperCase()}
              </div>
              <div className="detail-comment-body">
                <div className="detail-comment-meta">
                  <span className="detail-comment-name">
                    {c.user?.name || c.user?.email || "Anonymous"}
                  </span>
                  <span className="detail-comment-time">{formatTime(c.createdAt)}</span>
                </div>
                <p className="detail-comment-text">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      <nav className="detail-bottom-nav">
        {[
          { icon: "⌂", label: "Home", path: "/home" },
          { icon: "🔍", label: "Search", path: "/gallery" },
          { icon: "+", label: "Post", path: "/upload" },
          { icon: "👤", label: "Profile", path: "/profile" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="detail-bottom-nav-btn"
          >
            <span className="detail-bottom-nav-icon">{item.icon}</span>
            <span className="detail-bottom-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}