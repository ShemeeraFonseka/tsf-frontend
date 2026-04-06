// pages/CustomerCatalogue.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../auth/CustomerAuthContext";
import "./CustomerCatalogue.css";
import "../Products/Productlist.css";

const getCategoryBadgeClass = (c) => {
  if (!c) return "badge-default-cat";
  const v = c.toLowerCase();
  if (v === "live") return "badge-live";
  if (v === "fresh") return "badge-fresh";
  if (v === "frozen") return "badge-frozen";
  return "badge-default-cat";
};
const getCategoryIcon = (c) => {
  if (!c) return "";
  const v = c.toLowerCase();
  if (v === "live") return "🟢";
  if (v === "fresh") return "💧";
  if (v === "frozen") return "❄️";
  return "";
};

const SECTIONS = [
  { name: "Oyster", keywords: ["oyster"] },
  { name: "Clams", keywords: ["clam", "clams"] },
  { name: "Mussel", keywords: ["mussel"] },
  { name: "Crab", keywords: ["crab"] },
  {
    name: "Prawn",
    keywords: ["prawn", "black tiger", "white prawn", "lobster", "flowery"],
  },
  { name: "Scampi", keywords: ["scampi"] },
  { name: "Cuttlefish", keywords: ["cuttlefish", "squid"] },
  { name: "Octopus", keywords: ["octopus"] },
  {
    name: "Fish",
    keywords: [
      "fish",
      "tuna",
      "tilapia",
      "mackerel",
      "barramundi",
      "salmon",
      "snapper",
      "grouper",
      "seer",
      "mahi",
      "mullet",
      "parrot",
      "scad",
      "sardine",
      "anchovy",
      "rohu",
      "catla",
      "jack",
      "eel",
    ],
  },
];

const SECTION_ICONS = {
  Oyster: "🦪",
  Clams: "🐚",
  Mussel: "🦪",
  Crab: "🦀",
  Prawn: "🦐",
  Scampi: "🦞",
  Cuttlefish: "🐙",
  Octopus: "🐙",
  Fish: "🐟",
  Other: "📦",
};

function getSection(p) {
  const n = p.common_name?.toLowerCase() || "";
  for (const s of SECTIONS) {
    if (s.keywords.some((k) => n.includes(k))) return s.name;
  }
  return "Other";
}

export default function CustomerCatalogue() {
  const API_URL = process.env.REACT_APP_API_URL;
  const {
    customer,
    logout,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
  } = useCustomerAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addedKey, setAddedKey] = useState(null);

  // ── No auth check here — catalogue is public ──
  useEffect(() => {
    fetch(`${API_URL}/api/productlist`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const filtered = products.filter((p) => {
    const matchSpec =
      speciesFilter === "all" ||
      p.species_type?.toLowerCase() === speciesFilter;
    const matchSearch =
      !search ||
      p.common_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.scientific_name?.toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchSearch;
  });

  const sectionMap = {};
  SECTIONS.forEach((s) => {
    sectionMap[s.name] = [];
  });
  sectionMap["Other"] = [];
  filtered.forEach((p) => sectionMap[getSection(p)].push(p));
  const activeSections = [...SECTIONS.map((s) => s.name), "Other"].filter(
    (s) => sectionMap[s]?.length,
  );

  const handleAddToCart = (product, variant, qty = 1) => {
    addToCart(product, variant, qty);
    const key = `${product.id}-${variant?.id ?? "no-variant"}`;
    setAddedKey(key);
    setTimeout(() => setAddedKey(null), 1500);
  };

  const handleCheckout = () => {
    setShowCart(false);
    if (!customer) {
      navigate("/customer/login");
    } else {
      navigate("/customer/checkout");
    }
  };

  const getImgUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  return (
    <div className="cc-root">
      {/* ── NAV ── */}
      <nav className="cc-nav">
        <div className="cc-nav-brand">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
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
          <span
            className="cc-nav-name"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Tropical Shellfish
          </span>
        </div>

        <div className="cc-nav-right">
          {customer ? (
            /* ── Logged in ── */
            <>
              <span className="cc-nav-user">👤 {customer.name}</span>
              <button
                className="cc-nav-orders"
                onClick={() => navigate("/customer/orders")}
              >
                My Orders
              </button>
              <button className="cc-cart-btn" onClick={() => setShowCart(true)}>
                🛒 Cart
                {cartCount > 0 && (
                  <span className="cc-cart-badge">
                    {parseFloat(cartCount.toFixed(1))}
                  </span>
                )}
              </button>
              <button className="cc-nav-logout" onClick={logout}>
                Sign Out
              </button>
            </>
          ) : (
            /* ── Guest ── */
            <>
              <button className="cc-cart-btn" onClick={() => setShowCart(true)}>
                🛒 Cart
                {cartCount > 0 && (
                  <span className="cc-cart-badge">
                    {parseFloat(cartCount.toFixed(1))}
                  </span>
                )}
              </button>
              <button
                className="cc-nav-orders"
                onClick={() => navigate("/customer/login")}
              >
                Sign In / Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div className="cc-main">
        <div className="cc-toolbar">
          <input
            className="cc-search"
            placeholder="🔍 Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="species-filter" style={{ margin: 0 }}>
            {[
              { value: "all", label: "All", icon: "🌊" },
              { value: "fish", label: "Fish", icon: "🐟" },
              { value: "crustacean", label: "Crustacean", icon: "🦞" },
            ].map((t) => (
              <button
                key={t.value}
                className={`species-pill ${speciesFilter === t.value ? "active" : ""}`}
                onClick={() => setSpeciesFilter(t.value)}
              >
                <span className="species-icon">{t.icon}</span>
                <span className="species-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="info" style={{ position: "relative", zIndex: 1 }}>
            Loading products…
          </div>
        )}

        {activeSections.map((section) => (
          <div key={section} className="cc-section">
            <div className="cc-section-header">
              <span>{SECTION_ICONS[section]}</span>
              <span className="cc-section-name">{section}</span>
              <span className="cc-section-count">
                {sectionMap[section].length}
              </span>
            </div>
            <div className="cc-grid">
              {sectionMap[section].map((product) => {
                const img = getImgUrl(product.image_url);
                const variants = product.variants || [];
                const hasVariants = variants.length > 0;
                return (
                  <div key={product.id} className="cc-card">
                    <div
                      className="cc-card-img-wrap"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={product.common_name}
                          className="cc-card-img"
                        />
                      ) : (
                        <div className="cc-card-img-ph">🐟</div>
                      )}
                      <span
                        className={`cc-card-cat category-badge ${getCategoryBadgeClass(product.category)}`}
                      >
                        {getCategoryIcon(product.category)}{" "}
                        {product.category
                          ? product.category.charAt(0).toUpperCase() +
                            product.category.slice(1)
                          : "—"}
                      </span>
                    </div>

                    <div className="cc-card-body">
                      <h3
                        className="cc-card-name"
                        onClick={() => setSelectedProduct(product)}
                      >
                        {product.common_name}
                      </h3>
                      {product.scientific_name && (
                        <p className="cc-card-sci">{product.scientific_name}</p>
                      )}

                      {hasVariants ? (
                        <div className="cc-variants">
                          {variants.map((v) => {
                            const key = `${product.id}-${v.id}`;
                            const inCart = cart.find((c) => c.key === key);
                            const price = parseFloat(v.selling_price) || 0;
                            return (
                              <div key={v.id} className="cc-variant-row">
                                <div className="cc-variant-info">
                                  <span className="cc-variant-size">
                                    {v.size && v.size !== "-" ? v.size : "—"}
                                    {v.unit ? ` ${v.unit}` : ""}
                                  </span>
                                  {price > 0 && (
                                    <span className="cc-variant-price">
                                      Rs. {price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                {inCart ? (
                                  <div className="cc-qty-ctrl">
                                    <button
                                      onClick={() =>
                                        updateQuantity(key, inCart.quantity - 1)
                                      }
                                    >
                                      −
                                    </button>
                                    <span>{inCart.quantity}</span>
                                    <button
                                      onClick={() =>
                                        updateQuantity(key, inCart.quantity + 1)
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className={`cc-add-btn ${addedKey === key ? "added" : ""}`}
                                    onClick={() =>
                                      handleAddToCart(product, v, 1)
                                    }
                                  >
                                    {addedKey === key ? "✓ Added" : "+ Add"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="cc-no-variants">
                          Contact for pricing
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ══ CART SIDEBAR ══ */}
      {showCart && (
        <div className="cc-cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cc-cart-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="cc-cart-head">
              <h3>🛒 Your Cart</h3>
              <button
                className="cc-cart-close"
                onClick={() => setShowCart(false)}
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cc-cart-empty">
                <span>🐚</span>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="cc-cart-items">
                  {cart.map((item) => (
                    <div key={item.key} className="cc-cart-item">
                      <div className="cc-cart-item-info">
                        <span className="cc-cart-item-name">
                          {item.common_name}
                        </span>
                        {item.size_range && (
                          <span className="cc-cart-item-size">
                            {item.size_range}
                          </span>
                        )}
                        {item.unit_price > 0 && (
                          <span className="cc-cart-item-price">
                            Rs. {item.unit_price.toFixed(2)} /{" "}
                            {item.unit || "kg"}
                          </span>
                        )}
                      </div>
                      <div className="cc-cart-item-right">
                        <div className="cc-qty-ctrl">
                          <button
                            onClick={() =>
                              updateQuantity(item.key, item.quantity - 1)
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(item.key, item.quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        {item.total_price > 0 && (
                          <span className="cc-cart-item-total">
                            Rs. {item.total_price.toFixed(2)}
                          </span>
                        )}
                        <button
                          className="cc-cart-remove"
                          onClick={() => removeFromCart(item.key)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cc-cart-footer">
                  {cartTotal > 0 && (
                    <div className="cc-cart-total">
                      <span>Total</span>
                      <span>Rs. {cartTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {/* Redirects to login if not signed in */}
                  <button className="cc-checkout-btn" onClick={handleCheckout}>
                    {customer
                      ? "Proceed to Checkout →"
                      : "Sign In to Checkout →"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ PRODUCT MODAL ══ */}
      {selectedProduct && (
        <div
          className="cc-modal-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="cc-modal-close"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>
            {getImgUrl(selectedProduct.image_url) && (
              <img
                src={getImgUrl(selectedProduct.image_url)}
                alt={selectedProduct.common_name}
                className="cc-modal-img"
              />
            )}
            <div className="cc-modal-body">
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "8px",
                }}
              >
                <span
                  className={`category-badge ${getCategoryBadgeClass(selectedProduct.category)}`}
                >
                  {getCategoryIcon(selectedProduct.category)}{" "}
                  {selectedProduct.category
                    ? selectedProduct.category.charAt(0).toUpperCase() +
                      selectedProduct.category.slice(1)
                    : "—"}
                </span>
              </div>
              <h2 className="cc-modal-name">{selectedProduct.common_name}</h2>
              {selectedProduct.scientific_name && (
                <p className="cc-modal-sci">
                  {selectedProduct.scientific_name}
                </p>
              )}
              {selectedProduct.description && (
                <p className="cc-modal-desc">{selectedProduct.description}</p>
              )}
              {selectedProduct.variants?.length > 0 && (
                <div className="cc-modal-variants">
                  <h4>Sizes & Pricing</h4>
                  {selectedProduct.variants.map((v) => {
                    const key = `${selectedProduct.id}-${v.id}`;
                    const inCart = cart.find((c) => c.key === key);
                    return (
                      <div
                        key={v.id}
                        className="cc-variant-row"
                        style={{
                          background: "var(--bg-surface)",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          marginBottom: "6px",
                        }}
                      >
                        <div className="cc-variant-info">
                          <span className="cc-variant-size">
                            {v.size && v.size !== "-" ? v.size : "—"}
                            {v.unit ? ` ${v.unit}` : ""}
                          </span>
                          {parseFloat(v.selling_price) > 0 && (
                            <span className="cc-variant-price">
                              Rs. {parseFloat(v.selling_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {inCart ? (
                          <div className="cc-qty-ctrl">
                            <button
                              onClick={() =>
                                updateQuantity(key, inCart.quantity - 1)
                              }
                            >
                              −
                            </button>
                            <span>{inCart.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(key, inCart.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className={`cc-add-btn ${addedKey === key ? "added" : ""}`}
                            onClick={() =>
                              handleAddToCart(selectedProduct, v, 1)
                            }
                          >
                            {addedKey === key ? "✓ Added" : "+ Add"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Sign in prompt for guests */}
              {!customer && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px 16px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-glow)",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      marginBottom: "10px",
                    }}
                  >
                    Sign in to add items to your cart and place orders.
                  </p>
                  <button
                    className="apf-btn"
                    onClick={() => navigate("/customer/login")}
                    style={{ width: "100%" }}
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
