import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Navbar from "../components/Navbar";

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
      <ellipse cx="100" cy="100" rx="35" ry="32" fill="none" stroke="#dc2626" strokeWidth="4" opacity="0.3" transform="rotate(45 100 100)" />
    </svg>
  );
}

function statusColor(status) {
  if (status === "PENDING") return { bg: "#fef9c3", text: "#854d0e" };
  if (status === "IN_TRANSIT") return { bg: "#dbeafe", text: "#1e40af" };
  if (status === "DELIVERED") return { bg: "#dcfce7", text: "#166534" };
  return { bg: "#f3f4f6", text: "#6b7280" };
}

function computePerformanceData(artworks) {
  return [...artworks]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 6)
    .map((a) => ({
      name: a.title?.length > 14 ? `${a.title.slice(0, 14)}…` : a.title || "Untitled",
      views: a.viewCount || 0,
      likes: a.likeCount || 0,
    }));
}

function PerformanceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2 text-[12px]">
      <p className="font-bold text-[#1c1917] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.fill }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
          {p.dataKey === "views" ? "Views" : "Likes"}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
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

  // Exhibition states
  const [exhibitions, setExhibitions] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [exForm, setExForm] = useState({ title: "", description: "", startDate: "", endDate: "" });
  const [selectedArtworkIds, setSelectedArtworkIds] = useState([]);
  const [exSubmitting, setExSubmitting] = useState(false);
  const [exMsg, setExMsg] = useState(null);

  // Orders states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [deletingArtworkId, setDeletingArtworkId] = useState(null);
  const [ordersMsg, setOrdersMsg] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboardData = async () => {
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
        const allArtworks = await artRes.json();
        const payload = JSON.parse(atob(token.split(".")[1]));
        const email = payload.sub;
        const myArtworks = allArtworks.filter((a) => a.artist?.email === email);

        // Fetch every artwork's like count in parallel (was sequential — N round trips
        // one after another) and merge it onto each artwork for the performance chart.
        const likeResults = await Promise.all(
          myArtworks.map((art) =>
            fetch(`http://localhost:8080/api/likes/${art.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => (r.ok ? r.json() : { likeCount: 0 }))
              .catch(() => ({ likeCount: 0 }))
          )
        );
        const artworksWithLikes = myArtworks.map((art, i) => ({
          ...art,
          likeCount: likeResults[i]?.likeCount || 0,
        }));
        setArtworks(artworksWithLikes);
        if (artworksWithLikes.length > 0) {
          setUserName(artworksWithLikes[0].artist?.name || email);
        }
        setTotalLikes(likeResults.reduce((sum, l) => sum + (l?.likeCount || 0), 0));

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

        fetchOrders();
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab !== "Exhibitions") return;
    fetchExhibitions();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "Orders") return;
    fetchOrders();
  }, [activeTab]);

  const fetchExhibitions = async () => {
    setExLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/exhibitions/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExhibitions(data);
    } catch (err) {
      console.error("Failed to fetch exhibitions", err);
    } finally {
      setExLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/orders/artist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    setOrdersMsg(null);
    try {
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to update order");
      }
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setOrdersMsg({ type: "success", text: `Order marked as ${newStatus.replace("_", " ")}.` });
      setTimeout(() => setOrdersMsg(null), 3000);
    } catch (err) {
      setOrdersMsg({ type: "error", text: err.message });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const toggleArtworkSelection = (id) => {
    setSelectedArtworkIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreateExhibition = async () => {
    if (!exForm.title.trim()) { setExMsg({ type: "error", text: "Title is required." }); return; }
    setExSubmitting(true);
    setExMsg(null);
    try {
      const res = await fetch("http://localhost:8080/api/exhibitions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: exForm.title,
          description: exForm.description,
          startDate: exForm.startDate || null,
          endDate: exForm.endDate || null,
          artworkIds: selectedArtworkIds,
        }),
      });
      if (!res.ok) throw new Error("Failed to create exhibition");
      setExMsg({ type: "success", text: "Exhibition created successfully!" });
      setExForm({ title: "", description: "", startDate: "", endDate: "" });
      setSelectedArtworkIds([]);
      setShowCreateForm(false);
      fetchExhibitions();
    } catch (err) {
      setExMsg({ type: "error", text: err.message });
    } finally {
      setExSubmitting(false);
    }
  };

  const handleDeleteArtwork = async (artId, title) => {
    if (deletingArtworkId) return;
    if (!window.confirm(
      `Delete "${title}" permanently?\n\nThis cannot be undone. Its likes and comments will be removed too.`
    )) return;

    setDeletingArtworkId(artId);
    try {
      const res = await fetch(`http://localhost:8080/api/artworks/${artId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.text()) || "Delete failed");

      // Drop it locally so the counts, chart and totals stay in sync without
      // a full refetch — totalLikes is separate state, so adjust it too.
      const removed = artworks.find((a) => a.id === artId);
      setArtworks((prev) => prev.filter((a) => a.id !== artId));
      setTotalLikes((prev) => Math.max(0, prev - (removed?.likeCount || 0)));
    } catch (err) {
      alert(err.message || "Could not delete this artwork.");
    } finally {
      setDeletingArtworkId(null);
    }
  };

  const handleDeleteExhibition = async (exId) => {
    if (!window.confirm("Delete this exhibition?")) return;
    try {
      await fetch(`http://localhost:8080/api/exhibitions/${exId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchExhibitions();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const totalViews = artworks.reduce((sum, a) => sum + (a.viewCount || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === "PENDING").length;
  const totalEarnings = orders.reduce((sum, o) => sum + Number(o.pricePaid || 0), 0);
  const forSaleCount = artworks.filter((a) => a.forSale).length;
  const performanceData = computePerformanceData(artworks);

  const stats = [
    { icon: "❤️", label: "TOTAL LIKES",  value: totalLikes.toLocaleString() },
    { icon: "👁",  label: "TOTAL VIEWS",  value: totalViews.toLocaleString() },
    { icon: "👥", label: "FOLLOWERS",    value: followerCount.toLocaleString() },
    { icon: "🎨", label: "ARTWORKS",     value: artworks.length.toString() },
    { icon: "💰", label: "EARNINGS",     value: `NPR ${totalEarnings.toLocaleString()}` },
    { icon: "🛍", label: "FOR SALE",     value: forSaleCount.toString() },
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

  const inputStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 8, fontSize: 13, outline: "none", color: "#1c1917", background: "#faf6f0", boxSizing: "border-box",
  };

  return (
    <div className="min-h-screen bg-cream pb-10 text-[#1c1917]">

      <Navbar />

      {/* ── Page tabs ── */}
<div className="sticky top-16 z-20 flex items-center justify-between px-6 md:px-8 h-[60px] pt-2 bg-cream overflow-x-auto no-scrollbar">
       <span className="text-xl font-bold tracking-wide text-[#1c1917] whitespace-nowrap mr-4">
        My Studio
      </span>
        <div className="flex items-center gap-1">
          {["Dashboard", "Orders", "Exhibitions", "Inventory"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 text-[15px] font-medium border-b-2 transition-all duration-200 cursor-pointer bg-transparent whitespace-nowrap ${
                activeTab === tab
                  ? "border-red-600 text-red-600 font-semibold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
              {tab === "Orders" && pendingOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-white text-[9px] flex items-center justify-center">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "Dashboard" && (
          <>
            <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-3">Curation Status</p>
            <h1
              style={{ fontSize: "clamp(28px, 5vw, 40px)" }}
              className="font-display font-semibold leading-snug text-[#1c1917] mb-8 max-w-2xl"
            >
              {loading
                ? "Loading your studio…"
                : artworks.length === 0
                ? `Welcome, ${userName}! Upload your first artwork to get started.`
                : `Welcome back, ${userName} — you have ${artworks.length} artwork${artworks.length > 1 ? "s" : ""} in your gallery${followerCount > 0 ? ` and ${followerCount} follower${followerCount > 1 ? "s" : ""}` : ""}.`}
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
              {stats.map((s) => (
                <div key={s.label} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="text-2xl mb-4">{s.icon}</div>
                  <p className="text-[10px] font-bold tracking-[1.5px] text-gray-400 uppercase mb-1.5">{s.label}</p>
                  <p className="tabular-nums text-[22px] font-bold text-[#1c1917]">
                    {loading ? "—" : s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Performance chart */}
            <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1c1917]">Artwork Performance</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">Views and likes for your top artworks.</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1c1917] inline-block" />
                    VIEWS
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#dc2626] inline-block" />
                    LIKES
                  </span>
                </div>
              </div>
              {loading ? (
                <div className="h-52 flex items-center justify-center text-[13px] text-gray-300">Loading chart…</div>
              ) : performanceData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-[13px] text-gray-300">Upload artwork to see performance data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={performanceData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }} barGap={4}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: "#9ca3af" }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} width={32} />
                    <Tooltip content={<PerformanceTooltip />} cursor={{ fill: "#faf6f0" }} />
                    <Bar dataKey="views" fill="#1c1917" radius={[3, 3, 0, 0]} maxBarSize={26} fillOpacity={0.85} />
                    <Bar dataKey="likes" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={26} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* My Artworks + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* My Artworks (wide column) */}
              <div className="lg:col-span-2">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#1c1917] mb-1">My Artworks</h2>
                    <p className="text-[12px] text-gray-400">Your uploaded artworks — click to view details.</p>
                  </div>
                  <button onClick={() => navigate("/gallery")} className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase hover:text-[#1c1917] transition-colors cursor-pointer bg-transparent border-none">
                    View Gallery
                  </button>
                </div>

                <div className="relative mt-4">
                  {loading ? (
                    <p className="text-[13px] text-gray-300">Loading artworks…</p>
                  ) : artworks.length === 0 ? (
                    <p className="text-[13px] text-gray-300">No artworks yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {artworks.map((art) => (
                        <div key={art.id} onClick={() => navigate(`/artwork/${art.id}`)} className="cursor-pointer group">
                          <div className="relative rounded-lg overflow-hidden mb-2.5 bg-[#f5f5f4]" style={{ paddingBottom: "110%" }}>
                            <ArtShape imageUrl={art.imageUrl} title={art.title} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg" />
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#1c1917] truncate mb-0.5">{art.title}</p>
                              <p className="text-[10px] text-gray-400 tracking-wide">
                                {art.medium ? art.medium.toUpperCase() : art.category?.toUpperCase() || "ARTWORK"}
                              </p>
                            </div>
                            {art.forSale && art.price && (
                              <span className="text-[12px] text-[#dc2626] font-semibold whitespace-nowrap flex-shrink-0">
                                NPR {Number(art.price).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => navigate("/upload")}
                    className="absolute -bottom-2 right-0 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white text-2xl flex items-center justify-center shadow-lg shadow-red-200 transition-all duration-150 cursor-pointer border-none z-10"
                    style={{ lineHeight: 1 }}
                  >+</button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 flex flex-col gap-6">

                {/* Recent Uploads */}
                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                  <h2 className="text-[15px] font-semibold text-[#1c1917] mb-3">Recent Uploads</h2>
                  {loading ? (
                    <p className="text-[13px] text-gray-300">Loading…</p>
                  ) : artworks.length === 0 ? (
                    <p className="text-[13px] text-gray-300">No uploads yet.</p>
                  ) : (
                    [...artworks]
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 4)
                      .map((art) => (
                        <div
                          key={art.id}
                          onClick={() => navigate(`/artwork/${art.id}`)}
                          className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 hover:-mx-2 hover:px-2 rounded-lg transition-all duration-150"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center text-sm flex-shrink-0">🎨</div>
                          <div className="min-w-0">
                            <p className="text-[12px] text-[#1c1917] leading-snug mb-0.5">
                              Uploaded <strong className="font-semibold">{art.title}</strong>
                            </p>
                            <p className="text-[10px] text-gray-300 tracking-widest">{formatTime(art.createdAt)}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                {/* Recent Orders */}
                <div className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[15px] font-semibold text-[#1c1917]">Recent Orders</h2>
                    {orders.length > 0 && (
                      <button onClick={() => setActiveTab("Orders")} className="text-[10px] font-bold tracking-widest text-[#dc2626] bg-transparent border-none cursor-pointer">
                        VIEW ALL
                      </button>
                    )}
                  </div>
                  {ordersLoading ? (
                    <p className="text-[13px] text-gray-300">Loading…</p>
                  ) : orders.length === 0 ? (
                    <p className="text-[13px] text-gray-300">No orders yet.</p>
                  ) : (
                    [...orders]
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 4)
                      .map((o) => {
                        const colors = statusColor(o.status);
                        return (
                          <div key={o.id} className="flex items-center justify-between gap-2 py-3 border-b border-gray-50 last:border-b-0">
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-[#1c1917] truncate">{o.artwork?.title || "—"}</p>
                              <p className="text-[10px] text-gray-400">{o.buyer?.name || "—"}</p>
                            </div>
                            <span
                              className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ background: colors.bg, color: colors.text }}
                            >
                              {o.status.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── ORDERS TAB ── */}
        {activeTab === "Orders" && (
          <>
            <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-1">Sales</p>
            <h1 style={{ fontSize: 30 }} className="font-display font-semibold text-[#1c1917] mb-6">
              Incoming Orders
            </h1>

            {ordersMsg && (
              <div style={{ fontSize: 13, marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: ordersMsg.type === "success" ? "#f0fdf4" : "#fef2f2", color: ordersMsg.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${ordersMsg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
                {ordersMsg.text}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Total Earnings", value: `NPR ${totalEarnings.toLocaleString()}`, icon: "💰", accent: "#dc2626" },
                { label: "Pending",        value: orders.filter(o => o.status === "PENDING").length, icon: "⏳", accent: "#b45309" },
                { label: "In Transit",     value: orders.filter(o => o.status === "IN_TRANSIT").length, icon: "🚚", accent: "#1e40af" },
                { label: "Delivered",      value: orders.filter(o => o.status === "DELIVERED").length, icon: "✓", accent: "#166534" },
              ].map((s) => (
                <div key={s.label} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm" style={{ borderTop: `3px solid ${s.accent}` }}>
                  <div className="text-xl mb-3">{s.icon}</div>
                  <p className="tabular-nums text-[22px] font-bold text-[#1c1917]">
                    {ordersLoading ? "—" : s.value}
                  </p>
                  <p className="text-[10px] font-bold tracking-[1.5px] text-gray-400 uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {ordersLoading ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading orders…</p>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
                <p style={{ fontSize: 14, marginBottom: 4 }}>No orders yet.</p>
                <p style={{ fontSize: 12 }}>Orders on your artworks will show up here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {orders.map((order) => {
                  const colors = statusColor(order.status);
                  const isUpdating = updatingOrderId === order.id;
                  return (
                    <div key={order.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#fff" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#f5f5f4" }}>
                          <img
                            src={order.artwork?.imageUrl}
                            alt={order.artwork?.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#1c1917", margin: "0 0 2px" }}>{order.artwork?.title}</p>
                          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                            Buyer: {order.buyer?.name || order.buyer?.email}
                          </p>
                          <p style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, margin: "2px 0 0" }}>
                            NPR {Number(order.pricePaid).toLocaleString()}
                          </p>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
                          padding: "5px 10px", borderRadius: 999, background: colors.bg, color: colors.text, flexShrink: 0,
                        }}>
                          {order.status.replace("_", " ")}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{formatTime(order.createdAt)}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                          {order.status === "PENDING" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "IN_TRANSIT")}
                              disabled={isUpdating}
                              style={{ padding: "7px 14px", background: isUpdating ? "#9ca3af" : "#dc2626", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer" }}
                            >
                              {isUpdating ? "Updating…" : "Mark In Transit"}
                            </button>
                          )}
                          {order.status === "IN_TRANSIT" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                              disabled={isUpdating}
                              style={{ padding: "7px 14px", background: isUpdating ? "#9ca3af" : "#166534", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: isUpdating ? "not-allowed" : "pointer" }}
                            >
                              {isUpdating ? "Updating…" : "Mark Delivered"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── EXHIBITIONS TAB ── */}
        {activeTab === "Exhibitions" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-1">My Exhibitions</p>
                <h1 style={{ fontSize: 30 }} className="font-display font-semibold text-[#1c1917]">
                  Virtual Exhibitions
                </h1>
              </div>
              <button
                onClick={() => { setShowCreateForm(v => !v); setExMsg(null); }}
                className="bg-red-600 text-white text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition cursor-pointer border-none"
              >
                {showCreateForm ? "Cancel" : "+ New Exhibition"}
              </button>
            </div>

            {exMsg && (
              <div style={{ fontSize: 13, marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: exMsg.type === "success" ? "#f0fdf4" : "#fef2f2", color: exMsg.type === "success" ? "#166534" : "#991b1b", border: `1px solid ${exMsg.type === "success" ? "#bbf7d0" : "#fecaca"}` }}>
                {exMsg.text}
              </div>
            )}

            {/* Create Form */}
            {showCreateForm && (
              <div style={{ background: "#faf6f0", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 20px 24px", marginBottom: 28, maxWidth: 640 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "#dc2626", textTransform: "uppercase", marginBottom: 16 }}>New Exhibition</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 5 }}>Title *</label>
                    <input
                      style={inputStyle}
                      placeholder="e.g. Colours of Nepal"
                      value={exForm.title}
                      onChange={e => setExForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 5 }}>Description</label>
                    <textarea
                      style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                      placeholder="Describe your exhibition..."
                      value={exForm.description}
                      onChange={e => setExForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 5 }}>Start Date</label>
                      <input type="date" style={inputStyle} value={exForm.startDate} onChange={e => setExForm(f => ({ ...f, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 5 }}>End Date</label>
                      <input type="date" style={inputStyle} value={exForm.endDate} onChange={e => setExForm(f => ({ ...f, endDate: e.target.value }))} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "block", marginBottom: 8 }}>
                      Select Artworks {selectedArtworkIds.length > 0 && <span style={{ color: "#dc2626" }}>({selectedArtworkIds.length} selected)</span>}
                    </label>
                    {artworks.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>No artworks uploaded yet.</p>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                        {artworks.map(art => {
                          const selected = selectedArtworkIds.includes(art.id);
                          return (
                            <div
                              key={art.id}
                              onClick={() => toggleArtworkSelection(art.id)}
                              style={{
                                cursor: "pointer", borderRadius: 8, overflow: "hidden", position: "relative",
                                border: `2px solid ${selected ? "#dc2626" : "#e5e7eb"}`,
                                transition: "border-color 0.15s",
                              }}
                            >
                              <div style={{ paddingBottom: "100%", position: "relative", background: "#f5f5f4" }}>
                                <img
                                  src={art.imageUrl}
                                  alt={art.title}
                                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                {selected && (
                                  <div style={{ position: "absolute", inset: 0, background: "rgba(139,58,30,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontSize: 20, color: "#fff" }}>✓</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ padding: "5px 6px", background: "#fff" }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: "#1c1917", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{art.title}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCreateExhibition}
                    disabled={exSubmitting}
                    style={{ marginTop: 4, padding: "11px", background: exSubmitting ? "#9ca3af" : "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: exSubmitting ? "not-allowed" : "pointer" }}
                  >
                    {exSubmitting ? "Creating…" : "Create Exhibition"}
                  </button>
                </div>
              </div>
            )}

            {/* Exhibition List */}
            {exLoading ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading exhibitions…</p>
            ) : exhibitions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎭</div>
                <p style={{ fontSize: 14, marginBottom: 4 }}>No exhibitions yet.</p>
                <p style={{ fontSize: 12 }}>Create your first one above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {exhibitions.map(ex => (
                  <div key={ex.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 18, fontWeight: 600, color: "#1c1917", margin: "0 0 4px" }}>{ex.title}</p>
                      {ex.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.description}</p>}
                      {ex.startDate && <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, letterSpacing: "0.5px" }}>{ex.startDate} — {ex.endDate || "ongoing"}</p>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => navigate(`/exhibition/${ex.id}`)}
                        style={{ padding: "7px 14px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteExhibition(ex.id)}
                        style={{ padding: "7px 14px", background: "#fef2f2", color: "#991b1b", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === "Inventory" && (
          <>
            <p className="text-[10px] font-bold tracking-[2px] text-[#dc2626] uppercase mb-3">Inventory</p>
            <div className="flex items-center flex-wrap gap-3 justify-between mb-6">
              <h1 style={{ fontSize: 30 }} className="font-display font-semibold text-[#1c1917]">All Artworks</h1>
              <button
                onClick={() => navigate("/upload")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150 cursor-pointer border-none whitespace-nowrap"
              >
                + Upload Artwork
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: "Total Artworks", value: artworks.length, icon: "🎨" },
                { label: "For Sale",       value: forSaleCount, icon: "🛍" },
                { label: "Total Views",    value: totalViews.toLocaleString(), icon: "👁" },
                { label: "Total Likes",    value: totalLikes.toLocaleString(), icon: "❤️" },
              ].map((s) => (
                <div key={s.label} className="border border-gray-100 rounded-xl p-4 bg-white shadow-sm">
                  <div className="text-xl mb-3">{s.icon}</div>
                  <p className="tabular-nums text-[22px] font-bold text-[#1c1917]">
                    {loading ? "—" : s.value}
                  </p>
                  <p className="text-[10px] font-bold tracking-[1.5px] text-gray-400 uppercase mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <p className="text-[13px] text-gray-300">Loading…</p>
            ) : artworks.length === 0 ? (
              <p className="text-[13px] text-gray-300">No artworks yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {artworks.map(art => (
                  <div key={art.id} onClick={() => navigate(`/artwork/${art.id}`)} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl cursor-pointer hover:shadow-sm transition bg-white">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#f5f5f4] flex-shrink-0">
                      <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-[#1c1917] truncate">{art.title}</p>
                      <p className="text-[11px] text-gray-400">{art.category || art.medium || "Artwork"} · {formatTime(art.createdAt)}</p>
                      <p className="text-[10px] text-gray-300 mt-0.5">👁 {art.viewCount || 0}   ❤️ {art.likeCount || 0}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {art.forSale && art.price
                        ? <p className="text-[13px] font-semibold text-[#dc2626]">NPR {Number(art.price).toLocaleString()}</p>
                        : <p className="text-[11px] text-gray-300">Not for sale</p>}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteArtwork(art.id, art.title); }}
                      disabled={deletingArtworkId === art.id}
                      title="Delete artwork"
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm text-gray-300 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deletingArtworkId === art.id ? "…" : "🗑"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </main>

    </div>
  );
}