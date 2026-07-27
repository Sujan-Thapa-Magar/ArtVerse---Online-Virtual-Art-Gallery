import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Navbar from "../components/Navbar";

const API = "http://localhost:8080";
function getToken() { return localStorage.getItem("token"); }

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getTypeConfig(type) {
  switch (type) {
    case "LIKE":    return { icon: "♥", bg: "#fef2f2", color: "#dc2626", label: "Likes",    accent: "#dc2626" };
    case "COMMENT": return { icon: "💬", bg: "#f0f7ff", color: "#2563eb", label: "Comments", accent: "#2563eb" };
    case "FOLLOW":  return { icon: "👤", bg: "#f0fdf4", color: "#16a34a", label: "Follows",  accent: "#16a34a" };
    case "ORDER":   return { icon: "🛍️", bg: "#fffbeb", color: "#b45309", label: "Orders",   accent: "#b45309" };
    default:        return { icon: "🔔", bg: "#faf6f0", color: "#78716c", label: "Other",    accent: "#78716c" };
  }
}

function BreakdownTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="bg-white border border-stone-100 rounded-lg shadow-md px-3 py-2 text-[12px] font-semibold text-stone-800">
      {p.name}: {p.value}
    </div>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeFilter, setActiveFilter]   = useState("ALL");
  const [hoveredId, setHoveredId]         = useState(null);
  const [nowTs]                           = useState(() => Date.now());

  const token   = getToken();
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications`, { headers });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function markAllRead() {
    try {
      await fetch(`${API}/api/notifications/mark-read`, { method: "PUT", headers });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  }

  const filters = ["ALL", "LIKE", "COMMENT", "FOLLOW", "ORDER"];
  const filtered = activeFilter === "ALL"
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const stats = {
    LIKE:    notifications.filter(n => n.type === "LIKE").length,
    COMMENT: notifications.filter(n => n.type === "COMMENT").length,
    FOLLOW:  notifications.filter(n => n.type === "FOLLOW").length,
    ORDER:   notifications.filter(n => n.type === "ORDER").length,
  };

  const breakdownData = Object.entries(stats)
    .filter(([, count]) => count > 0)
    .map(([type, value]) => ({ name: getTypeConfig(type).label, type, value }));

  const weekAgo = nowTs - 7 * 24 * 60 * 60 * 1000;
  const thisWeekCount = notifications.filter(n => n.createdAt && new Date(n.createdAt).getTime() >= weekAgo).length;

  return (
    <div className="min-h-screen bg-cream text-stone-900 selection:bg-red-100 selection:text-red-600 pb-24">

      <Navbar active="notifications" />

      {/* Page Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-stone-200/60">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 text-red-600 mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="uppercase tracking-[0.2em] font-bold text-[9px]">Activity Stream</span>
            </div>
            <h1 className="text-stone-900 font-black tracking-tight leading-tight text-4xl">
              Notifications
            </h1>
          </div>

          {unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="text-xs bg-red-600 text-white font-medium px-4 py-2 rounded-xl border-none shadow-sm hover:bg-red-700 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer self-start sm:self-end"
            >
              Mark all as read • {unreadCount}
            </button>
          ) : (
            <span className="text-xs text-stone-400 tracking-wider">All updates read</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">

          {/* ── Main column ── */}
          <div className="lg:col-span-2">

            {/* Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { type: "LIKE",    label: "Likes",    icon: "♥",  bg: "bg-red-50/60 text-red-600 border-red-200/40", shadow: "shadow-red-500/5" },
                { type: "COMMENT", label: "Comments", icon: "💬", bg: "bg-blue-50/60 text-blue-600 border-blue-200/40", shadow: "shadow-blue-500/5" },
                { type: "FOLLOW",  label: "Follows",  icon: "👤", bg: "bg-green-50/60 text-green-600 border-green-200/40", shadow: "shadow-green-500/5" },
                { type: "ORDER",   label: "Orders",   icon: "🛍️", bg: "bg-amber-50/60 text-amber-700 border-amber-200/40", shadow: "shadow-amber-500/5" },
              ].map(s => {
                const isSelected = activeFilter === s.type;
                return (
                  <div
                    key={s.type}
                    onClick={() => setActiveFilter(activeFilter === s.type ? "ALL" : s.type)}
                    className={`border rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 bg-white ${
                      isSelected ? `${s.bg} border-current shadow-lg ${s.shadow} scale-[1.02]` : "border-stone-200/60 hover:border-stone-400 shadow-sm"
                    }`}
                  >
                    <span className="text-xl block mb-1.5">{s.icon}</span>
                    <span className="text-2xl font-black block leading-none mb-1 text-stone-900">
                      {stats[s.type]}
                    </span>
                    <span className={`text-[9px] tracking-widest uppercase font-bold block ${isSelected ? "text-current" : "text-stone-400"}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Segmented Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
              {filters.map(f => {
                const label = f === "LIKE" ? "Likes" : f === "COMMENT" ? "Comments" : f === "FOLLOW" ? "Follows" : f === "ORDER" ? "Orders" : "All Updates";
                const cnt   = f === "ALL" ? notifications.length : notifications.filter(n => n.type === f).length;
                const active = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`border-none py-2 px-4 text-[11px] font-bold tracking-wider cursor-pointer transition-all duration-300 rounded-full flex items-center gap-2 whitespace-nowrap ${
                      active ? "bg-red-600 text-white" : "bg-white text-stone-500 shadow-sm"
                    }`}
                  >
                    {label}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-400"}`}>
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stream Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-6 h-6 rounded-full border-[2px] border-stone-200 border-t-red-600 animate-spin" />
                <p className="text-stone-400 text-xs tracking-widest uppercase font-bold">Fetching stream…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-24 gap-3 text-center bg-white rounded-3xl border border-stone-200/50 p-6 shadow-sm">
                <span className="text-3xl grayscale opacity-30">🔔</span>
                <h3 className="font-bold text-base text-stone-800">Clear Inbox</h3>
                <p className="text-stone-400 text-xs max-w-xs leading-relaxed">No update markers matched your dashboard settings right now.</p>
              </div>
            ) : (
              <div className="flex flex-col bg-white rounded-2xl border border-stone-200/50 shadow-md shadow-stone-900/[0.02] overflow-hidden">
                {filtered.map((n, i) => {
                  const cfg = getTypeConfig(n.type);
                  const isHov = hoveredId === n.id;
                  return (
                    <div
                      key={n.id}
                      onMouseEnter={() => setHoveredId(n.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={`flex items-start sm:items-center gap-4 p-5 transition-all duration-300 relative cursor-pointer ${
                        i < filtered.length - 1 ? "border-b border-stone-100" : ""
                      } ${!n.read ? "bg-cream" : isHov ? "bg-stone-50/50" : "bg-white"}`}
                    >
                      {/* Unread accent strip */}
                      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: cfg.accent }} />}

                      {/* Icon circle */}
                      <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-base border shadow-sm transition-transform duration-300"
                        style={{
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                          borderColor: `${cfg.color}15`,
                          transform: isHov ? "scale(1.05)" : "scale(1)"
                        }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-2">
                        <p className={`text-sm text-stone-800 leading-relaxed ${!n.read ? "font-medium text-stone-950" : "font-light"}`}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2.5 mt-1.5">
                          <span className="text-[10px] text-stone-400">{formatTime(n.createdAt)}</span>
                          {!n.read && (
                            <span className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Type chip */}
                      <span
                        className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border flex-shrink-0 hidden sm:inline-block"
                        style={{ backgroundColor: cfg.bg, color: cfg.color, borderColor: `${cfg.color}20` }}
                      >
                        {n.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">

            {/* This week */}
            <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm p-5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400 mb-2">This Week</p>
              <p className="text-3xl font-black text-stone-900 leading-none mb-1">{thisWeekCount}</p>
              <p className="text-xs text-stone-400">notification{thisWeekCount === 1 ? "" : "s"} in the last 7 days</p>
            </div>

            {/* Activity breakdown */}
            <div className="bg-white rounded-2xl border border-stone-200/50 shadow-sm p-5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-stone-400 mb-3">Activity Breakdown</p>
              {breakdownData.length === 0 ? (
                <p className="text-xs text-stone-300 text-center py-8">No activity yet.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={breakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={2} stroke="none">
                        {breakdownData.map((b) => <Cell key={b.type} fill={getTypeConfig(b.type).accent} />)}
                      </Pie>
                      <Tooltip content={<BreakdownTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 mt-2">
                    {breakdownData.map((b) => (
                      <div key={b.type} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: getTypeConfig(b.type).accent }} />
                        <span className="text-xs text-stone-500 flex-1">{b.name}</span>
                        <span className="text-xs font-bold text-stone-800">{b.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Unread highlight */}
            <div className="bg-red-600 rounded-2xl shadow-sm p-5">
              <p className="text-[9px] font-bold tracking-widest uppercase text-red-100 mb-2">Unread</p>
              <p className="text-3xl font-black text-white leading-none mb-1">{unreadCount}</p>
              <p className="text-xs text-red-100">
                {unreadCount === 0 ? "You're all caught up." : "waiting for your attention"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
