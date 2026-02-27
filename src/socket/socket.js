import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("token");

  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL|| "http://localhost:8000", {
      withCredentials: false,
      autoConnect: false,
      auth: { token },
    });
  } else {
    socket.auth = { token };
  }

  return socket;
}

export default getSocket;