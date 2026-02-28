import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getUsersAPI, getMessagesAPI, logoutAPI } from "../api/api";
import getSocket from "../socket/socket";
// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function groupByDate(messages) {
  const groups = [];
  let currentDate = null;
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt || new Date().toISOString());
    if (date !== currentDate) {
      groups.push({ type: "date", label: date, key: `date-${msg._id || msg.clientMsgId}` });
      currentDate = date;
    }
    groups.push({ type: "msg", data: msg, key: msg._id || msg.clientMsgId });
  });
  return groups;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Chat() {
  const navigate = useNavigate();
  const me = JSON.parse(localStorage.getItem("user") || "null");

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);

  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);

  // Keep ref in sync for use inside socket callbacks
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // ── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!me) navigate("/");
  }, []);

  // ── Socket setup ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!me) return;

    const socket = getSocket(); // 🔒 socket created with JWT token in auth
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", me.id);
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket auth error:", err.message);
      setConnected(false);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("🔴 Socket disconnected");
    });

    // ── Incoming message from Server ─────────────────────────────────────
    socket.on("receiveMessage", (msg) => {
      const activeUser = selectedUserRef.current;
      if (
        !activeUser ||
        ![msg.sender?.toString(), msg.receiver?.toString()].includes(activeUser._id?.toString())
      ) {
        return;
      }
      setMessages((prev) => {
        if (msg.clientMsgId) {
          const idx = prev.findIndex((m) => m._id === msg.clientMsgId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
        }
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("messageFailed", ({ clientMsgId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === clientMsgId ? { ...m, failed: true } : m))
      );
    });

    socket.on("roomJoined", ({ roomId }) => {
      setCurrentRoom(roomId);
      console.log("🏠 Joined room:", roomId);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("receiveMessage");
      socket.off("messageFailed");
      socket.off("roomJoined");
    };
  }, [me?.id]);

  // ── Fetch users list ────────────────────────────────────────────────────
  useEffect(() => {
    if (!me) return;
    getUsersAPI()
      .then((res) => setUsers(res.data.users || []))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  // ── When a user is selected → join room + load history ─────────────────
  useEffect(() => {
    if (!selectedUser || !me) return;

    setMessages([]);
    setCurrentRoom(null);

    // 1️⃣ Join the Socket.IO room for this conversation
    const socket = getSocket();
    socket.emit("joinRoom", { userId: me.id, receiverId: selectedUser._id });

    // 2️⃣ Load message history from DB
    setLoadingMsgs(true);
    getMessagesAPI(me.id, selectedUser._id)
      .then((res) => {
        setMessages(res.data || []);
        console.log(`📥 Loaded ${res.data?.length || 0} messages from DB`);
      })
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  }, [selectedUser?._id]);

  // ── Auto-scroll to bottom ───────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    if (!text.trim() || !selectedUser || !me) return;

    const socket = getSocket();
    const clientMsgId = `opt_${Date.now()}_${Math.random()}`;

    // Optimistic update — show immediately, marked as pending
    const optimistic = {
      _id: clientMsgId,
      clientMsgId,
      sender: me.id,
      receiver: selectedUser._id,
      message: text.trim(),
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setText("");

    // Emit to server with clientMsgId so server can echo it back
    socket.emit("sendMessage", {
      sender: me.id,
      receiver: selectedUser._id,
      message: optimistic.message,
      clientMsgId,
    });
  }, [text, selectedUser, me]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = async () => {
    try { await logoutAPI(); } catch { /* ignore */ }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!me) return null;

  const grouped = groupByDate(messages);

  return (
    <div className="chat-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">💬</div>
            <span className="sidebar-brand-name">ChatterBox</span>
          </div>
          <div className={`connection-badge ${connected ? "connected" : "disconnected"}`}>
            <span>●</span>
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        <div className="sidebar-search">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              id="sidebar-search"
              className="search-input"
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="sidebar-section-label">All Users</div>

        <div className="user-list">
          {loadingUsers ? (
            <div className="loading-users">
              <span
                className="spinner"
                style={{
                  borderTopColor: "var(--accent-primary)",
                  borderColor: "rgba(99,102,241,0.2)",
                }}
              />
              Loading users…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="loading-users" style={{ color: "var(--text-muted)" }}>
              No users found
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                id={`user-item-${u._id}`}
                key={u._id}
                className={`user-item ${selectedUser?._id === u._id ? "active" : ""}`}
                onClick={() => setSelectedUser(u)}
              >
                <div className="avatar">
                  {getInitials(u.fullName)}
                  <span className="online-dot" />
                </div>
                <div className="user-info">
                  <div className="user-name">{u.fullName}</div>
                  <div className="user-email">{u.email}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <div className="me-card">
            <div
              className="avatar avatar-sm"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              {getInitials(me.fullName)}
            </div>
            <div className="me-info">
              <div className="me-name">{me.fullName}</div>
              <div className="me-status">● Online</div>
            </div>
            <button
              id="logout-btn"
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <span className="logout-icon">🚪</span>
              <span className="logout-label">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Chat ── */}
      {!selectedUser ? (
        <div className="chat-main no-chat-selected">
          <div className="no-chat-icon">💬</div>
          <h2>Select a conversation</h2>
          <p>Pick a user from the sidebar to start chatting in real time</p>
        </div>
      ) : (
        <div className="chat-main">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-user">
              <div className="avatar">{getInitials(selectedUser.fullName)}</div>
              <div className="chat-header-info">
                <div className="chat-header-name">{selectedUser.fullName}</div>
                <div className="chat-status">
                  <span className="status-dot" />
                  <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {currentRoom ? `Room: ${currentRoom}` : "Joining room…"}
                  </span>
                </div>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="btn btn-icon" title="Info">ℹ️</button>
            </div>
          </div>

          {/* Messages */}
          <div className="messages-area" id="messages-area">
            {loadingMsgs ? (
              <div className="empty-chat">
                <span
                  className="spinner"
                  style={{
                    width: 32,
                    height: 32,
                    borderWidth: 3,
                    borderTopColor: "var(--accent-primary)",
                    borderColor: "rgba(99,102,241,0.15)",
                  }}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-chat">
                <div className="empty-chat-icon">👋</div>
                <h3>Say hello!</h3>
                <p>No messages yet. Start the conversation below.</p>
              </div>
            ) : (
              grouped.map((item) =>
                item.type === "date" ? (
                  <div key={item.key} className="date-separator">
                    {item.label}
                  </div>
                ) : (
                  <MessageBubble
                    key={item.key}
                    msg={item.data}
                    isSent={
                      item.data.sender === me.id ||
                      item.data.sender?.toString() === me.id
                    }
                    receiverName={selectedUser.fullName}
                  />
                )
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-row">
              <textarea
                id="message-input"
                className="message-input"
                placeholder={`Message ${selectedUser.fullName}…`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                id="send-btn"
                className="send-btn"
                onClick={sendMessage}
                disabled={!text.trim()}
                title="Send message"
              >
                ➤
              </button>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginTop: 6,
                paddingLeft: 4,
              }}
            >
              Press Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isSent, receiverName }) {
  return (
    <div className={`msg-row ${isSent ? "sent" : "received"}`}>
      {!isSent && (
        <div
          className="avatar"
          style={{ width: 30, height: 30, fontSize: 12, flexShrink: 0 }}
        >
          {getInitials(receiverName)}
        </div>
      )}
      <div
        className={`msg-bubble ${isSent ? "sent" : "received"}`}
        style={msg.failed ? { opacity: 0.5, border: "1px solid red" } : {}}
      >
        {msg.message}
        <span className="msg-time">
          {msg.pending && !msg.failed ? "⏳ " : ""}
          {msg.failed ? "❌ Failed" : formatTime(msg.createdAt)}
        </span>
      </div>
      {isSent && <div className="msg-avatar-spacer" />}
    </div>
  );
}