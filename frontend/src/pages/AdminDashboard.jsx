import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";

// How often the dashboard silently re-fetches live platform data.
const POLL_INTERVAL_MS = 15000;

// Buckets artworks + orders into the last 6 calendar months, for the
// Platform Growth chart — computed from real timestamps, not fixtures.
function computeMonthlyChart(artworks, orders) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      uploads: 0,
      sales: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));

  artworks.forEach((a) => {
    if (!a.createdAt) return;
    const d = new Date(a.createdAt);
    const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`];
    if (bucket) bucket.uploads += 1;
  });
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`];
    if (bucket) bucket.sales += 1;
  });

  return buckets;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [stats, setStats] = useState({
    totalArtworks: 0,
    totalUsers: 0,
    totalListed: 0,
  });
  const [artworks, setArtworks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(() => Date.now()); // ticks each second so "Xs ago" stays fresh, without calling Date.now() during render

  const token = localStorage.getItem("token");

  // `silent` skips the loading spinner — used for background polling so the
  // dashboard doesn't flicker every 15s, only on the very first load.
  const fetchData = useCallback(async (silent = false) => {
    if (!token) { navigate("/login"); return; }
    if (!silent) setLoading(true);
    try {
      const [artRes, orderRes] = await Promise.all([
        fetch("http://localhost:8080/api/artworks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8080/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (artRes.status === 401 || artRes.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }
      const artData = await artRes.json();
      const orderData = orderRes.ok ? await orderRes.json() : [];
      setArtworks(artData);
      setOrders(orderData);

      const totalListed = artData
        .filter((a) => a.forSale && a.price)
        .reduce((sum, a) => sum + Number(a.price), 0);

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
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    fetchData(false);
    const poll = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [fetchData]);

  // Just re-renders once a second so the "Updated Xs ago" label ticks — no network calls.
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
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

  const chartData = computeMonthlyChart(artworks, orders);
  const maxBar = Math.max(1, ...chartData.map((b) => Math.max(b.uploads, b.sales)));

  const secondsAgo = lastUpdated ? Math.floor((now - lastUpdated.getTime()) / 1000) : null;
  const liveLabel =
    secondsAgo === null ? "" : secondsAgo < 2 ? "Updated just now" : `Updated ${secondsAgo}s ago`;

  return (
    <div className="min-h-screen pb-10 bg-cream text-[#1c1917]">

      <Navbar />

      {/* ── Page tabs ── */}

      <div className="sticky top-16 z-20 flex items-center justify-between px-6 md:px-8 h-[52px] bg-cream ">
        <span className="text-base font-bold tracking-wide text-[#1c1917]">
          Admin Panel
        </span>
        <div className="flex items-center gap-1">
          {["Dashboard", "System"].map((tab) => (
            <button
              key={tab}
              onClick={() => tab === "System" ? navigate("/superadmin") : setActiveTab(tab)}
              className={`px-4 py-2 text-[13px] font-medium border-b-2 transition-all duration-200 cursor-pointer bg-transparent ${
                activeTab === tab
                  ? "border-red-600 text-red-600 font-semibold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">

        {/* Alert Banner */}
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
          <span className="relative flex-shrink-0 w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
            <span className="relative block w-2 h-2 rounded-full bg-red-500" />
          </span>
          <span className="flex-1 text-[13px] text-[#1c1917]">
            {loading
              ? "Loading platform data…"
              : `${artworks.length} artworks on platform · ${users.length} registered artists`}
          </span>
          {!loading && liveLabel && (
            <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase whitespace-nowrap">
              🔴 LIVE · {liveLabel}
            </span>
          )}
          <button
            onClick={() => navigate("/gallery")}
            className="text-[11px] font-bold tracking-widest text-[#dc2626] hover:text-[#b91c1c] transition-colors cursor-pointer bg-transparent border-none"
          >
            VIEW ALL
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: "TOTAL LISTED VALUE",
              value: loading ? "—" : `NPR ${stats.totalListed.toLocaleString()}`,
              sub: "All artworks combined",
              subColor: "text-emerald-500",
            },
            {
              label: "TOTAL ARTWORKS",
              value: loading ? "—" : stats.totalArtworks,
              sub: "On platform",
              subColor: "text-gray-400",
            },
            {
              label: "REGISTERED ARTISTS",
              value: loading ? "—" : stats.totalUsers,
              sub: "Active accounts",
              subColor: "text-gray-400",
            },
            {
              label: "FOR SALE",
              value: loading ? "—" : artworks.filter((a) => a.forSale).length,
              sub: "Listed artworks",
              subColor: "text-gray-400",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <p className="text-[10px] font-bold tracking-[1.5px] text-gray-400 uppercase mb-2">
                {card.label}
              </p>
              <p className="font-display text-3xl font-bold text-[#1c1917] mb-1">
                {card.value}
              </p>
              <p className={`text-[11px] ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Two Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Recent Artworks */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Recent Artworks</h2>
              <button
                onClick={() => navigate("/gallery")}
                className="text-[10px] font-bold tracking-widest text-gray-400 hover:text-[#1c1917] transition-colors cursor-pointer bg-transparent border-none"
              >
                VIEW ALL
              </button>
            </div>

            {loading ? (
              <p className="text-[13px] text-gray-300 text-center py-5">Loading…</p>
            ) : artworks.length === 0 ? (
              <p className="text-[13px] text-gray-300 text-center py-5">No artworks yet.</p>
            ) : (
              artworks.slice(0, 4).map((art) => (
                <div
                  key={art.id}
                  onClick={() => navigate(`/artwork/${art.id}`)}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 hover:-mx-2 hover:px-2 rounded-lg transition-all duration-150"
                >
                  <div className="w-13 h-13 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100"
                    style={{ width: 52, height: 52 }}>
                    {getImageUrl(art.imageUrl) ? (
                      <img
                        src={getImageUrl(art.imageUrl)}
                        alt={art.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: "linear-gradient(135deg, #e8e0d5, #d4c090)" }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {art.category && (
                      <span className="inline-block text-[9px] font-bold tracking-wider text-[#dc2626] bg-[#fef2f2] px-2 py-0.5 rounded mb-1">
                        {art.category.toUpperCase()}
                      </span>
                    )}
                    <p className="text-[13px] font-semibold text-[#1c1917] truncate">{art.title}</p>
                    <p className="text-[11px] text-gray-400">
                      By {art.artist?.name || art.artist?.email || "Unknown"} · {formatTime(art.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/artwork/${art.id}`); }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#1c1917] text-white border border-[#1c1917] hover:bg-[#292524] active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Recent Artists */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Recent Artists</h2>
            </div>

            {loading ? (
              <p className="text-[13px] text-gray-300 text-center py-5">Loading…</p>
            ) : users.length === 0 ? (
              <p className="text-[13px] text-gray-300 text-center py-5">No artists yet.</p>
            ) : (
              users.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0"
                >
                  <Avatar
                    name={user.name}
                    email={user.email}
                    photo={user.profilePhoto}
                    size={40}
                    className="text-sm"
                    bgColor="#1c1917"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1c1917] truncate">
                      {user.name || user.email}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>
                  <span className="flex-shrink-0 text-[9px] font-bold tracking-wider text-[#dc2626] bg-[#fef2f2] px-2 py-1 rounded">
                    ARTIST
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Growth Chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Platform Growth</h2>
              <p className="text-[12px] text-gray-400 mt-1">Uploads and sales over the last 6 months.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1c1917] inline-block" />
                UPLOADS
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#dc2626] inline-block" />
                SALES
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-44 flex items-center justify-center text-[13px] text-gray-300">Loading chart…</div>
          ) : chartData.every((b) => b.uploads === 0 && b.sales === 0) ? (
            <div className="h-44 flex items-center justify-center text-[13px] text-gray-300">
              No activity in the last 6 months yet.
            </div>
          ) : (
            <div className="flex items-end gap-2 h-44 pb-6 border-b border-gray-100">
              {chartData.map((b) => (
                <div key={b.key} className="flex-1 flex flex-col items-center gap-1 h-full">
                  <div className="flex-1 w-full flex items-end gap-0.5">
                    <div
                      title={`${b.uploads} upload${b.uploads === 1 ? "" : "s"}`}
                      className="flex-1 rounded-t-sm bg-[#1c1917] opacity-80 transition-all duration-300 min-h-1"
                      style={{ height: `${(b.uploads / maxBar) * 100}%` }}
                    />
                    <div
                      title={`${b.sales} sale${b.sales === 1 ? "" : "s"}`}
                      className="flex-1 rounded-t-sm bg-[#dc2626] opacity-70 transition-all duration-300 min-h-1"
                      style={{ height: `${(b.sales / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-gray-300">{b.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}