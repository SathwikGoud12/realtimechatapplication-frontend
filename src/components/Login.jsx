import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAPI } from "../api/api";

export default function Login({ onSwitchToRegister }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.email || !form.password) {
            setError("Please fill in all fields.");
            return;
        }
        setLoading(true);
        try {
            const res = await loginAPI(form);
            const { accessToken, user } = res.data;
            localStorage.setItem("token", accessToken);
            localStorage.setItem("user", JSON.stringify(user));
            navigate("/chat");
        } catch (err) {
            setError(err?.response?.data?.message || "Login failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">💬</div>
                    <span className="auth-logo-text">ChatterBox</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to continue to your chats</p>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} id="login-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-email">
                            Email address
                        </label>
                        <input
                            id="login-email"
                            className="form-input"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">
                            Password
                        </label>
                        <input
                            id="login-password"
                            className="form-input"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: "8px" }}
                    >
                        {loading ? <span className="spinner" /> : "Sign In →"}
                    </button>
                </form>

                <div className="auth-switch">
                    Don't have an account?{" "}
                    <a onClick={onSwitchToRegister} role="button">
                        Create one
                    </a>
                </div>
            </div>
        </div>
    );
}
