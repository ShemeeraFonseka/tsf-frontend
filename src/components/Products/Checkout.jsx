// pages/Checkout.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import "./Checkout.css";
import "../Products/Productlist.css";

export default function Checkout() {
  const API_URL = process.env.REACT_APP_API_URL;
  const { customer, cart, cartTotal, clearCart } = useCustomerAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    delivery_address: customer?.address || "",
    delivery_city: customer?.city || "",
    delivery_country: customer?.country || "",
    preferred_delivery_date: "",
    special_notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!customer) {
    navigate("/customer/login");
    return null;
  }
  if (cart.length === 0) {
    navigate("/customer/catalogue");
    return null;
  }

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.delivery_address.trim())
      return setError("Delivery address is required");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone || null,
          delivery_address: form.delivery_address,
          delivery_city: form.delivery_city,
          delivery_country: form.delivery_country,
          preferred_delivery_date: form.preferred_delivery_date || null,
          special_notes: form.special_notes || null,
          items: cart.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            common_name: i.common_name,
            scientific_name: i.scientific_name,
            image_url: i.image_url,
            size_range: i.size_range,
            unit: i.unit || "kg",
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.total_price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      clearCart();
      navigate(`/customer/order-success/${data.order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="co-root">
      <nav className="co-nav">
        <button
          className="co-back"
          onClick={() => navigate("/customer/catalogue")}
        >
          ← Back to Catalogue
        </button>
        <span className="co-nav-title">Checkout</span>
      </nav>

      <div className="co-body">
        {/* Order summary */}
        <div className="co-summary">
          <h3 className="co-section-title">Order Summary</h3>
          <div className="co-items">
            {cart.map((item) => (
              <div key={item.key} className="co-item">
                <div className="co-item-info">
                  <span className="co-item-name">{item.common_name}</span>
                  {item.size_range && (
                    <span className="co-item-size">{item.size_range}</span>
                  )}
                </div>
                <div className="co-item-right">
                  <span className="co-item-qty">
                    {item.quantity} {item.unit || "kg"}
                  </span>
                  {item.total_price > 0 && (
                    <span className="co-item-total">
                      Rs. {item.total_price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {cartTotal > 0 && (
            <div className="co-grand-total">
              <span>Order Total</span>
              <span>Rs. {cartTotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form className="co-form" onSubmit={handleSubmit}>
          <h3 className="co-section-title">Delivery Details</h3>

          <div className="co-field-group">
            <label className="co-label">Full Name</label>
            <input className="co-input" value={customer.name} disabled />
          </div>
          <div className="co-row">
            <div className="co-field-group">
              <label className="co-label">Email</label>
              <input className="co-input" value={customer.email} disabled />
            </div>
            <div className="co-field-group">
              <label className="co-label">Phone</label>
              <input
                className="co-input"
                value={customer.phone || "—"}
                disabled
              />
            </div>
          </div>

          <div className="co-field-group">
            <label className="co-label">Delivery Address *</label>
            <textarea
              className="co-input co-textarea"
              value={form.delivery_address}
              onChange={(e) => set("delivery_address", e.target.value)}
              placeholder="Street address, building, etc."
              rows={3}
              required
            />
          </div>
          <div className="co-row">
            <div className="co-field-group">
              <label className="co-label">City</label>
              <input
                className="co-input"
                value={form.delivery_city}
                onChange={(e) => set("delivery_city", e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="co-field-group">
              <label className="co-label">Country</label>
              <input
                className="co-input"
                value={form.delivery_country}
                onChange={(e) => set("delivery_country", e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>

          <div className="co-field-group">
            <label className="co-label">Preferred Delivery Date</label>
            <input
              className="co-input"
              type="date"
              value={form.preferred_delivery_date}
              onChange={(e) => set("preferred_delivery_date", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="co-field-group">
            <label className="co-label">Special Notes / Instructions</label>
            <textarea
              className="co-input co-textarea"
              value={form.special_notes}
              onChange={(e) => set("special_notes", e.target.value)}
              placeholder="Any special requirements, packaging preferences, etc."
              rows={3}
            />
          </div>

          {error && <div className="co-error">⚠️ {error}</div>}

          <button className="co-submit-btn" disabled={loading}>
            {loading ? "Placing Order…" : "🐚 Place Order"}
          </button>
          <p className="co-note">
            You will receive an email confirmation after placing your order.
          </p>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// pages/OrderSuccess.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function OrderSuccess() {
  const navigate = useNavigate();
  const { orderId } = useParams
    ? require("react-router-dom").useParams()
    : { orderId: "" };

  return (
    <div
      className="co-root"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="co-success-card">
        <div className="co-success-icon">✅</div>
        <h2 className="co-success-title">Order Placed!</h2>
        <p className="co-success-sub">Order #{orderId} has been received.</p>
        <p className="co-success-desc">
          We've sent a confirmation to your email. Our team will be in touch
          shortly.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className="co-submit-btn"
            style={{ width: "auto", padding: "12px 28px" }}
            onClick={() => navigate("/customer/orders")}
          >
            View My Orders
          </button>
          <button
            className="co-back"
            onClick={() => navigate("/customer/catalogue")}
            style={{ padding: "12px 20px" }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
