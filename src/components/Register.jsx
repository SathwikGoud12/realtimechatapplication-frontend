import { useState } from "react";
import { registerAPI } from "../api/api";

export default function Register({ onSwitchToLogin }) {
    const [form, setForm] = useState({ fullName: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!form.fullName || !form.email || !form.password) {
            setError("Please fill in all fields.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        setLoading(true);
        try {
            await registerAPI(form);
            setSuccess("Account created! You can now sign in.");
            setTimeout(() => onSwitchToLogin(), 1500);
        } catch (err) {
            setError(err?.response?.data?.message || "Registration failed. Try again.");
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

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Join ChatterBox and start chatting</p>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span> {error}
                    </div>
                )}
                {success && (
                    <div className="alert alert-success">
                        <span>✅</span> {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} id="register-form">
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-fullname">
                            Full Name
                        </label>
                        <input
                            id="reg-fullname"
                            className="form-input"
                            type="text"
                            name="fullName"
                            placeholder="John Doe"
                            value={form.fullName}
                            onChange={handleChange}
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">
                            Email address
                        </label>
                        <input
                            id="reg-email"
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
                        <label className="form-label" htmlFor="reg-password">
                            Password
                        </label>
                        <input
                            id="reg-password"
                            className="form-input"
                            type="password"
                            name="password"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        id="register-submit"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: "8px" }}
                    >
                        {loading ? <span className="spinner" /> : "Create Account →"}
                    </button>
                </form>

                <div className="auth-switch">
                    Already have an account?{" "}
                    <a onClick={onSwitchToLogin} role="button">
                        Sign in
                    </a>
                </div>
            </div>
        </div>
    );
}
