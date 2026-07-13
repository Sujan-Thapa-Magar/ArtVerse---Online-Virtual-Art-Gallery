// Add Google Fonts to index.html:

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

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

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]     = useState("Dashboard");
  const [users, setUsers]             = useState([]);
  const [orders, setOrders]           = useState([]);
  const [stats, setStats]             = useState({});
  const [loading, setLoading]         = useState(true);
  const [viewingId, setViewingId]     = useState(null);
  const [editingUser, setEditingUser] = useState(null);
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

        {/* Top bar */}
        {/* <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 64, zIndex: 40, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
       
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {unverifiedArtists.length > 0 && (
              <span style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "1px solid #fde68a" }}>
                ⚠️ {unverifiedArtists.length} pending
              </span>
            )}
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, #ef4444)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>A</div>
          </div>
        </div> */}

        <div style={{ padding: "28px 32px", maxWidth: 1200 }}>

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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Users",   value: stats.totalUsers   || 0, icon: "👥", accent: "#3b82f6", bg: "#eff6ff" },
                  { label: "Total Artists", value: stats.totalArtists || 0, icon: "🎨", accent: C.accent,  bg: C.accentBg },
                  { label: "Total Buyers",  value: stats.totalBuyers  || 0, icon: "🛍", accent: "#8b5cf6", bg: "#f5f3ff" },
                  { label: "Total Orders",  value: stats.totalOrders  || 0, icon: "🛒", accent: "#16a34a", bg: "#f0fdf4" },
                ].map(s => (
                  <div key={s.label} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", borderTop: `3px solid ${s.accent}` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 38, fontWeight: 700, color: C.text, lineHeight: 1 }}>{loading ? "—" : s.value}</div>
                    <div style={{ fontSize: 11, color: C.textLight, letterSpacing: "1px", textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
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
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, color: C.accent, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px" }}>Management</p>
                <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 34, fontWeight: 600, color: C.text, margin: 0 }}>All Users</h1>
                <p style={{ fontSize: 12, color: C.textLight, margin: "4px 0 0" }}>{users.length} total users on the platform</p>
              </div>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["ID","Name","Email","Role","Verified","Joined","Actions"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td style={{ ...td, color: C.textLight, fontSize: 11 }}>#{user.id}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{user.name}</td>
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
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["ID","Name","Email","Bio","ID Card","Status","Actions"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {artists.map(artist => (
                      <tr key={artist.id}>
                        <td style={{ ...td, color: C.textLight, fontSize: 11 }}>#{artist.id}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{artist.name}</td>
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
                              : <Btn onClick={() => verifyArtist(artist.id, false)} variant="ghost" small>Revoke</Btn>}
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