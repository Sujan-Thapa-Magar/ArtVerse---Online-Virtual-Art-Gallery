// Add Google Fonts to index.html:

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import Navbar from "../components/Navbar";
import Avatar from "../components/Avatar";

const API = "http://localhost:8080";
function getToken() { return localStorage.getItem("token"); }

const C = {
  pageBg:    "#faf6f0",
  white:     "#ffffff",
  border:    "#ede9e3",
  text:      "#1c1917",
  textMid:   "#78716c",
  textLight: "#a8a29e",
  accent:    "#dc2626",
  accentBg:  "#fef2f2",
  sidebar:   "#1c1917",
  sidebarBorder: "rgba(255,255,255,0.08)",
  sidebarText:   "#a8a29e",
  sidebarActive: "rgba(220,38,38,0.18)",
};

const statusCfg = {
  PENDING:    { bg: "#f5f5f3", color: "#78716c", label: "Pending" },
  IN_TRANSIT: { bg: "#fffbeb", color: "#b45309", label: "In Transit" },
  DELIVERED:  { bg: "#f0fdf4", color: "#16a34a", label: "Delivered" },
};

const ROLE_COLORS = { BUYER: "#3b82f6", ARTIST: "#dc2626", ADMIN: "#8b5cf6" };

function computeRoleBreakdown(users) {
  const counts = { BUYER: 0, ARTIST: 0, ADMIN: 0 };
  users.forEach((u) => { if (counts[u.role] !== undefined) counts[u.role] += 1; });
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
}

function RolePieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div style={{ background: "#fff", border: "1px solid #ede9e3", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#1c1917" }}>
      {p.name}: {p.value}
    </div>
  );
}

const STATUS_COLORS = { PENDING: "#78716c", IN_TRANSIT: "#f59e0b", DELIVERED: "#16a34a" };

function computeOrderStatusBreakdown(orders) {
  const counts = { PENDING: 0, IN_TRANSIT: 0, DELIVERED: 0 };
  orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status] += 1; });
  return Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));
}

function computeRevenueTrend(orders) {
  const now = new Date();
  const buckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      revenue: 0,
      orders: 0,
    });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  orders.forEach((o) => {
    if (!o.createdAt) return;
    const d = new Date(o.createdAt);
    const bucket = byKey[`${d.getFullYear()}-${d.getMonth()}`];
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += Number(o.pricePaid || 0);
    }
  });
  return buckets;
}

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const revenue = payload.find((p) => p.dataKey === "revenue");
  const ordersCount = payload.find((p) => p.dataKey === "orders");
  return (
    <div style={{ background: "#fff", border: "1px solid #ede9e3", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", padding: "8px 12px", fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: "#1c1917", margin: "0 0 4px" }}>{label}</p>
      {revenue && <p style={{ margin: 0, color: "#dc2626", fontWeight: 600 }}>Revenue: Rs. {revenue.value.toLocaleString()}</p>}
      {ordersCount && <p style={{ margin: 0, color: "#78716c" }}>Orders: {ordersCount.value}</p>}
    </div>
  );
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState("Dashboard");
  const [users, setUsers]             = useState([]);
  const [orders, setOrders]           = useState([]);
  const [stats, setStats]             = useState({});
  const [loading, setLoading]         = useState(true);
  const [viewingId, setViewingId]     = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch]   = useState("");
  const [editForm, setEditForm]       = useState({ name: "", email: "", bio: "", password: "" });

  const token   = getToken();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [uR, oR, sR] = await Promise.all([
        fetch(`${API}/api/admin/users`,  { headers }),
        fetch(`${API}/api/admin/orders`, { headers }),
        fetch(`${API}/api/admin/stats`,  { headers }),
      ]);
      if (uR.status === 403) { navigate("/home"); return; }
      setUsers(uR.ok  ? await uR.json() : []);
      setOrders(oR.ok ? await oR.json() : []);
      setStats(sR.ok  ? await sR.json() : {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function deleteUser(id, name) {
    if (!confirm(`Delete ${name}?`)) return;
    const res = await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE", headers });
    if (res.ok) setUsers(p => p.filter(u => u.id !== id));
  }

  async function changeRole(id, role) {
    const res = await fetch(`${API}/api/admin/users/${id}/role`, { method: "PUT", headers, body: JSON.stringify({ role }) });
    if (res.ok) setUsers(p => p.map(u => u.id === id ? { ...u, role } : u));
  }

  async function verifyArtist(id, verified) {
    const res = await fetch(`${API}/api/admin/users/${id}/verify`, { method: "PUT", headers, body: JSON.stringify({ verified }) });
    if (res.ok) setUsers(p => p.map(u => u.id === id ? { ...u, isVerified: verified } : u));
  }

  function revokeArtist(id, name) {
    if (!confirm(`Revoke verification for ${name}? They will lose their verified artist badge.`)) return;
    verifyArtist(id, false);
  }

  async function updateOrderStatus(id, status) {
    const res = await fetch(`${API}/api/admin/orders/${id}/status`, { method: "PUT", headers, body: JSON.stringify({ status }) });
    if (res.ok) setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
  }

  function openEdit(user) {
    setEditingUser(user);
    setEditForm({ name: user.name || "", email: user.email || "", bio: user.bio || "", password: "" });
  }

  async function saveEdit() {
    const res = await fetch(`${API}/api/admin/users/${editingUser.id}`, { method: "PUT", headers, body: JSON.stringify(editForm) });
    if (res.ok) {
      // Don't keep the plaintext password around in local state — only
      // merge the non-sensitive fields back into the table.
      const { password, ...rest } = editForm;
      setUsers(p => p.map(u => u.id === editingUser.id ? { ...u, ...rest } : u));
      setEditingUser(null);
    }
  }

  const artists           = users.filter(u => u.role === "ARTIST");
  const unverifiedArtists = artists.filter(a => !a.isVerified);
  const roleData          = computeRoleBreakdown(users);
  const orderStatusData   = computeOrderStatusBreakdown(orders);
  const revenueTrend      = computeRevenueTrend(orders);

  const totalRevenue   = orders.reduce((sum, o) => sum + Number(o.pricePaid || 0), 0);
  const avgOrderValue  = orders.length ? totalRevenue / orders.length : 0;
  const pendingOrders  = orders.filter(o => o.status === "PENDING").length;
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;

  const filteredUsers = userSearch.trim()
    ? users.filter(u =>
        (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const tabs = [
    { key: "Dashboard", icon: "📊" },
    { key: "Users",     icon: "👥" },
    { key: "Artists",   icon: "🎨", badge: unverifiedArtists.length },
    { key: "Orders",    icon: "🛒" },
  ];

  // ── Shared table styles ─────────────────────────────────────────
  const th = { padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: C.textLight, background: C.pageBg, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" };
  const td = { padding: "13px 16px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" };

  const Btn = ({ children, onClick, variant = "primary", small }) => {
    const base = { border: "none", borderRadius: 6, fontSize: small ? 11 : 12, fontWeight: 700, cursor: "pointer", padding: small ? "5px 12px" : "8px 18px", fontFamily: "'Roboto', sans-serif", transition: "all 0.18s", letterSpacing: "0.3px" };
    const variants = {
      primary:  { background: C.accent,    color: "#fff" },
      danger:   { background: "none",      color: "#dc2626", border: "1px solid #dc2626" },
      success:  { background: "#16a34a",   color: "#fff" },
      ghost:    { background: "none",      color: C.textMid, border: `1px solid ${C.border}` },
      blue:     { background: "#3b82f6",   color: "#fff" },
      warn:     { background: "#f59e0b",   color: "#fff" },
    };
    return <button onClick={onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, color: C.text }}>
      <style>{`
        select { appearance: none; -webkit-appearance: none; }
        tr:hover td { background: #faf6f0 !important; }
        @media (max-width: 768px) { .sa-sidebar { display: none !important; } }
      `}</style>

      <Navbar />

      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>

      {/* ── Sidebar ── */}
      <div className="sa-sidebar" style={{ width: 220, minWidth: 220, background: C.sidebar, display: "flex", flexDirection: "column", padding: "0 0 24px", position: "sticky", top: 64, height: "calc(100vh - 64px)", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${C.sidebarBorder}`, marginBottom: 12 }}>
          <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 20, fontWeight: 700, color: "#fef2f2", letterSpacing: "2px" }}>ArtVerse</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "2.5px", color: C.accent, textTransform: "uppercase", marginTop: 3 }}>Admin Panel</div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1 }}>
          {tabs.map(t => {
            const active = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                width: "100%", background: active ? C.sidebarActive : "none",
                border: "none", borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent",
                color: active ? "#fef2f2" : C.sidebarText,
                fontSize: 13, fontWeight: active ? 600 : 400,
                padding: "13px 20px", textAlign: "left", cursor: "pointer",
                fontFamily: "'Roboto', sans-serif", transition: "all 0.18s",
                display: "flex", alignItems: "center", gap: 10,
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "#fef2f2"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.sidebarText; e.currentTarget.style.background = "none"; } }}
              >
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                {t.key}
                {t.badge > 0 && (
                  <span style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>{t.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}
          style={{ background: "none", border: "none", color: "#f87171", fontSize: 13, padding: "12px 20px", textAlign: "left", cursor: "pointer", fontFamily: "'Roboto', sans-serif", display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${C.sidebarBorder}` }}
        >🚪 Logout</button>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>



        <div style={{ padding: "28px 40px", width: "100%", boxSizing: "border-box" }}>

          {/* ── Edit Modal ── */}
          {editingUser && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(3px)" }} onClick={() => setEditingUser(null)}>
              <div style={{ background: C.white, borderRadius: 16, padding: 28, width: 460, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h3 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 22, fontWeight: 600, margin: 0 }}>Edit User</h3>
                  <button onClick={() => setEditingUser(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textLight }}>✕</button>
                </div>
                {[["Full Name","text","name"],["Email","email","email"]].map(([label,type,key]) => (
                  <div key={key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: C.textLight, display: "block", marginBottom: 6 }}>{label}</label>
                    <input type={type} value={editForm[key]} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                      style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Roboto', sans-serif", color: C.text, outline: "none", boxSizing: "border-box" }}
                      onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: C.textLight, display: "block", marginBottom: 6 }}>Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} rows={3} placeholder="User bio..."
                    style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Roboto', sans-serif", color: C.text, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: C.textLight, display: "block", marginBottom: 6 }}>Reset Password</label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="Leave blank to keep current password"
                    style={{ width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Roboto', sans-serif", color: C.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = C.accent} onBlur={e => e.target.style.borderColor = C.border}
                  />
                  <p style={{ fontSize: 11, color: C.textLight, margin: "6px 0 0" }}>At least 6 characters if set.</p>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Btn onClick={() => setEditingUser(null)} variant="ghost">Cancel</Btn>
                  <Btn onClick={saveEdit}>Save Changes</Btn>
                </div>
              </div>
            </div>
          )}

          {/* ── ID Card Modal ── */}
          {viewingId && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setViewingId(null)}>
              <div style={{ background: C.white, borderRadius: 16, padding: 24, maxWidth: 500, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 20, fontWeight: 600, margin: 0 }}>ID Card</h3>
                  <button onClick={() => setViewingId(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textLight }}>✕</button>
                </div>
                <img src={viewingId} alt="ID" style={{ width: "100%", borderRadius: 8, objectFit: "contain", maxHeight: 400 }} />
              </div>
            </div>
          )}

          {/* ── Dashboard Tab ── */}
          {activeTab === "Dashboard" && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>Overview</p>
                <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 34, fontWeight: 600, color: C.text, margin: 0 }}>Admin Dashboard</h1>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Users",    value: stats.totalUsers   || 0, icon: "👥", accent: "#3b82f6", bg: "#eff6ff" },
                  { label: "Total Artists",  value: stats.totalArtists || 0, icon: "🎨", accent: C.accent,  bg: C.accentBg },
                  { label: "Total Buyers",   value: stats.totalBuyers  || 0, icon: "🛍", accent: "#8b5cf6", bg: "#f5f3ff" },
                  { label: "Total Orders",   value: stats.totalOrders  || 0, icon: "🛒", accent: "#16a34a", bg: "#f0fdf4" },
                  { label: "Total Revenue",  value: loading ? 0 : `Rs. ${totalRevenue.toLocaleString()}`, icon: "💰", accent: "#f59e0b", bg: "#fffbeb" },
                  { label: "Avg Order Value", value: loading ? 0 : `Rs. ${Math.round(avgOrderValue).toLocaleString()}`, icon: "📈", accent: "#0891b2", bg: "#ecfeff" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${s.accent}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
                    <div style={{ fontSize: 11, color: C.textLight, letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Role breakdown + Order status + Recent orders */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>

                {/* Role breakdown donut */}
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>User Role Breakdown</h3>
                  {loading || roleData.length === 0 ? (
                    <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textLight }}>
                      {loading ? "Loading…" : "No users yet."}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={64} paddingAngle={2} stroke="none">
                            {roleData.map((r) => <Cell key={r.name} fill={ROLE_COLORS[r.name]} />)}
                          </Pie>
                          <Tooltip content={<RolePieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                        {roleData.map((r) => (
                          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: ROLE_COLORS[r.name], flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: C.textMid, flex: 1 }}>{r.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order status donut */}
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 12px" }}>Order Status Breakdown</h3>
                  {loading || orderStatusData.length === 0 ? (
                    <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textLight }}>
                      {loading ? "Loading…" : "No orders yet."}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={64} paddingAngle={2} stroke="none">
                            {orderStatusData.map((r) => <Cell key={r.name} fill={STATUS_COLORS[r.name]} />)}
                          </Pie>
                          <Tooltip content={<RolePieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                        {orderStatusData.map((r) => (
                          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: STATUS_COLORS[r.name], flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: C.textMid, flex: 1 }}>{(statusCfg[r.name] || {}).label || r.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent orders preview */}
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Recent Orders</h3>
                    <button onClick={() => setActiveTab("Orders")} style={{ background: "none", border: "none", fontSize: 11, fontWeight: 700, color: C.accent, cursor: "pointer" }}>View all →</button>
                  </div>
                  {loading || orders.length === 0 ? (
                    <div style={{ height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textLight }}>
                      {loading ? "Loading…" : "No orders yet."}
                    </div>
                  ) : (
                    [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4).map((o) => {
                      const s = statusCfg[o.status] || statusCfg.PENDING;
                      return (
                        <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.artwork?.title || "—"}</p>
                            <p style={{ fontSize: 11, color: C.textLight, margin: "2px 0 0" }}>{o.buyer?.name || "—"}</p>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0, marginLeft: 8 }}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Revenue trend chart */}
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>Revenue &amp; Orders Trend</h3>
                    <p style={{ fontSize: 12, color: C.textLight, margin: "2px 0 0" }}>Last 6 months</p>
                  </div>
                </div>
                {loading || revenueTrend.every(b => b.revenue === 0 && b.orders === 0) ? (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.textLight }}>
                    {loading ? "Loading…" : "No order activity in the last 6 months yet."}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={revenueTrend} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#a8a29e", letterSpacing: 1 }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "#a8a29e" }} width={36} />
                      <Tooltip content={<RevenueTooltip />} cursor={{ fill: "#faf6f0" }} />
                      <Bar dataKey="revenue" fill={C.accent} radius={[3, 3, 0, 0]} maxBarSize={28} fillOpacity={0.85}>
                        <LabelList dataKey="revenue" position="top" formatter={(v) => (v > 0 ? `Rs.${v.toLocaleString()}` : "")} style={{ fontSize: 9, fontWeight: 700, fill: C.accent }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Alert */}
              {unverifiedArtists.length > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#92400e", fontWeight: 500 }}>⚠️ &nbsp;{unverifiedArtists.length} artist{unverifiedArtists.length > 1 ? "s" : ""} waiting for verification</span>
                  <Btn onClick={() => setActiveTab("Artists")} variant="warn" small>Review →</Btn>
                </div>
              )}
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === "Users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>Management</p>
                  <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 34, fontWeight: 600, color: C.text, margin: 0 }}>All Users</h1>
                  <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>
                    {filteredUsers.length === users.length ? `${users.length} total users on the platform` : `${filteredUsers.length} of ${users.length} users`}
                  </p>
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  style={{ padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Roboto', sans-serif", color: C.text, outline: "none", width: 260, background: C.white }}
                  onFocus={e => e.target.style.borderColor = C.accent}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Users",   value: users.length, icon: "👥", accent: "#3b82f6", bg: "#eff6ff" },
                  { label: "Artists",       value: artists.length, icon: "🎨", accent: C.accent,  bg: C.accentBg },
                  { label: "Buyers",        value: users.filter(u => u.role === "BUYER").length, icon: "🛍", accent: "#8b5cf6", bg: "#f5f3ff" },
                  { label: "Admins",        value: users.filter(u => u.role === "ADMIN").length, icon: "⚙️", accent: "#0891b2", bg: "#ecfeff" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${s.accent}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
                    <div style={{ fontSize: 11, color: C.textLight, letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["ID","User","Email","Role","Verified","Joined","Actions"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: C.textLight, padding: "28px 16px" }}>No users match "{userSearch}".</td></tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td style={{ ...td, color: C.textLight, fontSize: 11 }}>#{user.id}</td>
                        <td style={td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={user.name} email={user.email} photo={user.profilePhoto} size={32} bgColor="#1c1917" />
                            <span style={{ fontWeight: 600 }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ ...td, color: C.textMid }}>{user.email}</td>
                        <td style={td}>
                          <select value={user.role} onChange={e => changeRole(user.id, e.target.value)}
                            style={{ padding: "5px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontFamily: "'Roboto', sans-serif", color: C.text, background: C.pageBg, cursor: "pointer" }}>
                            {["BUYER","ARTIST","ADMIN"].map(r => <option key={r}>{r}</option>)}
                          </select>
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: user.isVerified ? "#f0fdf4" : "#fef9ec", color: user.isVerified ? "#16a34a" : "#b45309" }}>
                            {user.isVerified ? "✓ Verified" : "Pending"}
                          </span>
                        </td>
                        <td style={{ ...td, color: C.textLight, fontSize: 11 }}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                        <td style={td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Btn onClick={() => openEdit(user)} small>Edit</Btn>
                            <Btn onClick={() => deleteUser(user.id, user.name)} variant="danger" small>Delete</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Artists Tab ── */}
          {activeTab === "Artists" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>Verification</p>
                <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 34, fontWeight: 600, color: C.text, margin: 0 }}>Artist Verification</h1>
                <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>{artists.length} artists — {unverifiedArtists.length} pending</p>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Artists",    value: artists.length, icon: "🎨", accent: C.accent,  bg: C.accentBg },
                  { label: "Verified",         value: artists.length - unverifiedArtists.length, icon: "✓", accent: "#16a34a", bg: "#f0fdf4" },
                  { label: "Pending Review",   value: unverifiedArtists.length, icon: "⏳", accent: "#f59e0b", bg: "#fffbeb" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${s.accent}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 32, fontWeight: 700, color: C.text, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
                    <div style={{ fontSize: 11, color: C.textLight, letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["ID","Artist","Email","Bio","ID Card","Status","Actions"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {artists.map(artist => (
                      <tr key={artist.id}>
                        <td style={{ ...td, color: C.textLight, fontSize: 11 }}>#{artist.id}</td>
                        <td style={td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={artist.name} email={artist.email} photo={artist.profilePhoto} size={32} bgColor={C.accent} />
                            <span style={{ fontWeight: 600 }}>{artist.name}</span>
                          </div>
                        </td>
                        <td style={{ ...td, color: C.textMid }}>{artist.email}</td>
                        <td style={{ ...td, color: C.textMid, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{artist.bio || "—"}</td>
                        <td style={td}>
                          {artist.idCardUrl
                            ? <Btn onClick={() => setViewingId(artist.idCardUrl)} variant="blue" small>View ID</Btn>
                            : <span style={{ color: C.textLight, fontSize: 11 }}>Not uploaded</span>}
                        </td>
                        <td style={td}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: artist.isVerified ? "#f0fdf4" : "#fffbeb", color: artist.isVerified ? "#16a34a" : "#b45309" }}>
                            {artist.isVerified ? "✓ Verified" : "⏳ Pending"}
                          </span>
                        </td>
                        <td style={td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {!artist.isVerified
                              ? <Btn onClick={() => verifyArtist(artist.id, true)} variant="success" small>Verify</Btn>
                              : <Btn onClick={() => revokeArtist(artist.id, artist.name)} variant="ghost" small>Revoke</Btn>}
                            <Btn onClick={() => deleteUser(artist.id, artist.name)} variant="danger" small>Delete</Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Orders Tab ── */}
          {activeTab === "Orders" && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>Transactions</p>
                <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 34, fontWeight: 600, color: C.text, margin: 0 }}>All Orders</h1>
                <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>{orders.length} total orders</p>
              </div>

              {/* Stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Revenue",  value: `Rs. ${totalRevenue.toLocaleString()}`, icon: "💰", accent: "#f59e0b", bg: "#fffbeb" },
                  { label: "Pending",        value: pendingOrders,   icon: "⏳", accent: "#78716c", bg: "#f5f5f4" },
                  { label: "Delivered",      value: deliveredOrders, icon: "✓",  accent: "#16a34a", bg: "#f0fdf4" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${s.accent}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
                    <div style={{ fontSize: 11, color: C.textLight, letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["ID","Buyer","Artwork","Artist","Price Paid","Status","Date","Update"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {orders.map(order => {
                      const s = statusCfg[order.status] || statusCfg.PENDING;
                      return (
                        <tr key={order.id}>
                          <td style={{ ...td, color: C.textLight, fontSize: 11 }}>#{order.id}</td>
                          <td style={{ ...td, fontWeight: 600 }}>{order.buyer?.name || "—"}</td>
                          <td style={td}>{order.artwork?.title || "—"}</td>
                          <td style={{ ...td, color: C.textMid }}>{order.artwork?.artist?.name || "—"}</td>
                          <td style={{ ...td, fontWeight: 600, color: C.accent }}>Rs. {Number(order.pricePaid).toLocaleString()}</td>
                          <td style={td}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
                              {s.label}
                            </span>
                          </td>
                          <td style={{ ...td, color: C.textLight, fontSize: 11 }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>
                          <td style={td}>
                            <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)}
                              style={{ padding: "5px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, fontFamily: "'Roboto', sans-serif", color: C.text, background: C.pageBg, cursor: "pointer" }}>
                              <option value="PENDING">Pending</option>
                              <option value="IN_TRANSIT">In Transit</option>
                              <option value="DELIVERED">Delivered</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  );
}