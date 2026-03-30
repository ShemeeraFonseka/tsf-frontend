import React, { useEffect, useState } from "react";
import "../Products/Productlist.css";

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

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  position: "",
  confirmPassword: "",
};

export default function UserManagement() {
  const API_URL = process.env.REACT_APP_API_URL;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* ── fetch ── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      setUsers(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line

  /* ── modal helpers ── */
  const openCreate = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormError("");
    setShowPassword(false);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      position: user.position,
      password: "",
      confirmPassword: "",
    });
    setFormError("");
    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setFormError("");
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name || !formData.email || !formData.position)
      return setFormError("Name, email and position are required.");

    if (!editingUser && !formData.password)
      return setFormError("Password is required for new users.");

    if (formData.password && formData.password !== formData.confirmPassword)
      return setFormError("Passwords do not match.");

    if (formData.password && formData.password.length < 6)
      return setFormError("Password must be at least 6 characters.");

    setFormLoading(true);
    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          email: formData.email,
          position: formData.position,
        };
        if (formData.password) payload.password = formData.password;
        const res = await fetch(`${API_URL}/api/auth/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || "Failed to update");
        }
      } else {
        const res = await fetch(`${API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            position: formData.position,
          }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || "Failed to create");
        }
      }
      await fetchUsers();
      closeModal();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ── filter ── */
  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.position?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="pricelist-container">
      {/* ── Header ── */}
      <h2>👥 User Management</h2>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              fontSize: "16px",
            }}
          >
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email or position…"
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          </span>
          <button className="apf-btn" onClick={openCreate}>
            + Add User
          </button>
        </div>
      </div>

      {/* ── States ── */}
      {loading && <div className="info">Loading users…</div>}
      {error && <div className="error">{error}</div>}

      {/* ── User Cards Grid ── */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {filtered.length === 0 && (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "4rem",
                color: "var(--text-muted)",
                fontSize: "15px",
              }}
            >
              {searchQuery
                ? `No users matching "${searchQuery}"`
                : "No users found. Add one to get started."}
            </div>
          )}

          {filtered.map((user) => {
            const color = getAvatarColor(user.name);
            return (
              <div
                key={user.id}
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  transition: "border-color 0.2s, transform 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-glow)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Subtle glow accent */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: `linear-gradient(90deg, transparent, ${color}44, transparent)`,
                  }}
                />

                {/* Avatar + name row */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "14px" }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: `${color}18`,
                      border: `2px solid ${color}40`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: "700",
                      color,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: "600",
                        fontSize: "15px",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12.5px",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Position badge */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 12px",
                      background: `${color}12`,
                      border: `1px solid ${color}30`,
                      borderRadius: "20px",
                      fontSize: "11.5px",
                      fontWeight: "600",
                      color,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    🏷️ {user.position || "—"}
                  </span>
                </div>

                {/* Meta */}
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {user.created_at && (
                    <span>
                      Joined{" "}
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    onClick={() => openEdit(user)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(0,212,255,0.08)",
                      color: "var(--accent-cyan)",
                      border: "1px solid rgba(0,212,255,0.2)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,212,255,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(0,212,255,0.08)";
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(user)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(239,68,68,0.07)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.18)",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.18)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239,68,68,0.07)";
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,8,16,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "var(--bg-raised)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-glow)",
              width: "100%",
              maxWidth: "480px",
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px var(--border-subtle)",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: "24px 28px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                }}
              >
                {editingUser ? "✏️ Edit User" : "➕ Add New User"}
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                }}
              >
                {editingUser
                  ? `Editing profile for ${editingUser.name}`
                  : "Create a new staff account"}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Name */}
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ashan Perera"
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
                  placeholder="e.g. ashan@tropicalshellfish.lk"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Position */}
              <div>
                <label style={labelStyle}>Position *</label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">— Select position —</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label style={labelStyle}>
                  {editingUser
                    ? "New Password (leave blank to keep current)"
                    : "Password *"}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={
                      editingUser ? "Enter new password…" : "Min. 6 characters"
                    }
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: "16px",
                    }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              {formData.password && (
                <div>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
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
                    required={!!formData.password}
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

              {/* Error */}
              {formError && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    color: "#f87171",
                  }}
                >
                  ⚠️ {formError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={closeModal}
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
                  {formLoading
                    ? "Saving…"
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ DELETE CONFIRM ══════════ */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,8,16,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "var(--bg-raised)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid rgba(239,68,68,0.3)",
              width: "100%",
              maxWidth: "400px",
              padding: "32px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "16px" }}>⚠️</div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "var(--text-primary)",
                marginBottom: "10px",
              }}
            >
              Delete User?
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                lineHeight: "1.6",
                marginBottom: "28px",
              }}
            >
              This will permanently remove{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {deleteConfirm.name}
              </strong>{" "}
              ({deleteConfirm.email}) from the system. This action cannot be
              undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
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
                onClick={() => handleDelete(deleteConfirm.id)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.35)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared input styles ── */
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
