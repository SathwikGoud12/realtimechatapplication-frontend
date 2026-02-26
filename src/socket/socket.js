import { io } from "socket.io-client";

// Create a function to get socket with current token
// We create the socket lazily so it picks up the token after login
let socket = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  if (!socket) {
    socket = io("http://localhost:8000", {
      withCredentials: false,
      autoConnect: false,
      auth: { token }, // 🔒 JWT token sent in Socket.IO handshake
    });
  } else {
    // Update auth token (e.g., after re-login)
    socket.auth = { token };
  }

  return socket;
}

export default getSocket;