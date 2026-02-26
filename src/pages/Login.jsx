import { useState } from "react";
import Login from "../components/Login";
import Register from "../components/Register";

export default function AuthPage() {
    const [mode, setMode] = useState("login"); // "login" | "register"

    return mode === "login" ? (
        <Login onSwitchToRegister={() => setMode("register")} />
    ) : (
        <Register onSwitchToLogin={() => setMode("login")} />
    );
}
