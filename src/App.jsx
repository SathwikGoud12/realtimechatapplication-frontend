import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/Login.jsx";
import Chat from "./pages/Chat.jsx";

// Decode a JWT payload without any library (base64 decode the middle part)
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // convert to ms
  } catch {
    return null;
  }
}

// Protected route — redirects to / if token is missing or already expired
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/" replace />;

  const expiry = getTokenExpiry(token);
  if (expiry && Date.now() >= expiry) {
    // Token is expired — clear it so the user goes to login fresh
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route
        path="/chat"
        element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;