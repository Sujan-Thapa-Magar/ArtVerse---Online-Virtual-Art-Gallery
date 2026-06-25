import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SuperAdmin.css";

const API = "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", bio: "" });

  const token = getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [usersRes, ordersRes, statsRes] = await Promise.all([
        fetch(`${API}/api/admin/users`, { headers }),
        fetch(`${API}/api/admin/orders`, { headers }),
        fetch(`${API}/api/admin/stats`, { headers }),
      ]);
      if (usersRes.status === 403) { navigate("/home"); return; }
      setUsers(usersRes.ok ? await usersRes.json() : []);
      setOrders(ordersRes.ok ? await ordersRes.json() : []);
      setStats(statsRes.ok ? await statsRes.json() : {});
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id, name) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        alert("User deleted successfully");
      }
    } catch (err) { console.error("Delete failed", err); }
  }

  async function changeRole(id, newRole) {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/role`, {
        method: "PUT", headers, body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) { console.error("Role change failed", err); }
  }

  async function verifyArtist(id, verified) {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}/verify`, {
        method: "PUT", headers, body: JSON.stringify({ verified }),
      });
      if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, isVerified: verified } : u));
    } catch (err) { console.error("Verify failed", err); }
  }

  async function updateOrderStatus(id, status) {
    try {
      const res = await fetch(`${API}/api/admin/orders/${id}/status`, {
        method: "PUT", headers, body: JSON.stringify({ status }),
      });
      if (res.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { console.error("Status update failed", err); }
  }

  function openEdit(user) {
    setEditingUser(user);
    setEditForm({ name: user.name || "", email: user.email || "", bio: user.bio || "" });
  }

  async function saveEdit() {
    try {
      const res = await fetch(`${API}/api/admin/users/${editingUser.id}`, {
        method: "PUT", headers, body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === editingUser.id
          ? { ...u, name: editForm.name, email: editForm.email, bio: editForm.bio }
          : u
        ));
        setEditingUser(null);
        alert("User updated successfully");
      }
    } catch (err) { console.error("Update failed", err); }
  }

  const artists = users.filter(u => u.role === "ARTIST");
  const unverifiedArtists = artists.filter(a => !a.isVerified);

  return (
    <div className="sa-page">

      {/* Sidebar */}
      <div className="sa-sidebar">
        <div className="sa-sidebar-logo">
          <span className="sa-logo-text">ArtVerse</span>
          <span className="sa-logo-badge">ADMIN</span>
        </div>
        {["Dashboard", "Users", "Artists", "Orders"].map((tab) => (
          <button key={tab} className={`sa-sidebar-btn ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "Dashboard" && "📊 "}
            {tab === "Users" && "👥 "}
            {tab === "Artists" && "🎨 "}
            {tab === "Orders" && "🛒 "}
            {tab}
            {tab === "Artists" && unverifiedArtists.length > 0 && (
              <span className="sa-badge">{unverifiedArtists.length}</span>
            )}
          </button>
        ))}
        <button className="sa-sidebar-btn sa-logout" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
          🚪 Logout
        </button>
      </div>

      {/* Main */}
      <div className="sa-main">

        {/* Edit User Modal */}
        {editingUser && (
          <div className="sa-modal-overlay" onClick={() => setEditingUser(null)}>
            <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sa-modal-header">
                <h3>Edit User — {editingUser.name}</h3>
                <button onClick={() => setEditingUser(null)}>✕</button>
              </div>
              <div className="sa-edit-form">
                <div className="sa-edit-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="sa-edit-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="sa-edit-field">
                  <label>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    placeholder="User bio..."
                  />
                </div>
                <div className="sa-edit-actions">
                  <button className="sa-cancel-btn" onClick={() => setEditingUser(null)}>Cancel</button>
                  <button className="sa-save-btn" onClick={saveEdit}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ID Card Modal */}
        {viewingId && (
          <div className="sa-modal-overlay" onClick={() => setViewingId(null)}>
            <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sa-modal-header">
                <h3>ID Card</h3>
                <button onClick={() => setViewingId(null)}>✕</button>
              </div>
              <img src={viewingId} alt="ID Card" className="sa-modal-img" />
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "Dashboard" && (
          <div className="sa-content">
            <h1 className="sa-page-title">Super Admin Dashboard</h1>
            <p className="sa-page-sub">Platform overview and statistics</p>
            <div className="sa-stats-grid">
              {[
                { label: "Total Users", value: stats.totalUsers || 0, icon: "👥", color: "#4a90e2" },
                { label: "Total Artists", value: stats.totalArtists || 0, icon: "🎨", color: "#8B3A1E" },
                { label: "Total Buyers", value: stats.totalBuyers || 0, icon: "🛍", color: "#c4874a" },
                { label: "Total Orders", value: stats.totalOrders || 0, icon: "🛒", color: "#2e9e5b" },
              ].map((stat) => (
                <div key={stat.label} className="sa-stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
                  <span className="sa-stat-icon">{stat.icon}</span>
                  <span className="sa-stat-value">{loading ? "..." : stat.value}</span>
                  <span className="sa-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
            {unverifiedArtists.length > 0 && (
              <div className="sa-alert">
                <span>⚠️ {unverifiedArtists.length} artist{unverifiedArtists.length > 1 ? "s" : ""} waiting for verification</span>
                <button onClick={() => setActiveTab("Artists")}>Review →</button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "Users" && (
          <div className="sa-content">
            <h1 className="sa-page-title">All Users</h1>
            <p className="sa-page-sub">{users.length} total users on the platform</p>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select className="sa-role-select" value={user.role} onChange={(e) => changeRole(user.id, e.target.value)}>
                          <option value="BUYER">BUYER</option>
                          <option value="ARTIST">ARTIST</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>
                        <span className={`sa-verified ${user.isVerified ? "yes" : "no"}`}>
                          {user.isVerified ? "✓ Yes" : "✗ No"}
                        </span>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="sa-action-btns">
                        <button className="sa-edit-btn" onClick={() => openEdit(user)}>Edit</button>
                        <button className="sa-delete-btn" onClick={() => deleteUser(user.id, user.name)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === "Artists" && (
          <div className="sa-content">
            <h1 className="sa-page-title">Artist Verification</h1>
            <p className="sa-page-sub">{artists.length} artists — {unverifiedArtists.length} pending verification</p>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Bio</th>
                    <th>ID Card</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artists.map((artist) => (
                    <tr key={artist.id}>
                      <td>{artist.id}</td>
                      <td>{artist.name}</td>
                      <td>{artist.email}</td>
                      <td>{artist.bio || "—"}</td>
                      <td>
                        {artist.idCardUrl ? (
                          <button className="sa-view-id-btn" onClick={() => setViewingId(artist.idCardUrl)}>View ID</button>
                        ) : (
                          <span style={{ color: "#bbb", fontSize: "12px" }}>Not uploaded</span>
                        )}
                      </td>
                      <td>
                        <span className={`sa-verified ${artist.isVerified ? "yes" : "no"}`}>
                          {artist.isVerified ? "✓ Verified" : "⏳ Pending"}
                        </span>
                      </td>
                      <td className="sa-action-btns">
                        {!artist.isVerified ? (
                          <button className="sa-verify-btn" onClick={() => verifyArtist(artist.id, true)}>Verify</button>
                        ) : (
                          <button className="sa-unverify-btn" onClick={() => verifyArtist(artist.id, false)}>Revoke</button>
                        )}
                        <button className="sa-delete-btn" onClick={() => deleteUser(artist.id, artist.name)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "Orders" && (
          <div className="sa-content">
            <h1 className="sa-page-title">All Orders</h1>
            <p className="sa-page-sub">{orders.length} total orders</p>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Buyer</th>
                    <th>Artwork</th>
                    <th>Artist</th>
                    <th>Price Paid</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.buyer?.name || "—"}</td>
                      <td>{order.artwork?.title || "—"}</td>
                      <td>{order.artwork?.artist?.name || "—"}</td>
                      <td>Rs. {Number(order.pricePaid).toLocaleString()}</td>
                      <td>
                        <span className={`sa-status sa-status-${order.status?.toLowerCase().replace("_", "-")}`}>
                          {order.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</td>
                      <td>
                        <select className="sa-role-select" value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
                          <option value="PENDING">PENDING</option>
                          <option value="IN_TRANSIT">IN TRANSIT</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
