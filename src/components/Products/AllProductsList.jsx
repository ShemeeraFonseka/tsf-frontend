import React, { useEffect, useState, useMemo } from "react";
import "./Productlist.css";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../../hooks/useAuth";

/* ── Type badge config ─────────────────────────────────────────── */
const TYPE_CONFIG = {
  local: { label: "🏪 Local", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  export_sea: {
    label: "🚢 Sea",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  export_air: {
    label: "✈️ Air",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.12)",
  },
};

const getCategoryIcon = (c) => {
  if (!c) return "";
  const v = c.toLowerCase();
  if (v === "live") return "🟢";
  if (v === "fresh") return "💧";
  if (v === "frozen") return "❄️";
  return "";
};

const getSpeciesIcon = (s) => {
  if (!s) return "🌊";
  if (s.toLowerCase() === "fish") return "🐟";
  if (s.toLowerCase() === "crustacean") return "🦞";
  if (s.toLowerCase() === "mollusc") return "🐚";
  return "🌊";
};

const fmt = (v) => (!v ? "—" : v.charAt(0).toUpperCase() + v.slice(1));

/* ── FOB calculator (same as ExportProductlist) ─────────────────── */
const calcFobUSD = (variant, usdRate) => {
  const rate = parseFloat(usdRate || variant.usdrate) || 1;
  const profitUSD = parseFloat(variant.profit_usd ?? variant.profit) || 0;
  const labour = parseFloat(variant.labour_overhead) || 0;
  const packing = parseFloat(variant.packing_cost) || 0;
  if (parseFloat(variant.jc_fob) > 0) {
    return parseFloat(variant.jc_fob) + profitUSD + packing + labour;
  } else if (parseFloat(variant.exfactoryprice) > 0) {
    return parseFloat(variant.exfactoryprice) / rate;
  }
  return 0;
};

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function AllProductslist() {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const adminUser = isAdmin();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usdRate, setUsdRate] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | local | export_sea | export_air
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  /* ── Fetch ── */
  useEffect(() => {
    fetch(`${API_URL}/api/productlist?type=all`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });

    fetch(`${API_URL}/api/usd-rate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rate) setUsdRate(d.rate);
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  /* ── Derived filter options ── */
  const allSpecies = useMemo(
    () => [...new Set(items.map((p) => p.species_type).filter(Boolean))],
    [items],
  );
  const allCategories = useMemo(
    () => [...new Set(items.map((p) => p.category).filter(Boolean))],
    [items],
  );

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (filterType !== "all" && !p.product_types?.includes(filterType))
        return false;
      if (
        filterSpecies !== "all" &&
        p.species_type?.toLowerCase() !== filterSpecies
      )
        return false;
      if (
        filterCategory !== "all" &&
        p.category?.toLowerCase() !== filterCategory
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.common_name?.toLowerCase().includes(q) &&
          !p.scientific_name?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [items, filterType, filterSpecies, filterCategory, search]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (productId, productName) => {
    if (
      !window.confirm(`Delete "${productName}"? All variants will be removed.`)
    )
      return;
    try {
      const res = await fetch(`${API_URL}/api/productlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: items.length,
      local: items.filter((p) => p.product_types?.includes("local")).length,
      sea: items.filter((p) => p.product_types?.includes("export_sea")).length,
      air: items.filter((p) => p.product_types?.includes("export_air")).length,
      withVariants: items.filter((p) => p.variants?.length > 0).length,
    }),
    [items],
  );

  /* ── Helpers ── */
  const getImageUrl = (url) => {
    if (!url) return "/images/placeholder-seafood.png";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="pricelist-container">
      <h2>All Products</h2>

      {/* ── Stats bar ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Total", value: stats.total, color: "var(--text-primary)" },
          { label: "🏪 Local", value: stats.local, color: "#60a5fa" },
          { label: "🚢 Sea", value: stats.sea, color: "#34d399" },
          { label: "✈️ Air", value: stats.air, color: "#c084fc" },
          {
            label: "With Variants",
            value: stats.withVariants,
            color: "var(--text-muted)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "10px 16px",
              minWidth: "100px",
            }}
          >
            <div
              style={{ fontSize: "22px", fontWeight: "800", color: s.color }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name…"
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "13px",
            minWidth: "200px",
            flex: "1",
          }}
        />

        {/* Type filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        >
          <option value="all">All Types</option>
          <option value="local">🏪 Local</option>
          <option value="export_sea">🚢 Export Sea</option>
          <option value="export_air">✈️ Export Air</option>
        </select>

        {/* Species filter */}
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        >
          <option value="all">All Species</option>
          {allSpecies.map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {fmt(s)}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        >
          <option value="all">All Categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c.toLowerCase()}>
              {fmt(c)}
            </option>
          ))}
        </select>

        {adminUser && (
          <button
            className="apf-btn"
            onClick={() => navigate("/productform")}
            style={{ whiteSpace: "nowrap" }}
          >
            + Add Product
          </button>
        )}
      </div>

      {/* ── Result count ── */}
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          marginBottom: "12px",
        }}
      >
        Showing{" "}
        <strong style={{ color: "var(--text-primary)" }}>
          {filtered.length}
        </strong>{" "}
        of {items.length} products
      </div>

      {loading && <div className="info">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="pricelist-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}></th>
                <th>Picture</th>
                <th>Common Name</th>
                <th>Scientific Name</th>
                <th>Types</th>
                <th>Species</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="muted"
                    style={{ textAlign: "center", padding: "3rem" }}
                  >
                    No products found
                  </td>
                </tr>
              )}

              {filtered.map((product) => {
                const isExpanded = expandedIds.has(product.id);
                const variants = product.variants || [];
                const types = product.product_types || [];
                const isLocal = types.includes("local");
                const isSea = types.includes("export_sea");
                const isAir = types.includes("export_air");

                return (
                  <React.Fragment key={product.id}>
                    {/* ── Product row ── */}
                    <tr
                      className="product-group-start"
                      style={{
                        cursor: variants.length > 0 ? "pointer" : "default",
                      }}
                      onClick={() =>
                        variants.length > 0 && toggleExpand(product.id)
                      }
                    >
                      {/* Expand toggle */}
                      <td
                        style={{
                          textAlign: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          userSelect: "none",
                        }}
                      >
                        {variants.length > 0 ? (isExpanded ? "▼" : "▶") : ""}
                      </td>

                      {/* Image */}
                      <td className="thumb-cell">
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.common_name}
                          className="thumb"
                          onError={(e) => {
                            e.target.src = "/images/placeholder-seafood.png";
                          }}
                        />
                      </td>

                      {/* Common name */}
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {product.common_name}
                      </td>

                      {/* Scientific name */}
                      <td className="scientific">
                        {product.scientific_name || "—"}
                      </td>

                      {/* Type badges */}
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "5px",
                            flexWrap: "wrap",
                          }}
                        >
                          {types.map((t) => {
                            const cfg = TYPE_CONFIG[t];
                            if (!cfg) return null;
                            return (
                              <span
                                key={t}
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  padding: "2px 8px",
                                  borderRadius: "20px",
                                  border: `1px solid ${cfg.color}`,
                                  background: cfg.bg,
                                  color: cfg.color,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Species */}
                      <td>
                        <span style={{ fontSize: "12px" }}>
                          {getSpeciesIcon(product.species_type)}{" "}
                          {fmt(product.species_type)}
                        </span>
                      </td>

                      {/* Category */}
                      <td>
                        <span style={{ fontSize: "12px" }}>
                          {getCategoryIcon(product.category)}{" "}
                          {fmt(product.category)}
                        </span>
                      </td>

                      {/* Variants count */}
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            color:
                              variants.length > 0
                                ? "var(--accent-cyan)"
                                : "var(--text-muted)",
                            fontWeight: variants.length > 0 ? "700" : "400",
                          }}
                        >
                          {variants.length > 0
                            ? `${variants.length} size${variants.length > 1 ? "s" : ""}`
                            : "None"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="actions-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="actions-wrapper">
                          {isLocal && (
                            <button
                              className="btn-view"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() =>
                                navigate(`/productdetail/${product.id}`)
                              }
                            >
                              🏪
                            </button>
                          )}
                          {isSea && (
                            <button
                              className="btn-view"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() =>
                                navigate(`/exportproductdetail/${product.id}`)
                              }
                            >
                              🚢
                            </button>
                          )}
                          {isAir && (
                            <button
                              className="btn-view"
                              style={{ fontSize: "11px", padding: "4px 8px" }}
                              onClick={() =>
                                navigate(
                                  `/exportproductdetailair/${product.id}`,
                                )
                              }
                            >
                              ✈️
                            </button>
                          )}
                          {adminUser && (
                            <button
                              className="btn-edit"
                              onClick={() =>
                                navigate(`/productform/${product.id}`)
                              }
                            >
                              Edit
                            </button>
                          )}
                          {adminUser && (
                            <button
                              className="btn-delete"
                              onClick={() =>
                                handleDelete(product.id, product.common_name)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded variant rows ── */}
                    {isExpanded &&
                      variants.map((v, vi) => (
                        <tr
                          key={`${product.id}-v-${v.id || vi}`}
                          style={{
                            background: "var(--bg-deep)",
                            borderTop: "none",
                          }}
                        >
                          <td colSpan={2}></td>
                          <td
                            colSpan={2}
                            style={{
                              paddingLeft: "24px",
                              fontSize: "12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "600",
                                color: "var(--text-primary)",
                              }}
                            >
                              {v.size || "—"}
                            </span>
                            {v.unit && (
                              <span style={{ marginLeft: "4px" }}>
                                {v.unit}
                              </span>
                            )}
                          </td>

                          {/* Type-specific pricing */}
                          <td colSpan={5}>
                            <div
                              style={{
                                display: "flex",
                                gap: "20px",
                                flexWrap: "wrap",
                                fontSize: "12px",
                                alignItems: "center",
                              }}
                            >
                              {/* Local pricing */}
                              {isLocal && parseFloat(v.selling_price) > 0 && (
                                <span style={{ color: "#60a5fa" }}>
                                  🏪 Rs.{" "}
                                  {parseFloat(v.selling_price).toFixed(2)}
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      marginLeft: "4px",
                                      fontSize: "11px",
                                    }}
                                  >
                                    (margin{" "}
                                    {parseFloat(
                                      v.profit_margin_percentage || 0,
                                    ).toFixed(1)}
                                    %)
                                  </span>
                                </span>
                              )}
                              {/* Purchase price */}
                              {parseFloat(v.purchasing_price) > 0 && (
                                <span style={{ color: "var(--text-muted)" }}>
                                  Buy: Rs.{" "}
                                  {parseFloat(v.purchasing_price).toFixed(2)}
                                </span>
                              )}
                              {/* Sea/Air FOB */}
                              {(isSea || isAir) &&
                                (() => {
                                  const fob = calcFobUSD(v, usdRate);
                                  return fob >= 0.01 ? (
                                    <span
                                      style={{
                                        color: isSea ? "#34d399" : "#c084fc",
                                      }}
                                    >
                                      {isSea ? "🚢" : "✈️"} ${fob.toFixed(4)}{" "}
                                      FOB
                                    </span>
                                  ) : null;
                                })()}
                              {/* Ex-factory */}
                              {parseFloat(v.exfactoryprice) > 0 && (
                                <span style={{ color: "var(--text-muted)" }}>
                                  Ex-Fac: Rs.{" "}
                                  {parseFloat(v.exfactoryprice).toFixed(2)}
                                </span>
                              )}
                              {/* JC FOB */}
                              {parseFloat(v.jc_fob) > 0 && (
                                <span style={{ color: "var(--accent-cyan)" }}>
                                  JC FOB: ${parseFloat(v.jc_fob).toFixed(4)}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
