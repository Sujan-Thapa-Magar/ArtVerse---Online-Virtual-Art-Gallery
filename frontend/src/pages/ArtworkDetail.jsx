import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

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

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Edit states
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState(null);

  // Image zoom (view-only, purely presentational — no data/logic change)
  const [isZoomed, setIsZoomed] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const getCurrentUserEmail = () => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])).sub; }
    catch { return null; }
  };

  const isOwner = artwork?.artist?.email === getCurrentUserEmail();

  // Save what the guest was trying to do, then send them to login
  const savePendingAction = (action, extra = {}) => {
    sessionStorage.setItem(
      "pendingArtworkAction",
      JSON.stringify({ action, artworkId: id, ...extra })
    );
    navigate("/login");
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const artRes = await fetch(`http://localhost:8080/api/artworks/${id}`, {
          headers: authHeaders,
        });
        if (!artRes.ok) throw new Error("Artwork not found");
        const artData = await artRes.json();
        setArtwork(artData);
        setEditForm({
          title: artData.title || "",
          description: artData.description || "",
          medium: artData.medium || "",
          dimensions: artData.dimensions || "",
          category: artData.category || "",
          price: artData.price || "",
          isForSale: artData.forSale || false,
        });

        const likeRes = await fetch(`http://localhost:8080/api/likes/${id}`, {
          headers: authHeaders,
        });
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          setLiked(likeData.liked);
          setLikeCount(likeData.likeCount);
        }

        const commRes = await fetch(`http://localhost:8080/api/comments/${id}`, {
          headers: authHeaders,
        });
        if (commRes.ok) setComments(await commRes.json());

        if (artData.artist?.id) {
          const followRes = await fetch(
            `http://localhost:8080/api/follows/${artData.artist.id}`,
            { headers: authHeaders }
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

  // Resume any pending action once we're logged in and the artwork has loaded
  useEffect(() => {
    if (!token || !artwork) return;

    const raw = sessionStorage.getItem("pendingArtworkAction");
    if (!raw) return;

    let pending;
    try { pending = JSON.parse(raw); } catch { sessionStorage.removeItem("pendingArtworkAction"); return; }

    if (String(pending.artworkId) !== String(id)) return;

    sessionStorage.removeItem("pendingArtworkAction");

    if (pending.action === "like") {
      handleLike();
    } else if (pending.action === "follow") {
      handleFollow();
    } else if (pending.action === "comment" && pending.commentText) {
      submitComment(pending.commentText);
    } else if (pending.action === "buy") {
      setSelectedMethod(null);
      setShowPaymentModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, artwork]);

  const handleLike = async () => {
    if (!token) { savePendingAction("like"); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/likes/${id}`, {
        method: "POST",
        headers: authHeaders,
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
    if (!token) { savePendingAction("follow"); return; }
    if (followLoading || !artwork?.artist?.id) return;
    setFollowLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/follows/${artwork.artist.id}`,
        { method: "POST", headers: authHeaders }
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

  const handleMessageClick = () => {
    if (!token) { navigate("/login"); return; }
    navigate(`/chat/${artwork.artist.id}`);
  };

  // Shared comment-submit logic, used by both the POST button and the resume-after-login flow
  const submitComment = async (text) => {
    if (!text.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/comments/${id}`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
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

  const handleComment = async () => {
    if (!commentText.trim()) return;
    if (!token) { savePendingAction("comment", { commentText: commentText.trim() }); return; }
    await submitComment(commentText);
  };

  // Opens the payment method modal instead of buying directly
  const openPaymentModal = () => {
    if (!token) { savePendingAction("buy"); return; }
    setSelectedMethod(null);
    setShowPaymentModal(true);
  };

  // eSewa ePay v2 — ask the backend to sign a payment request, remember which
  // artwork we're buying, then auto-submit a form that redirects to eSewa.
  const startEsewaPayment = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/payments/esewa/initiate/${id}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const errText = await res.text();
        alert(errText || "Could not start eSewa payment.");
        setPaymentProcessing(false);
        return;
      }
      const { esewaUrl, fields } = await res.json();

      // So the /payment/success page knows which order to complete.
      sessionStorage.setItem("esewaTransactionUuid", fields.transaction_uuid);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = esewaUrl;
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("eSewa initiate failed", err);
      alert("Something went wrong starting the payment.");
      setPaymentProcessing(false);
    }
  };

  // Khalti ePayment (KPG-2) — ask the backend to open a hosted checkout
  // session, then send the browser straight to Khalti's payment_url.
  const startKhaltiPayment = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/payments/khalti/initiate/${id}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (!res.ok) {
        const errText = await res.text();
        alert(errText || "Could not start Khalti payment.");
        setPaymentProcessing(false);
        return;
      }
      const { paymentUrl } = await res.json();
      window.location.href = paymentUrl;
    } catch (err) {
      console.error("Khalti initiate failed", err);
      alert("Something went wrong starting the payment.");
      setPaymentProcessing(false);
    }
  };

  // Called after user picks a payment method and confirms.
  const handleConfirmPayment = async () => {
    if (!selectedMethod || paymentProcessing) return;
    setPaymentProcessing(true);

    if (selectedMethod === "eSewa") {
      await startEsewaPayment();
      return; // browser navigates away to eSewa
    }

    if (selectedMethod === "Khalti") {
      await startKhaltiPayment();
      return; // browser navigates away to Khalti
    }
  };

  const handleBuyNow = async () => {
    if (!token) { savePendingAction("buy"); return; }
    if (orderLoading || orderSuccess) return;
    setOrderLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${id}`, {
        method: "POST",
        headers: authHeaders,
      });
      if (res.ok) {
        setOrderSuccess(true);
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        const errText = await res.text();
        alert(errText || "Failed to place order. Please try again.");
        // Refresh artwork data in case forSale status changed
        const refreshed = await fetch(`http://localhost:8080/api/artworks/${id}`, {
          headers: authHeaders,
        });
        if (refreshed.ok) setArtwork(await refreshed.json());
      }
    } catch (err) {
      console.error("Order failed", err);
      alert("Something went wrong.");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!token) { navigate("/login"); return; }
    if (editLoading) return;
    setEditLoading(true);
    setEditMsg(null);
    try {
      const params = new URLSearchParams();
      params.append("title", editForm.title);
      params.append("description", editForm.description);
      params.append("medium", editForm.medium);
      params.append("dimensions", editForm.dimensions);
      params.append("category", editForm.category);
      params.append("price", editForm.price);
      params.append("isForSale", editForm.isForSale);

      const res = await fetch(`http://localhost:8080/api/artworks/${id}?${params.toString()}`, {
        method: "PUT",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setArtwork(updated);
      setShowEdit(false);
      setEditMsg({ type: "success", text: "Artwork updated successfully!" });
      setTimeout(() => setEditMsg(null), 3000);
    } catch (err) {
      setEditMsg({ type: "error", text: err.message });
    } finally {
      setEditLoading(false);
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

  const inputStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #e7e5e4",
    borderRadius: 8, fontSize: 13, fontFamily: "Roboto, sans-serif",
    outline: "none", color: "#1c1917", background: "#ffffff",
    boxSizing: "border-box",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4"
        style={{ fontFamily: "'Roboto', sans-serif" }}>
        <div className="w-10 h-10 border-4 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#78716c] tracking-widest uppercase">Loading artwork…</p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-5"
        style={{ fontFamily: "'Roboto', sans-serif" }}>
        <p className="text-[#78716c] text-sm">{error || "Artwork not found."}</p>
        <button onClick={() => navigate("/gallery")}
          className="px-6 py-2.5 bg-red-600 text-white text-xs font-bold tracking-widest rounded-full hover:bg-red-700 transition-colors cursor-pointer">
          BACK TO GALLERY
        </button>
      </div>
    );
  }

  const artistName = artwork.artist?.name || artwork.artist?.email || "Unknown Artist";

  return (
    <div className="min-h-screen bg-cream text-[#1c1917] pb-12">
      <Navbar />

      {/* ── Action row: back / edit / like ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-lg text-[#1c1917] transition-colors cursor-pointer border border-stone-200">
          ←
        </button>
        <div className="flex gap-2">
          {isOwner && (
            <button onClick={() => { setShowEdit(v => !v); setEditMsg(null); }}
              className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 flex items-center justify-center text-base text-[#1c1917] transition-colors cursor-pointer border border-stone-200">
              ✏️
            </button>
          )}
          <button onClick={handleLike} disabled={likeLoading}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-200 cursor-pointer border ${
              liked ? "bg-red-50 border-red-300 text-red-600 scale-110" : "bg-white border-stone-200 text-stone-400 hover:text-red-600"
            }`}>
            ♥
          </button>
        </div>
      </div>

      {/* ── Main two-column layout: image left / info right ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* ── LEFT: image stage ── */}
        <div className="md:sticky md:top-20">
          <div
            className="relative w-full flex items-center justify-center rounded-2xl"
            style={{
              minHeight: "560px",
              background: "#f5f5f4",
              padding: "32px",
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                background: "#fff",
                padding: 14,
                borderRadius: 4,
                boxShadow: "0 1px 0 #fff inset, 0 25px 50px rgba(28,27,25,0.12)",
              }}
            >
              <img
                src={getImageUrl(artwork.imageUrl)}
                alt={artwork.title}
                className="max-h-[520px] max-w-full object-contain"
                style={{ borderRadius: 2 }}
              />
            </div>

            {artwork.category && (
              <span className="absolute top-4 left-4 bg-white/90 border border-[#e7e5e4] text-[#78716c] text-[9px] font-bold tracking-[2px] uppercase px-3 py-1.5 rounded-full">
                {artwork.category}
              </span>
            )}

            {/* Zoom control */}
            <button
              onClick={() => setIsZoomed(true)}
              aria-label="Zoom image"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/95 border border-[#e7e5e4] flex items-center justify-center text-[#1c1917] hover:bg-white transition-colors cursor-pointer"
              style={{ boxShadow: "0 2px 8px rgba(28,27,25,0.10)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── RIGHT: all product info stacked ── */}
        <div className="space-y-3">

          {/* ── Edit Form (owner only) ── */}
          {showEdit && isOwner && (
            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5" style={{ boxShadow: "0 8px 24px rgba(28,27,25,0.05)" }}>
              <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-4">Edit Artwork</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#78716c", fontWeight: 600, display: "block", marginBottom: 4 }}>Title</label>
                  <input style={inputStyle} value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#78716c", fontWeight: 600, display: "block", marginBottom: 4 }}>Description</label>
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#78716c", fontWeight: 600, display: "block", marginBottom: 4 }}>Medium</label>
                    <input style={inputStyle} value={editForm.medium} onChange={e => setEditForm(f => ({ ...f, medium: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#78716c", fontWeight: 600, display: "block", marginBottom: 4 }}>Dimensions</label>
                    <input style={inputStyle} value={editForm.dimensions} onChange={e => setEditForm(f => ({ ...f, dimensions: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#78716c", fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
                    <input style={inputStyle} value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#78716c", fontWeight: 600, display: "block", marginBottom: 4 }}>Price (NPR)</label>
                    <input type="number" style={inputStyle} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="isForSale" checked={editForm.isForSale} onChange={e => setEditForm(f => ({ ...f, isForSale: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <label htmlFor="isForSale" style={{ fontSize: 13, color: "#1c1917", fontWeight: 500, cursor: "pointer" }}>Available for sale</label>
                </div>
                {editMsg && (
                  <div style={{ fontSize: 12, padding: "8px 12px", borderRadius: 7, background: editMsg.type === "success" ? "#f0fdf4" : "#fef2f2", color: editMsg.type === "success" ? "#166534" : "#dc2626" }}>
                    {editMsg.text}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleEdit} disabled={editLoading}
                    style={{ flex: 1, padding: "10px", background: editLoading ? "#a8a29e" : "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: editLoading ? "not-allowed" : "pointer" }}>
                    {editLoading ? "Saving…" : "Save Changes"}
                  </button>
                  <button onClick={() => setShowEdit(false)}
                    style={{ padding: "10px 16px", background: "#f5f5f4", color: "#78716c", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {editMsg && !showEdit && (
            <div style={{ fontSize: 12, padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              {editMsg.text}
            </div>
          )}

          {/* ── Gallery Plaque ── */}
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-6" style={{ boxShadow: "0 8px 24px rgba(28,27,25,0.05)" }}>

            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4">
                <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-2">
                  {artwork.forSale ? "Available Now" : "Already Sold"}
                </p>
                <h1 className="text-[28px] md:text-[32px] font-bold text-[#1c1917] leading-tight mb-1"
                  style={{ fontFamily: "'Roboto', sans-serif" }}>
                  {artwork.title}
                </h1>
                <p className="text-[12px] text-[#78716c]">
                  {artistName}
                  {artwork.createdAt && <> · {new Date(artwork.createdAt).getFullYear()}</>}
                </p>
              </div>
              {artwork.forSale && artwork.price && (
                <div className="text-right flex-shrink-0">
                  <p className="text-[22px] font-bold text-[#1c1917] leading-none">
                    NPR {Number(artwork.price).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#78716c] mt-1 tracking-wider">1 of 1 Original</p>
                </div>
              )}
            </div>

            <div className="border-t border-[#e7e5e4] my-4" />

            <div className="flex gap-3 mb-1">
              <span className="flex items-center gap-1.5 text-[12px] text-[#57534e] bg-white border border-[#e7e5e4] px-3 py-1.5 rounded-full">
                <span className={liked ? "text-[#dc2626]" : ""}>♥</span>
                {likeCount} {likeCount === 1 ? "like" : "likes"}
              </span>
              {followerCount > 0 && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#57534e] bg-white border border-[#e7e5e4] px-3 py-1.5 rounded-full">
                  👥 {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </span>
              )}
              {artwork.viewCount > 0 && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#57534e] bg-white border border-[#e7e5e4] px-3 py-1.5 rounded-full">
                  👁 {artwork.viewCount} views
                </span>
              )}
            </div>

            <div className="border-t border-[#e7e5e4] my-4" />

            {/* Artist Row */}
            <div className="flex items-center justify-between bg-white border border-[#e7e5e4] rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                  {artistName[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1c1917] mb-0.5">{artistName}</p>
                  <p className="text-[11px] text-[#78716c]">Verified Artist</p>
                </div>
              </div>
              {!isOwner && (
                <div className="flex gap-2">
                  <button onClick={handleFollow} disabled={followLoading}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                      following
                        ? "bg-white border border-[#e7e5e4] text-[#78716c] hover:border-[#D6D2C5]"
                        : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                    }`}>
                    {following ? "FOLLOWING" : "FOLLOW"}
                  </button>
                  <button onClick={handleMessageClick}
                    className="px-4 py-2 rounded-full text-[11px] font-bold tracking-wide border border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white transition-all duration-200 cursor-pointer bg-transparent active:scale-95">
                    MESSAGE
                  </button>
                </div>
              )}
            </div>

            {/* Buy / Already Sold — hide for owner */}
            {!isOwner && (
              artwork.forSale ? (
                <button onClick={openPaymentModal} disabled={orderLoading || orderSuccess}
                  className={`w-full py-4 rounded-xl text-[13px] font-bold tracking-[2px] transition-all duration-200 cursor-pointer border-none mb-3 ${
                    orderSuccess ? "bg-[#166534] text-white" : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.99]"
                  }`}>
                  {orderSuccess ? "✓ ACQUIRED — REDIRECTING..." : orderLoading ? "PROCESSING..." : "ACQUIRE THIS PIECE"}
                </button>
              ) : (
                <div className="w-full py-3.5 rounded-xl bg-white border border-[#e7e5e4] text-[#78716c] text-[13px] font-semibold tracking-wider text-center mb-3">
                  Already Sold
                </div>
              )
            )}

            <div className="flex gap-2 flex-wrap">
              {artwork.category && (
                <span className="px-3 py-1 bg-white border border-[#e7e5e4] rounded-full text-[11px] text-[#57534e] font-semibold">{artwork.category}</span>
              )}
              {artwork.medium && (
                <span className="px-3 py-1 bg-white border border-[#e7e5e4] rounded-full text-[11px] text-[#57534e] font-semibold">{artwork.medium}</span>
              )}
            </div>
          </div>

          {/* ── Curator's Note ── */}
          {artwork.description && (
            <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5" style={{ boxShadow: "0 8px 24px rgba(28,27,25,0.05)" }}>
              <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-3">Curator's Note</p>
              <p className="text-[14px] text-[#44403c] leading-relaxed">{artwork.description}</p>
            </div>
          )}

          {/* ── Specifications ── */}
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5" style={{ boxShadow: "0 8px 24px rgba(28,27,25,0.05)" }}>
            <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-4">Specifications</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Medium", value: artwork.medium },
                { label: "Dimensions", value: artwork.dimensions },
                { label: "Category", value: artwork.category },
                { label: "Views", value: artwork.viewCount > 0 ? `${artwork.viewCount} views` : null },
                { label: "Status", value: artwork.forSale ? "Available" : "Already Sold" },
              ]
                .filter((s) => s.value)
                .map((spec) => (
                  <div key={spec.label} className="border-l-2 border-[#dc2626]/40 pl-3">
                    <p className="text-[10px] font-bold tracking-wider text-[#78716c] uppercase mb-1">{spec.label}</p>
                    <p className="text-[13px] font-semibold text-[#1c1917]">{spec.value}</p>
                  </div>
                ))}
            </div>
          </div>

          {/* ── Guestbook ── */}
          <div className="bg-white border border-[#e7e5e4] rounded-2xl p-5" style={{ boxShadow: "0 8px 24px rgba(28,27,25,0.05)" }}>
            <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-4">
              Guestbook {comments.length > 0 && `(${comments.length})`}
            </p>
            <div className="flex gap-3 items-center mb-5">
              <div className="w-9 h-9 rounded-full bg-[#1c1917] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {token ? "Y" : "?"}
              </div>
              <div className="flex-1 flex gap-2">
                <input type="text" placeholder="Sign the guestbook…" value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  disabled={commentLoading}
                  className="flex-1 px-4 py-2.5 bg-white border border-[#e7e5e4] rounded-full text-[13px] text-[#1c1917] placeholder-[#a8a29e] outline-none focus:border-[#dc2626] transition-all"
                  style={{ fontFamily: "'Roboto', sans-serif" }} />
                <button onClick={handleComment} disabled={commentLoading || !commentText.trim()}
                  className="px-4 py-2.5 bg-red-600 text-white text-[12px] font-bold rounded-full hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40 cursor-pointer border-none">
                  {commentLoading ? "…" : "POST"}
                </button>
              </div>
            </div>

            {comments.length === 0 && (
              <p className="text-[13px] text-[#a8a29e] text-center py-3">Be the first to sign the guestbook.</p>
            )}

            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f5f5f4] text-[#78716c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(c.user?.name || c.user?.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-[#1c1917]">{c.user?.name || c.user?.email || "Anonymous"}</span>
                      <span className="text-[11px] text-[#a8a29e]">{formatTime(c.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-[#57534e] leading-relaxed m-0">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Zoom lightbox (view-only overlay, no data/logic change) ── */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(28,27,25,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, padding: 24, cursor: "zoom-out",
          }}
        >
          <img
            src={getImageUrl(artwork.imageUrl)}
            alt={artwork.title}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }}
          />
          <button
            onClick={() => setIsZoomed(false)}
            aria-label="Close zoom"
            style={{
              position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.95)", border: "none", color: "#1c1917",
              fontSize: 16, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Payment Method Modal ── */}
      {showPaymentModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(28,27,25,0.5)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 100,
          }}
          onClick={() => !paymentProcessing && setShowPaymentModal(false)}
        >
          <div
            style={{
              background: "#ffffff", border: "1px solid #e7e5e4", borderBottom: "none",
              borderRadius: "20px 20px 0 0", width: "100%",
              maxWidth: 480, padding: "24px 20px 28px", boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!paymentProcessing ? (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "#dc2626", textTransform: "uppercase", marginBottom: 6 }}>
                    Complete Purchase
                  </p>
                  <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: 22, fontWeight: 600, color: "#1c1917", margin: 0 }}>
                    Choose Payment Method
                  </p>
                  <p style={{ fontSize: 13, color: "#1c1917", fontWeight: 700, marginTop: 6 }}>
                    NPR {Number(artwork.price).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setSelectedMethod("eSewa")}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      borderRadius: 12, border: selectedMethod === "eSewa" ? "2px solid #16a34a" : "2px solid #e7e5e4",
                      background: selectedMethod === "eSewa" ? "#f0fdf4" : "#fff",
                      cursor: "pointer", textAlign: "left", fontFamily: "Roboto, sans-serif",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, overflow: "hidden",
                      flexShrink: 0, background: "#fff", border: "1px solid #e7e5e4",
                    }}>
                      <img src="/esewa.jpg" alt="eSewa" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", margin: 0 }}>eSewa</p>
                      <p style={{ fontSize: 11, color: "#78716c", margin: 0 }}>Digital wallet payment</p>
                    </div>
                    {selectedMethod === "eSewa" && <span style={{ color: "#16a34a", fontSize: 18 }}>✓</span>}
                  </button>

                  <button
                    onClick={() => setSelectedMethod("Khalti")}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      borderRadius: 12, border: selectedMethod === "Khalti" ? "2px solid #7c3aed" : "2px solid #e7e5e4",
                      background: selectedMethod === "Khalti" ? "#F5F3FF" : "#fff",
                      cursor: "pointer", textAlign: "left", fontFamily: "Roboto, sans-serif",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, overflow: "hidden",
                      flexShrink: 0, background: "#fff", border: "1px solid #e7e5e4",
                    }}>
                      <img src="/khalti.jpg" alt="Khalti" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", margin: 0 }}>Khalti</p>
                      <p style={{ fontSize: 11, color: "#78716c", margin: 0 }}>Digital wallet payment</p>
                    </div>
                    {selectedMethod === "Khalti" && <span style={{ color: "#7c3aed", fontSize: 18 }}>✓</span>}
                  </button>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={!selectedMethod}
                  style={{
                    width: "100%", padding: 15, borderRadius: 12, border: "none",
                    background: selectedMethod ? "#dc2626" : "#e7e5e4",
                    color: selectedMethod ? "#fff" : "#a8a29e",
                    fontSize: 13, fontWeight: 700, letterSpacing: "1px",
                    cursor: selectedMethod ? "pointer" : "not-allowed",
                    fontFamily: "Roboto, sans-serif",
                  }}
                >
                  {selectedMethod ? `PAY WITH ${selectedMethod.toUpperCase()}` : "SELECT A PAYMENT METHOD"}
                </button>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    width: "100%", padding: 12, marginTop: 8, borderRadius: 12, border: "none",
                    background: "transparent", color: "#78716c", fontSize: 12, fontWeight: 600,
                    cursor: "pointer", fontFamily: "Roboto, sans-serif",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <div style={{
                  width: 44, height: 44, margin: "0 auto 18px",
                  border: "4px solid #e7e5e4", borderTopColor: selectedMethod === "eSewa" ? "#16a34a" : "#7c3aed",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1c1917", margin: "0 0 4px" }}>
                  Processing payment via {selectedMethod}…
                </p>
                <p style={{ fontSize: 12, color: "#78716c", margin: 0 }}>Please don't close this window.</p>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>
  );
}