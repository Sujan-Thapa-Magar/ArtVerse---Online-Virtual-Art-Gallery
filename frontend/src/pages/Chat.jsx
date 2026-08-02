import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

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

const C = {
  pageBg:      "#faf6f0",   
  sidebar:     "#ffffff",
  sidebarBorder:"#e7e5e4",   
  windowBg:    "#faf6f0",   
  headerBg:    "#ffffff",
  border:      "#e7e5e4",   
  text:        "#1c1917",   
  textMid:     "#78716c",   
  textLight:   "#a8a29e",   
  accent:      "#dc2626",  
  accentHover: "#b91c1c",   
  accentBg:    "#fef2f2",   
  myBubble:    "#dc2626",   
  myBubbleText:"#ffffff",
  theirBubble: "#ffffff",
  theirBubbleText: "#1c1917",
  inputBg:     "#faf6f0",   
  activeItem:  "#fef2f2",  
};


function Avatar({ name, photo, size = 42 }) {
  const [imgError, setImgError] = useState(false);
  const src = photo ? (photo.startsWith("http") ? photo : `${API}/${photo}`) : null;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0,
          objectFit: "cover", boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.accent} 0%, #ef4444 100%)`,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.38, boxShadow: "0 2px 8px rgba(220, 38, 38, 0.2)",
    }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const searchDebounceRef = useRef(null);
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

  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) return;
    searchDebounceRef.current = setTimeout(() => searchUsers(searchQuery.trim()), 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  async function fetchPartners() {
    try {
      const res = await fetch(`${API}/api/messages/conversations`, { headers });
      if (res.ok) setPartners(await res.json());
    } catch (err) { console.error(err); }
  }

  async function searchUsers(q) {
    try {
      const res = await fetch(`${API}/api/users/search?q=${encodeURIComponent(q)}`, { headers });
      if (res.ok) setSearchResults(await res.json());
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
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
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/chat/${user.id}`);
  }

  const showingSearch = searchQuery.trim().length > 0;
  const existingPartnerIds = new Set(partners.map(p => p.id));

  return (
    <div style={{ background: C.pageBg, color: C.text, height: "100vh", overflow: "hidden" }}>
      <div style={{ display: "flex", height: "100%" }}>

      {/* ── Sidebar — on mobile this IS the screen until a conversation is picked ── */}
      <div style={{ background: C.sidebar, borderRight: `1px solid ${C.sidebarBorder}`, flexDirection: "column" }}
        className={selectedUser ? "hidden sm:flex sm:w-[300px] sm:min-w-[300px]" : "flex w-full sm:w-[300px] sm:min-w-[300px]"}>

        {/* Sidebar header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 16px", borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <button
            onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/home"))}
            style={{ background: C.accentBg, border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.accent, fontSize: 16, fontWeight: 700 }}
          >←</button>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0, letterSpacing: "0.03em" }}>
            Messages
          </h2>
        </div>

        {/* Search bar — find anyone to start a new chat with */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.sidebarBorder}` }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.textLight }}>🔍</span>
            <input
              type="text"
              placeholder="Search people to chat…"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                if (!v.trim()) setSearchResults([]);
                else setSearching(true);
              }}
              style={{
                width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 32px",
                border: `1.5px solid ${C.border}`, borderRadius: 20, fontSize: 13,
                color: C.text, outline: "none", background: C.inputBg, transition: "border 0.2s",
              }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.textLight, fontSize: 14, lineHeight: 1 }}
              >✕</button>
            )}
          </div>
        </div>

        {/* Search results */}
        {showingSearch ? (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {searching ? (
              <div style={{ padding: "24px 20px", textAlign: "center", color: C.textLight, fontSize: 12 }}>Searching…</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center", color: C.textLight, fontSize: 13 }}>
                No people found for "{searchQuery.trim()}"
              </div>
            ) : (
              searchResults.map((person) => (
                <div
                  key={person.id}
                  onClick={() => openChat(person)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", cursor: "pointer",
                    borderBottom: `1px solid ${C.sidebarBorder}`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf6f0"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Avatar name={person.name} photo={person.profilePhoto} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {person.name}
                    </p>
                    <p style={{ fontSize: 11, color: C.textLight, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {person.role}
                    </p>
                  </div>
                  {existingPartnerIds.has(person.id) ? (
                    <span style={{ fontSize: 10, color: C.textLight }}>Chatting</span>
                  ) : (
                    <span style={{ fontSize: 10, color: C.accent, fontWeight: 700 }}>+ Chat</span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : partners.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: C.textLight, fontSize: 13, lineHeight: 1.9 }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>💬</div>
            <p style={{ margin: 0 }}>No conversations yet.</p>
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>Search above to find someone to chat with.</p>
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
                  <Avatar name={partner.name} photo={partner.profilePhoto} />
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

      {/* ── Chat Window — on mobile this only appears once a conversation is picked ── */}
      <div style={{ flex: 1, flexDirection: "column", background: C.windowBg, minHeight: 0 }}
        className={selectedUser ? "flex" : "hidden sm:flex"}>

        {!selectedUser ? (
          /* Empty state (sm+ only — mobile shows the list instead) */
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
              <button
                onClick={() => { setSelectedUser(null); navigate("/chat"); }}
                className="sm:hidden"
                style={{ background: C.accentBg, border: "none", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.accent, fontSize: 16, fontWeight: 700, flexShrink: 0 }}
              >←</button>
              <Avatar name={selectedUser.name} photo={selectedUser.profilePhoto} size={44} />
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
                  borderRadius: 24, fontSize: 14, color: C.text, outline: "none", background: C.inputBg, transition: "border 0.2s",
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
                  transition: "background 0.2s, transform 0.1s",
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
        html, body, #root {
          margin: 0;
          padding: 0;
          height: 100%;
        }
        @media (max-width: 640px) {
          .hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}