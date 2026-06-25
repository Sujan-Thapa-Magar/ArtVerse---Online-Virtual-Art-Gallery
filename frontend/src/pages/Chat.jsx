import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Chat.css";

const API = "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
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

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserAndOpen(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
      // Poll every 5 seconds
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
      if (res.ok) {
        const data = await res.json();
        setPartners(data);
      }
    } catch (err) {
      console.error("Failed to fetch partners", err);
    }
  }

  async function fetchUserAndOpen(uid) {
    try {
      // Fetch messages to get user info
      const res = await fetch(`${API}/api/messages/${uid}`, { headers });
      if (res.ok) {
        const msgs = await res.json();
        setMessages(msgs);
        if (msgs.length > 0) {
          const other = msgs[0].sender.email === currentUser?.sub
            ? msgs[0].receiver
            : msgs[0].sender;
          setSelectedUser(other);
        } else {
          // No messages yet, set a placeholder
          setSelectedUser({ id: parseInt(uid), name: "User" });
        }
      }
    } catch (err) {
      console.error("Failed to open chat", err);
    }
  }

  async function fetchMessages() {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API}/api/messages/${selectedUser.id}`, { headers });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
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
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  }

  function openChat(user) {
    setSelectedUser(user);
    navigate(`/chat/${user.id}`);
  }

  return (
    <div className="chat-page">

      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button className="chat-back-btn" onClick={() => navigate(-1)}>←</button>
          <h2 className="chat-sidebar-title">Messages</h2>
        </div>

        {partners.length === 0 ? (
          <div className="chat-no-partners">
            <p>No conversations yet.</p>
            <p>Message an artist from their artwork page.</p>
          </div>
        ) : (
          <div className="chat-partners-list">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className={`chat-partner-item ${selectedUser?.id === partner.id ? "active" : ""}`}
                onClick={() => openChat(partner)}
              >
                <div className="chat-partner-avatar">
                  {partner.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="chat-partner-info">
                  <p className="chat-partner-name">{partner.name}</p>
                  <p className="chat-partner-role">{partner.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {!selectedUser ? (
          <div className="chat-empty">
            <p>Select a conversation or message an artist from their artwork.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-partner-avatar">
                {selectedUser.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div>
                <p className="chat-header-name">{selectedUser.name}</p>
                <p className="chat-header-role">{selectedUser.role || "ArtVerse User"}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-no-messages">
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender.email === currentUser?.sub;
                  return (
                    <div
                      key={msg.id}
                      className={`chat-message ${isMine ? "mine" : "theirs"}`}
                    >
                      <p className="chat-message-content">{msg.content}</p>
                      <p className="chat-message-time">{formatTime(msg.createdAt)}</p>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-row">
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={sending}
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? "..." : "SEND"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}