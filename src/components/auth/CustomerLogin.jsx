// pages/CustomerLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import "./CustomerAuth.css";

export default function CustomerLogin() {
  const API_URL = process.env.REACT_APP_API_URL;
  const { login } = useCustomerAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // login | register | forgot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    country: "",
  });

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/customer-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      login(data.customer);
      navigate("/customer/catalogue");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/customer-auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          company: form.company,
          address: form.address,
          city: form.city,
          country: form.country,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      login(data.customer);
      navigate("/customer/catalogue");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/customer-auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess("Password reset link sent to your email.");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = (placeholder, key, type = "text", required = true) => (
    <input
      className="ca-input"
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      required={required}
    />
  );

  return (
    <div className="ca-root">
      <div className="ca-card">
        {/* Logo */}
        <div className="ca-logo">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <circle
              cx="16"
              cy="16"
              r="15"
              stroke="#00d4ff"
              strokeWidth="1.2"
              opacity="0.5"
            />
            <path
              d="M8 20 Q12 10 16 14 Q20 18 24 10"
              stroke="#00d4ff"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="16" cy="14" r="2" fill="#00d4ff" opacity="0.8" />
          </svg>
          <div>
            <span className="ca-brand">Tropical Shellfish</span>
            <span className="ca-brand-sub">Customer Portal</span>
          </div>
        </div>

        {/* Tabs */}
        {mode !== "forgot" && (
          <div className="ca-tabs">
            <button
              className={`ca-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Sign In
            </button>
            <button
              className={`ca-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error / Success */}
        {error && <div className="ca-error">⚠️ {error}</div>}
        {success && <div className="ca-success">✅ {success}</div>}

        {/* LOGIN */}
        {mode === "login" && (
          <form className="ca-form" onSubmit={handleLogin}>
            {inp("Email address", "email", "email")}
            {inp("Password", "password", "password")}
            <button className="ca-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <button
              type="button"
              className="ca-link"
              onClick={() => {
                setMode("forgot");
                setError("");
              }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* REGISTER */}
        {mode === "register" && (
          <form className="ca-form" onSubmit={handleRegister}>
            <div className="ca-row">
              {inp("Full name *", "name")}
              {inp("Email address *", "email", "email")}
            </div>
            <div className="ca-row">
              {inp("Password *", "password", "password")}
              {inp("Confirm password *", "confirmPassword", "password")}
            </div>
            <div className="ca-divider-label">Optional Details</div>
            <div className="ca-row">
              {inp("Phone number", "phone", "tel", false)}
              {inp("Company / Business name", "company", "text", false)}
            </div>
            {inp("Delivery address", "address", "text", false)}
            <div className="ca-row">
              {inp("City", "city", "text", false)}
              {inp("Country", "country", "text", false)}
            </div>
            <button className="ca-btn" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        )}

        {/* FORGOT */}
        {mode === "forgot" && (
          <form className="ca-form" onSubmit={handleForgot}>
            <p className="ca-forgot-desc">
              Enter your email and we'll send you a reset link.
            </p>
            {inp("Email address", "email", "email")}
            <button className="ca-btn" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
            <button
              type="button"
              className="ca-link"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccess("");
              }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
