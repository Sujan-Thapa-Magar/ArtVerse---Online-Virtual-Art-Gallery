import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API = "http://localhost:8080";

function getToken() { return localStorage.getItem("token"); }

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

// ── Design tokens updated to match your gallery/profile palette ──────────────────
const C = {
  pageBg:      "#faf6f0",   // slate-50 (consistent with your gallery/home pages)
  sidebar:     "#ffffff",
  sidebarBorder:"#e7e5e4",   // stone-200 border accent
  windowBg:    "#faf6f0",   // stone-50 background look
  headerBg:    "#ffffff",
  border:      "#e7e5e4",   // stone-200 split lines
  text:        "#1c1917",   // stone-900 typography
  textMid:     "#78716c",   // stone-500
  textLight:   "#a8a29e",   // stone-400
  accent:      "#dc2626",   // YOUR SIGNATURE RED ACCENT
  accentHover: "#b91c1c",   // deep red hover state
  accentBg:    "#fef2f2",   // soft red tint background
  myBubble:    "#dc2626",   // active red message bubbles
  myBubbleText:"#ffffff",
  theirBubble: "#ffffff",
  theirBubbleText: "#1c1917",
  inputBg:     "#faf6f0",   // input matching slate background
  activeItem:  "#fef2f2",   // soft red item highlight background
};

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const currentUser = getCurrentUser();

  useEffect(() => { fetchPartners(); }, []);

  useEffect(() => {
    if (userId) fetchUserAndOpen(userId);
  }, [userId]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchPartners() {
    try {
      const res = await fetch(`${API}/api/messages/conversations`, { headers });
      if (res.ok) setPartners(await res.json());
    } catch (err) { console.error(err); }
  }

  async function fetchUserAndOpen(uid) {
    try {
      const res = await fetch(`${API}/api/messages/${uid}`, { headers });
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        if (msgs.length > 0) {
          const other = msgs[0].sender.email === currentUser?.sub ? msgs[0].receiver : msgs[0].sender;
          setSelectedUser(other);
        } else {
          setSelectedUser({ id: parseInt(uid), name: "User" });
        }
      }
    } catch (err) { console.error(err); }
  }

  async function fetchMessages() {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API}/api/messages/${selectedUser.id}`, { headers });
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error(err); }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/messages/${selectedUser.id}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages(prev => [...prev, saved]);
        setNewMessage("");
        fetchPartners();
        inputRef.current?.focus();
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  }

  function openChat(user) {
    setSelectedUser(user);
    navigate(`/chat/${user.id}`);
  }

  // Avatar circle matching your profile navbar brand gradient
  const Avatar = ({ name, size = 42 }) => (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.accent} 0%, #ef4444 100%)`,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, fontFamily: "'Roboto', sans-serif",
      boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
    }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );

  return (
    <div style={{ background: C.pageBg, color: C.text }}>
      <Navbar />
      <div style={{ display: "flex", height: "calc(100vh - 64px)" }}>

      {/* ── Sidebar ── */}
      <div style={{ width: 300, minWidth: 300, background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, display: "flex", flexDirection: "column" }}
        className="hidden sm:flex">

        {/* Sidebar header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 16px", borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: C.accentBg, border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.accent, fontSize: 16, fontWeight: 700 }}
          >←</button>
          <h2 style={{ fontFamily: "'Roboto', sans-serif", fontSize: 22, fontWeight: 600, color: C.text, margin: 0, letterSpacing: "0.03em" }}>
            Messages
          </h2>
        </div>

        {/* Partner list */}
        {partners.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: C.textLight, fontSize: 13, lineHeight: 1.9 }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>💬</div>
            <p style={{ margin: 0 }}>No conversations yet.</p>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>Message an artist from their artwork page.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {partners.map((partner) => {
              const isActive = selectedUser?.id === partner.id;
              return (
                <div
                  key={partner.id}
                  onClick={() => openChat(partner)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", cursor: "pointer",
                    borderBottom: `1px solid ${C.sidebarBorder}`,
                    background: isActive ? C.activeItem : "transparent",
                    borderLeft: isActive ? `3px solid ${C.accent}` : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#faf6f0"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Avatar name={partner.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {partner.name}
                    </p>
                    <p style={{ fontSize: 11, color: C.textLight, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {partner.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chat Window ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.windowBg }}>

        {!selectedUser ? (
          /* Empty state */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>💬</div>
            <p style={{ color: C.textMid, fontSize: 14, textAlign: "center", maxWidth: 260, lineHeight: 1.7 }}>
              Select a conversation or message an artist from their artwork.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: C.headerBg, borderBottom: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <Avatar name={selectedUser.name} size={44} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>{selectedUser.name}</p>
                <p style={{ fontSize: 11, color: C.textLight, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {selectedUser.role || "ArtVerse User"}
                </p>
              </div>
              {/* Online indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 11, color: C.textLight }}>Active</span>
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Date divider */}
              {messages.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 8px" }}>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                  <span style={{ fontSize: 10, color: C.textLight, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Today</span>
                  <div style={{ flex: 1, height: 1, background: C.border }} />
                </div>
              )}

              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: C.textLight, fontSize: 13, marginTop: 60 }}>
                  <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.4 }}>✉️</div>
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender.email === currentUser?.sub;
                  return (
                    <div
                      key={msg.id}
                      style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignSelf: isMine ? "flex-end" : "flex-start", alignItems: isMine ? "flex-end" : "flex-start" }}
                    >
                      <div style={{
                        padding: "10px 16px",
                        borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 14, lineHeight: 1.55, wordBreak: "break-word", margin: "0 0 3px",
                        background: isMine ? C.myBubble : C.theirBubble,
                        color: isMine ? C.myBubbleText : C.theirBubbleText,
                        boxShadow: isMine
                          ? "0 2px 8px rgba(220, 38, 38, 0.15)"
                          : "0 1px 4px rgba(0,0,0,0.07)",
                        border: isMine ? "none" : `1px solid ${C.border}`,
                      }}>
                        {msg.content}
                      </div>
                      <span style={{ fontSize: 10, color: C.textLight, letterSpacing: "0.4px" }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div style={{ display: "flex", gap: 10, padding: "14px 20px", background: C.headerBg, borderTop: `1px solid ${C.border}`, alignItems: "center" }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message…"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={sending}
                style={{
                  flex: 1, padding: "11px 18px", border: `1.5px solid ${C.border}`,
                  borderRadius: 24, fontSize: 14, fontFamily: "'Roboto', sans-serif",
                  color: C.text, outline: "none", background: C.inputBg, transition: "border 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                style={{
                  padding: "11px 24px", borderRadius: 24, border: "none",
                  background: (sending || !newMessage.trim()) ? C.border : C.accent,
                  color: (sending || !newMessage.trim()) ? C.textLight : "#fff",
                  fontSize: 12, fontWeight: 700, letterSpacing: "1px",
                  cursor: (sending || !newMessage.trim()) ? "not-allowed" : "pointer",
                  fontFamily: "'Roboto', sans-serif", transition: "background 0.2s, transform 0.1s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { if (!sending && newMessage.trim()) e.currentTarget.style.background = C.accentHover; }}
                onMouseLeave={e => { if (!sending && newMessage.trim()) e.currentTarget.style.background = C.accent; }}
                onMouseDown={e => { if (!sending && newMessage.trim()) e.currentTarget.style.transform = "scale(0.97)"; }}
                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >
                {sending ? "···" : "SEND ↑"}
              </button>
            </div>
          </>
        )}
      </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}