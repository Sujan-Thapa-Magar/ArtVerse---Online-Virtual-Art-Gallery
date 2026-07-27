import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";

const POLL_INTERVAL_MS = 15000;


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

const CATEGORY_COLORS = ["#dc2626", "#1c1917", "#f59e0b", "#3b82f6", "#16a34a", "#8b5cf6", "#ec4899"];

const ORDER_STATUS_CFG = {
  PENDING:    { bg: "#f5f5f4", color: "#78716c", label: "Pending" },
  IN_TRANSIT: { bg: "#fffbeb", color: "#b45309", label: "In Transit" },
  DELIVERED:  { bg: "#f0fdf4", color: "#16a34a", label: "Delivered" },
};

function computeCategoryBreakdown(artworks) {
  const counts = {};
  artworks.forEach((a) => {
    const key = a.category?.trim() || "Uncategorized";
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2 text-[12px]">
      <p className="font-bold text-[#1c1917] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.fill }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.fill }} />
          {p.dataKey === "uploads" ? "Uploads" : "Sales"}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2 text-[12px]">
      <p className="flex items-center gap-1.5 font-semibold text-[#1c1917]">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.payload.fill }} />
        {p.name}: {p.value}
      </p>
    </div>
  );
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
  const [now, setNow] = useState(() => Date.now()); 
  const token = localStorage.getItem("token");

  
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
  const categoryData = computeCategoryBreakdown(artworks);

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

        {/* Recent Orders + Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          {/* Recent Orders */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Recent Orders</h2>
              <span className="text-[10px] font-bold tracking-widest text-gray-400">{orders.length} TOTAL</span>
            </div>

            {loading ? (
              <p className="text-[13px] text-gray-300 text-center py-5">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-[13px] text-gray-300 text-center py-5">No orders yet.</p>
            ) : (
              [...orders]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map((order) => {
                  const s = ORDER_STATUS_CFG[order.status] || ORDER_STATUS_CFG.PENDING;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {getImageUrl(order.artwork?.imageUrl) ? (
                          <img
                            src={getImageUrl(order.artwork.imageUrl)}
                            alt={order.artwork?.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full" style={{ background: "linear-gradient(135deg, #e8e0d5, #d4c090)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#1c1917] truncate">
                          {order.artwork?.title || "Untitled"}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {order.buyer?.name || order.buyer?.email || "Unknown buyer"} · {formatTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-[12px] font-bold text-[#dc2626]">
                          NPR {Number(order.pricePaid || 0).toLocaleString()}
                        </p>
                        <span
                          className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[15px] font-semibold text-[#1c1917]">Category Breakdown</h2>
            </div>

            {loading ? (
              <div className="h-52 flex items-center justify-center text-[13px] text-gray-300">Loading…</div>
            ) : categoryData.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-[13px] text-gray-300">No artworks yet.</div>
            ) : (
              <div className="flex items-center gap-2">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 flex flex-col gap-2 min-w-0">
                  {categoryData.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-[12px] text-gray-600 truncate flex-1">{c.name}</span>
                      <span className="text-[12px] font-bold text-[#1c1917] flex-shrink-0">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 20, right: 8, left: 8, bottom: 0 }} barGap={4}>
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#9ca3af", letterSpacing: 1 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  width={32}
                />
                <Tooltip cursor={{ fill: "#f9fafb" }} content={<ChartTooltip />} />
                <Bar dataKey="uploads" fill="#1c1917" radius={[3, 3, 0, 0]} maxBarSize={22} fillOpacity={0.85}>
                  <LabelList
                    dataKey="uploads"
                    position="top"
                    formatter={(v) => (v > 0 ? v : "")}
                    style={{ fontSize: 10, fontWeight: 700, fill: "#1c1917" }}
                  />
                </Bar>
                <Bar dataKey="sales" fill="#dc2626" radius={[3, 3, 0, 0]} maxBarSize={22} fillOpacity={0.85}>
                  <LabelList
                    dataKey="sales"
                    position="top"
                    formatter={(v) => (v > 0 ? v : "")}
                    style={{ fontSize: 10, fontWeight: 700, fill: "#dc2626" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </main>

    </div>
  );
}