import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function VirtualExhibition() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [exhibition, setExhibition] = useState(null);
  const [artworks, setArtworks]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [current, setCurrent]         = useState(0);
  const [activeTab, setActiveTab]     = useState("EXHIBITION");
  const [liked, setLiked]             = useState(false);
  const [likeCount, setLikeCount]     = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showCurator, setShowCurator] = useState(false);
  const [visible, setVisible]         = useState(true);
  const [buying, setBuying]           = useState(false);
  const [buyMsg, setBuyMsg]           = useState(null);

  const token = localStorage.getItem("token");

  // ── Fetch exhibition + artworks ──
  useEffect(() => {
    if (!id) { setError("No exhibition ID provided."); setLoading(false); return; }
    fetch(`http://localhost:8080/api/exhibitions/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error("Exhibition not found"); return r.json(); })
      .then(data => {
        setExhibition(data.exhibition);
        setArtworks(data.artworks || []);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id]);

  // ── Fetch like status when artwork changes ──
  const art = artworks[current];
  useEffect(() => {
    if (!art) return;
    fetch(`http://localhost:8080/api/likes/${art.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      })
      .catch(() => {});
  }, [art?.id]);

  // ── Keyboard nav ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft")  goTo((current - 1 + artworks.length) % artworks.length);
      if (e.key === "ArrowRight") goTo((current + 1) % artworks.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, artworks.length]);

  function goTo(idx) {
    if (idx === current || artworks.length === 0) return;
    setVisible(false);
    setBuyMsg(null);
    setTimeout(() => { setCurrent(idx); setVisible(true); }, 220);
  }

  function formatPrice(price) {
    if (!price) return "Price on request";
    return "Rs. " + Number(price).toLocaleString("en-IN");
  }

  function getYear(createdAt) {
    if (!createdAt) return "";
    return createdAt.substring(0, 4);
  }

  async function handleLike() {
    if (likeLoading || !art) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/likes/${art.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (err) {
      console.error("Like failed", err);
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleBuyNow() {
    if (buying || !art) return;
    setBuying(true);
    setBuyMsg(null);
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${art.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Order failed");
      }
      setBuyMsg({ type: "success", text: "Order placed! Redirecting to your profile..." });
      setTimeout(() => navigate("/profile"), 2000);
    } catch (err) {
      setBuyMsg({ type: "error", text: err.message });
    } finally {
      setBuying(false);
    }
  }

  const C = {
    pageBg:      "#faf6f0",   
    windowBg:    "#faf6f0",   
    cardBg:      "#ffffff",
    border:      "#e7e5e4",   
    text:        "#1c1917",   
    textMid:     "#44403c", // Darker stone-700 for highly visible readable text
    textLight:   "#78716c", // Medium stone-500 instead of super light grey
    accent:      "#dc2626",   
    accentHover: "#b91c1c",   
    accentBg:    "#fef2f2",   
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.pageBg, display: "flex", alignItems: "center", justifyContent: "center", color: C.textLight, fontFamily: "Roboto, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "2px" }}>
      LOADING EXHIBITION...
    </div>
  );

  if (error || artworks.length === 0) return (
    <div style={{ minHeight: "100vh", background: C.pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.textMid, fontFamily: "Roboto, sans-serif", gap: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "1px" }}>{error || "This exhibition has no artworks yet."}</div>
      <button onClick={() => navigate("/home")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textMid, padding: "10px 24px", borderRadius: 12, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "1px", transition: "all 0.2s" }}>GO HOME</button>
    </div>
  );

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: C.pageBg, display: "flex", flexDirection: "column", fontFamily: "'Roboto', sans-serif", color: C.text, position: "relative" }}>
      <style>{`
        @keyframes fadeSlideIn  { from { opacity: 0; transform: translateX(32px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeSlideOut { from { opacity: 1; transform: translateX(0);    } to { opacity: 0; transform: translateX(-32px); } }
        .ve-art-enter { animation: fadeSlideIn 0.22s ease forwards; }
        .ve-art-exit  { animation: fadeSlideOut 0.22s ease forwards; }
        .control-btn:hover { border-color: #dc2626 !important; color: #dc2626 !important; background-color: #fef2f2 !important; }
        .nav-btn:hover { color: #dc2626 !important; }
      `}</style>

      <Navbar />

      {/* ── Exhibition controls ── */}
      <div className="sticky top-16 z-40 bg-cream">
        <div className="flex items-center justify-between px-6 lg:px-12 h-[60px] pt-2">
          <span className="text-xl font-bold tracking-wide text-[#1c1917]">Virtual Exhibition</span>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {["EXHIBITION", "CURATOR"].map(tab => {
              const active = activeTab === tab;
              return (
                <button key={tab} className="nav-btn" onClick={() => { setActiveTab(tab); setShowCurator(tab === "CURATOR" ? v => !v : false); }}
                  style={{ background: "none", border: "none", borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent", color: active ? C.accent : C.textLight, fontSize: 12, fontWeight: 700, letterSpacing: "2px", padding: "8px 16px", cursor: "pointer", transition: "all 0.2s" }}>
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Curator dropdown ── */}
      {showCurator && exhibition && (
        <div style={{ position: "absolute", top: 122, right: 32, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 24px", zIndex: 100, minWidth: 280, boxShadow: "0 16px 40px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 9, color: C.accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>About this Exhibition</div>
          <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>{exhibition.title}</div>
          <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.6, marginBottom: 12 }}>{exhibition.description || "No description provided."}</div>
          <div style={{ fontSize: 11, color: C.textLight, fontWeight: 500 }}>By {exhibition.artist?.name}</div>
        </div>
      )}

      {/* ── Stepper Counter ── */}
      <div style={{ textAlign: "center", padding: "20px 0 6px", fontSize: 10, color: C.textLight, fontWeight: 800, letterSpacing: "3px" }}>
        {exhibition?.title} &nbsp;·&nbsp; {current + 1} / {artworks.length}
      </div>

      {/* ── Main Workspace ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "16px 80px 90px" }}>
        
        <button onClick={() => goTo((current - 1 + artworks.length) % artworks.length)}
          className="control-btn"
          style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", background: C.cardBg, border: `1.5px solid ${C.border}`, color: C.textMid, width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, transition: "all 0.2s" }}>←</button>

        <div className={visible ? "ve-art-enter" : "ve-art-exit"} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, maxWidth: 450, width: "100%" }}>
          <div style={{ background: C.cardBg, padding: 14, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div style={{ width: "min(320px, 32vh)", height: "min(320px, 32vh)", overflow: "hidden", borderRadius: 8, background: C.border }}>
              <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>{art.title}</h2>
            <p style={{ fontSize: 11, fontWeight: 600, color: C.textMid, letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>{art.artist?.name} &nbsp;·&nbsp; {getYear(art.createdAt)}</p>
          </div>

          {/* Dots tracker */}
          <div style={{ display: "flex", gap: 8 }}>
            {artworks.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} style={{ height: 6, width: i === current ? 24 : 6, borderRadius: 3, border: "none", cursor: "pointer", background: i === current ? C.accent : C.border, transition: "all 0.2s" }} />
            ))}
          </div>
        </div>

        <button onClick={() => goTo((current + 1) % artworks.length)}
          className="control-btn"
          style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", background: C.cardBg, border: `1.5px solid ${C.border}`, color: C.textMid, width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, transition: "all 0.2s" }}>→</button>

        {/* Thumbnail row */}
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10 }}>
          {artworks.map((a, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: 48, height: 48, borderRadius: 8, cursor: "pointer", padding: 0, border: `2px solid ${i === current ? C.accent : "transparent"}`, overflow: "hidden", opacity: i === current ? 1 : 0.5 }}>
              <img src={a.imageUrl} alt={a.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer Bar (Enhanced Visibility for Sale Status & Buttons) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderTop: `1.5px solid ${C.border}`, background: "#fff", position: "relative", zIndex: 20 }}>
        <div>
          {art.forSale ? (
            <>
              <div style={{ fontSize: 9, color: C.accent, letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 3, fontWeight: 800 }}>Available for Acquisition</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: 26, fontWeight: 700, color: C.text }}>{formatPrice(art.price)}</span>
              </div>
            </>
          ) : (
            /* Clear & High Contrast "Not for sale" display styling */
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontSize: 10, color: "#ef4444", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 800 }}>Collection Status</div>
              <div style={{ fontSize: 14, color: C.textMid, fontWeight: 700, letterSpacing: "0.5px" }}>NOT FOR ACQUISITION</div>
            </div>
          )}
          {buyMsg && <div style={{ fontSize: 12, marginTop: 4, fontWeight: 700, color: buyMsg.type === "success" ? "#16a34a" : C.accent }}>{buyMsg.text}</div>}
        </div>

        {/* Action Controls - Bold dark borders with interactive feedback */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          
          {/* Like button */}
          <button onClick={handleLike} disabled={likeLoading} className="control-btn"
            style={{ width: 46, height: 46, background: liked ? C.accentBg : C.cardBg, border: `1.5px solid ${liked ? C.accent : C.border}`, borderRadius: "50%", color: liked ? C.accent : C.textMid, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
            {liked ? "♥" : "♡"}
          </button>

          {/* View detail button with explicit direction arrow */}
          <button onClick={() => navigate(`/artwork/${art.id}`)} className="control-btn"
            style={{ width: 46, height: 46, background: C.cardBg, border: `1.5px solid ${C.border}`, borderRadius: "50%", color: C.textMid, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            title="View Details">
            ↗
          </button>

          {/* Secure purchase acquire button */}
          {art.forSale && (
            <button onClick={handleBuyNow} disabled={buying}
              style={{ padding: "0 28px", height: 46, background: C.accent, border: "none", borderRadius: 10, color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "1.5px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentHover}
              onMouseLeave={e => e.currentTarget.style.background = C.accent}>
              {buying ? "BUYING..." : "ACQUIRE"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}