import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Products/Productlist.css";

import { isAdmin } from "../../hooks/useAuth";

const adminUser = isAdmin();

const POSITIONS = [
  "Manager",
  "Sales Executive",
  "Export Officer",
  "Accounts",
  "Warehouse",
  "Admin",
  "Director",
];

const AVATAR_COLORS = [
  "#00d4ff",
  "#fb923c",
  "#4ade80",
  "#818cf8",
  "#f472b6",
  "#facc15",
  "#34d399",
  "#f87171",
];

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function UserProfile() {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch current user data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          navigate("/login");
          return;
        }

        const parsedUser = JSON.parse(storedUser);

        // Fetch latest user data from server using your existing GET /users/:id endpoint
        const res = await fetch(`${API_URL}/api/auth/users/${parsedUser.id}`);
        if (!res.ok) throw new Error("Failed to fetch user profile");

        const userData = await res.json();
        setUser(userData);

        // Initialize form data
        setFormData({
          name: userData.name,
          email: userData.email,
          position: userData.position || "",
          password: "",
          confirmPassword: "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [API_URL, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
    setFormSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Validate name and email
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Name and email are required");
      return;
    }

    // Validate password if changing
    if (formData.password) {
      if (formData.password.length < 6) {
        setFormError("Password must be at least 6 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError("Passwords do not match");
        return;
      }
    }

    setFormLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        position: formData.position,
      };

      // Add password to payload if it's being changed
      if (formData.password) {
        payload.password = formData.password;
      }

      // Use your existing PUT /users/:id endpoint
      const res = await fetch(`${API_URL}/api/auth/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update user in localStorage
      const updatedUser = { ...user, ...payload };
      delete updatedUser.password;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      setFormSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    setFormData({
      name: user.name,
      email: user.email,
      position: user.position || "",
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    setFormSuccess("");
    setIsEditing(false);
  };

  const avatarColor = user ? getAvatarColor(user.name) : "#00d4ff";
  const initials = user ? getInitials(user.name) : "?";

  if (loading) {
    return (
      <div className="pricelist-container">
        <div className="info">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricelist-container">
        <div className="error">{error}</div>
        <button className="apf-btn" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="pricelist-container">
      <div style={{ margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>👤 My Profile</h2>
          {!isEditing && (
            <button
              className="apf-btn"
              onClick={() => setIsEditing(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Profile Card */}
        <div
          style={{
            background: "var(--bg-raised)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {/* Cover/Banner */}
          <div
            style={{
              height: "100px",
              background: `linear-gradient(135deg, ${avatarColor}40, ${avatarColor}10)`,
              position: "relative",
            }}
          />

          {/* Avatar Section */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "-50px",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `${avatarColor}18`,
                border: `4px solid var(--bg-raised)`,
                boxShadow: `0 0 0 2px ${avatarColor}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: "700",
                color: avatarColor,
              }}
            >
              {initials}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "24px 32px 32px" }}>
            {/* Success/Error Messages */}
            {formSuccess && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "20px",
                  color: "#4ade80",
                  fontSize: "14px",
                }}
              >
                ✓ {formSuccess}
              </div>
            )}

            {formError && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "20px",
                  color: "#f87171",
                  fontSize: "14px",
                }}
              >
                ⚠️ {formError}
              </div>
            )}

            {/* Read-only View */}
            {!isEditing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <div style={valueStyle}>{user.name}</div>
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <div style={valueStyle}>{user.email}</div>
                </div>

                <div>
                  <label style={labelStyle}>Position</label>
                  <div style={valueStyle}>
                    {user.position || (
                      <span style={{ color: "var(--text-muted)" }}>
                        Not specified
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Member Since</label>
                  <div style={valueStyle}>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {/* Name */}
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={inputStyle}
                    required
                  />
                </div>

                {/* Position */}
                {adminUser && (
                  <div>
                    <label style={labelStyle}>Position</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      style={inputStyle}
                    >
                      <option value="">— Select position —</option>
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Password Change Section */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--text-primary)",
                      marginBottom: "16px",
                    }}
                  >
                    🔐 Change Password (Optional)
                  </h4>

                  {/* New Password */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>New Password</label>
                    <div style={{ position: "relative" }}>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Leave blank to keep current password"
                        style={{ ...inputStyle, paddingRight: "44px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        style={passwordToggleStyle}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  {formData.password && (
                    <div>
                      <label style={labelStyle}>Confirm New Password</label>
                      <input
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat new password"
                        style={{
                          ...inputStyle,
                          borderColor:
                            formData.confirmPassword &&
                            formData.confirmPassword !== formData.password
                              ? "rgba(239,68,68,0.5)"
                              : formData.confirmPassword &&
                                  formData.confirmPassword === formData.password
                                ? "rgba(74,222,128,0.4)"
                                : undefined,
                        }}
                      />
                      {formData.confirmPassword &&
                        formData.confirmPassword !== formData.password && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#f87171",
                              marginTop: "4px",
                            }}
                          >
                            Passwords do not match
                          </p>
                        )}
                      {formData.confirmPassword &&
                        formData.confirmPassword === formData.password && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#4ade80",
                              marginTop: "4px",
                            }}
                          >
                            ✓ Passwords match
                          </p>
                        )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  style={{ display: "flex", gap: "12px", marginTop: "24px" }}
                >
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      flex: 1,
                      padding: "11px 0",
                      borderRadius: "var(--radius-sm)",
                      background: "transparent",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="apf-btn"
                    style={{
                      flex: 2,
                      opacity: formLoading ? 0.7 : 1,
                      cursor: formLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {formLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "var(--text-secondary)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "7px",
};

const valueStyle = {
  padding: "10px 14px",
  background: "var(--bg-surface)",
  borderRadius: "var(--radius-sm)",
  fontSize: "14px",
  color: "var(--text-primary)",
  border: "1px solid var(--border-subtle)",
};

const passwordToggleStyle = {
  position: "absolute",
  right: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  fontSize: "16px",
};
