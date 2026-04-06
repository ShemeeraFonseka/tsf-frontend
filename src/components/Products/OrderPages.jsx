// pages/OrderPages.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import "./Productlist.css";

const STATUS_COLORS = {
  pending: {
    color: "#facc15",
    bg: "rgba(250,204,21,0.1)",
    border: "rgba(250,204,21,0.3)",
  },
  confirmed: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.3)",
  },
  processing: {
    color: "#c084fc",
    bg: "rgba(192,132,252,0.1)",
    border: "rgba(192,132,252,0.3)",
  },
  shipped: {
    color: "#34d399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.3)",
  },
  delivered: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.3)",
  },
  cancelled: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.3)",
  },
};

const STATUS_ICONS = {
  pending: "⏳",
  confirmed: "✅",
  processing: "⚙️",
  shipped: "🚢",
  delivered: "📦",
  cancelled: "❌",
};

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER ORDER HISTORY
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerOrders() {
  const API_URL = process.env.REACT_APP_API_URL;
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!customer) {
      navigate("/customer/login");
      return;
    }
    fetch(`${API_URL}/api/orders/customer/${customer.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrders(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <div className="pricelist-container">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2 style={{ margin: 0 }}>📦 My Orders</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="apf-btn"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
            onClick={() => navigate("/customer/catalogue")}
          >
            ← Catalogue
          </button>
          <button
            className="apf-btn"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
            }}
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>

      {loading && <div className="info">Loading orders…</div>}

      {!loading && orders.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🐚</div>
          <p style={{ fontSize: "15px" }}>No orders yet.</p>
          <button
            className="apf-btn"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/customer/catalogue")}
          >
            Start Shopping
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {orders.map((order) => {
          const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
          const isOpen = expanded === order.id;
          return (
            <div
              key={order.id}
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  cursor: "pointer",
                }}
                onClick={() => setExpanded(isOpen ? null : order.id)}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    flex: 1,
                    minWidth: "140px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                    }}
                  >
                    Order #{order.id}
                  </span>
                  <span
                    style={{ fontSize: "12px", color: "var(--text-muted)" }}
                  >
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    background: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  {STATUS_ICONS[order.status]}{" "}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                {order.total_amount > 0 && (
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "var(--accent-cyan)",
                    }}
                  >
                    Rs. {parseFloat(order.total_amount).toFixed(2)}
                  </span>
                )}
                <span style={{ color: "var(--text-muted)", fontSize: "16px" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>

              {isOpen && (
                <div
                  style={{
                    borderTop: "1px solid var(--border-subtle)",
                    padding: "18px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(200px,1fr))",
                      gap: "12px",
                    }}
                  >
                    {[
                      [
                        "📍 Delivery Address",
                        `${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ""}${order.delivery_country ? `, ${order.delivery_country}` : ""}`,
                      ],
                      order.preferred_delivery_date && [
                        "📅 Preferred Date",
                        new Date(
                          order.preferred_delivery_date,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                      ],
                      order.special_notes && ["💬 Notes", order.special_notes],
                    ]
                      .filter(Boolean)
                      .map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            background: "var(--bg-surface)",
                            padding: "12px 14px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "var(--text-muted)",
                              marginBottom: "4px",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: "13.5px",
                              color: "var(--text-primary)",
                              lineHeight: "1.5",
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Items
                    </div>
                    {(order.order_items || []).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderBottom: "1px solid var(--border-subtle)",
                          gap: "8px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "13.5px",
                              fontWeight: "600",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.common_name}
                          </div>
                          {item.size_range && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {item.size_range}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "12.5px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {item.quantity} {item.unit || "kg"}
                          </div>
                          {item.total_price > 0 && (
                            <div
                              style={{
                                fontSize: "13.5px",
                                fontWeight: "700",
                                color: "var(--accent-cyan)",
                              }}
                            >
                              Rs. {parseFloat(item.total_price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ORDER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export function AdminOrders() {
  const API_URL = process.env.REACT_APP_API_URL;
  const location = useLocation();

  // Read ?status= from dashboard shortcut links (e.g. /admin/orders?status=pending)
  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("status") || "all";
  });

  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [search, setSearch] = useState("");

  const fetchOrders = () => {
    setLoading(true);
    fetch(`${API_URL}/api/orders`)
      .then((r) => r.json())
      .then((d) => {
        setAllOrders(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []); // eslint-disable-line

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchOrders();
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order permanently?")) return;
    await fetch(`${API_URL}/api/orders/${orderId}`, { method: "DELETE" });
    fetchOrders();
  };

  // Client-side filtering for instant response
  const displayed = allOrders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.customer_email?.toLowerCase().includes(q) ||
      String(o.id).includes(q);
    return matchStatus && matchSearch;
  });

  const countFor = (s) =>
    s === "all"
      ? allOrders.length
      : allOrders.filter((o) => o.status === s).length;

  const stats = {
    total: allOrders.length,
    pending: allOrders.filter((o) => o.status === "pending").length,
    active: allOrders.filter((o) =>
      ["confirmed", "processing", "shipped"].includes(o.status),
    ).length,
    revenue: allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0),
  };

  return (
    <div className="pricelist-container">
      <h2>📋 Order Management</h2>

      {/* ── Stats ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: "14px",
          marginBottom: "24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {[
          {
            label: "Total Orders",
            value: stats.total,
            icon: "📋",
            color: "var(--accent-cyan)",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: "⏳",
            color: "#facc15",
          },
          {
            label: "Active",
            value: stats.active,
            icon: "🚢",
            color: "#34d399",
          },
          {
            label: "Revenue",
            value: `Rs. ${stats.revenue.toFixed(2)}`,
            icon: "💰",
            color: "#c084fc",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>
              {stat.icon}
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: stat.color,
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "5px",
                letterSpacing: "0.04em",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div style={{ position: "relative", marginBottom: "14px", zIndex: 1 }}>
        <span
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            fontSize: "15px",
          }}
        >
          🔍
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, name or email…"
          style={{
            width: "100%",
            padding: "10px 14px 10px 38px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontSize: "14px",
            outline: "none",
          }}
        />
      </div>

      {/* ── Status filter ── */}
      <div className="species-filter" style={{ marginBottom: "1.5rem" }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`species-pill ${statusFilter === s ? "active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s !== "all" && <span>{STATUS_ICONS[s]}</span>}
            <span className="species-label">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
            <span className="species-count">({countFor(s)})</span>
          </button>
        ))}
      </div>

      {loading && <div className="info">Loading orders…</div>}

      {!loading && displayed.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
            position: "relative",
            zIndex: 1,
          }}
        >
          {search ? `No orders matching "${search}"` : "No orders found."}
        </div>
      )}

      {/* ── Order list ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {displayed.map((order) => {
          const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
          const isOpen = expanded === order.id;
          return (
            <div
              key={order.id}
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-glow)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-subtle)")
              }
            >
              {/* Header row */}
              <div
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div
                  style={{ flex: 1, minWidth: "160px", cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                    }}
                  >
                    #{order.id} — {order.customer_name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {order.customer_email}
                    {order.customer_phone && ` · ${order.customer_phone}`}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {new Date(order.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <span
                  style={{
                    padding: "5px 13px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    background: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_ICONS[order.status]}{" "}
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>

                {order.total_amount > 0 && (
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "var(--accent-cyan)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Rs. {parseFloat(order.total_amount).toFixed(2)}
                  </span>
                )}

                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {(order.order_items || []).length} item
                  {(order.order_items || []).length !== 1 ? "s" : ""}
                </span>

                {/* Status dropdown */}
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  disabled={updating === order.id}
                  style={{
                    padding: "7px 10px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    cursor: "pointer",
                    opacity: updating === order.id ? 0.5 : 1,
                  }}
                >
                  {[
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled",
                  ].map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => deleteOrder(order.id)}
                  style={{
                    padding: "7px 12px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "var(--radius-sm)",
                    color: "#f87171",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                  }
                >
                  🗑️
                </button>

                <span
                  style={{
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "15px",
                  }}
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                >
                  {isOpen ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div
                  style={{
                    borderTop: "1px solid var(--border-subtle)",
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {/* Info cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill,minmax(200px,1fr))",
                      gap: "10px",
                    }}
                  >
                    {[
                      [
                        "📍 Delivery",
                        `${order.delivery_address}${order.delivery_city ? `, ${order.delivery_city}` : ""}${order.delivery_country ? `, ${order.delivery_country}` : ""}`,
                      ],
                      order.customer_phone && [
                        "📞 Phone",
                        order.customer_phone,
                      ],
                      order.preferred_delivery_date && [
                        "📅 Preferred Date",
                        new Date(
                          order.preferred_delivery_date,
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                      ],
                      order.special_notes && ["💬 Notes", order.special_notes],
                    ]
                      .filter(Boolean)
                      .map(([label, value]) => (
                        <div
                          key={label}
                          style={{
                            background: "var(--bg-surface)",
                            padding: "10px 12px",
                            borderRadius: "var(--radius-sm)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "var(--text-muted)",
                              marginBottom: "3px",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-primary)",
                              lineHeight: "1.5",
                            }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Items table */}
                  <div className="table-wrap" style={{ marginTop: 0 }}>
                    <table className="pricelist-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Size</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.order_items || []).map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div style={{ fontWeight: "600" }}>
                                {item.common_name}
                              </div>
                              {item.scientific_name && (
                                <div
                                  style={{
                                    fontSize: "12px",
                                    fontStyle: "italic",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {item.scientific_name}
                                </div>
                              )}
                            </td>
                            <td>{item.size_range || "—"}</td>
                            <td>
                              {item.quantity} {item.unit || "kg"}
                            </td>
                            <td className="price-cell">
                              {item.unit_price > 0
                                ? `Rs. ${parseFloat(item.unit_price).toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="price-cell">
                              {item.total_price > 0
                                ? `Rs. ${parseFloat(item.total_price).toFixed(2)}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {order.total_amount > 0 && (
                        <tfoot>
                          <tr>
                            <td
                              colSpan="4"
                              style={{
                                textAlign: "right",
                                fontWeight: "700",
                                padding: "12px 18px",
                                color: "var(--text-secondary)",
                              }}
                            >
                              Order Total
                            </td>
                            <td
                              className="price-cell"
                              style={{ fontWeight: "800", fontSize: "15px" }}
                            >
                              Rs. {parseFloat(order.total_amount).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Quick status buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      Quick update:
                    </span>
                    {[
                      "confirmed",
                      "processing",
                      "shipped",
                      "delivered",
                      "cancelled",
                    ].map((st) => {
                      const sc = STATUS_COLORS[st];
                      const isCurrent = order.status === st;
                      return (
                        <button
                          key={st}
                          disabled={isCurrent || updating === order.id}
                          onClick={() => updateStatus(order.id, st)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "var(--radius-sm)",
                            border: `1px solid ${sc?.border || "var(--border-subtle)"}`,
                            background: isCurrent ? sc?.bg : "transparent",
                            color: sc?.color || "var(--text-secondary)",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: isCurrent ? "default" : "pointer",
                            opacity: isCurrent ? 1 : 0.65,
                            transition: "opacity 0.2s, background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrent) e.currentTarget.style.opacity = "1";
                            e.currentTarget.style.background = sc?.bg;
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrent)
                              e.currentTarget.style.opacity = "0.65";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {STATUS_ICONS[st]}{" "}
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
