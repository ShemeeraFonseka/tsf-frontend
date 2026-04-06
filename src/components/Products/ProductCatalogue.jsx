import React, { useEffect, useState } from "react";
import "./Productlist.css";
import "./ProductCatalogue.css";

const getCategoryBadgeClass = (category) => {
  if (!category) return "badge-default-cat";
  const val = category.toLowerCase();
  if (val === "live") return "badge-live";
  if (val === "fresh") return "badge-fresh";
  if (val === "frozen") return "badge-frozen";
  return "badge-default-cat";
};
const getCategoryBadgeIcon = (category) => {
  if (!category) return "";
  const val = category.toLowerCase();
  if (val === "live") return "🟢";
  if (val === "fresh") return "💧";
  if (val === "frozen") return "❄️";
  return "";
};
const getSpeciesBadgeClass = (s) => {
  if (!s) return "badge-default";
  const v = s.toLowerCase();
  if (v === "fish") return "badge-fish";
  if (v === "crustacean") return "badge-crustacean";
  return "badge-default";
};
const getSpeciesBadgeIcon = (s) => {
  if (!s) return "🌊";
  const v = s.toLowerCase();
  if (v === "fish") return "🐟";
  if (v === "crustacean") return "🦞";
  return "🌊";
};

const SECTION_CATEGORIES = [
  { name: "Oyster", keywords: ["oyster", "depurated oyster"] },
  {
    name: "Clams",
    keywords: [
      "clam",
      "clams",
      "pen clams",
      "short neck clams",
      "blood clams",
      "sea clams",
      "mangrove clams",
    ],
  },
  { name: "Mussel", keywords: ["mussel", "brown mussel", "green mussel"] },
  { name: "Crab", keywords: ["crab", "sea crab", "mud crab", "cut crab"] },
  {
    name: "Prawn",
    keywords: [
      "prawn",
      "flowery prawn",
      "black tiger",
      "white prawn",
      "lobster",
    ],
  },
  { name: "Scampi", keywords: ["scampi"] },
  { name: "Cuttlefish", keywords: ["cuttlefish", "squid"] },
  { name: "Octopus", keywords: ["octopus", "baby octopus"] },
  {
    name: "Fish",
    keywords: [
      "fish",
      "jack",
      "eel",
      "tuna",
      "tilapia",
      "mackerel",
      "rohu",
      "sardine",
      "mullet",
      "barramundi",
      "catla",
      "parrot",
      "red mullet",
      "scad",
      "mahi mahi",
      "anchovy",
      "snapper",
      "grouper",
      "seer",
      "salmon",
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

const SPECIES_TYPES = [
  { value: "all", label: "All Products", icon: "🌊" },
  { value: "crustacean", label: "Crustacean", icon: "🦞" },
  { value: "fish", label: "Fish", icon: "🐟" },
];

function getProductSection(product) {
  const name = product.common_name?.toLowerCase() || "";
  for (const s of SECTION_CATEGORIES) {
    if (s.keywords.some((k) => name.includes(k))) return s.name;
  }
  return "Other";
}

export default function ProductCatalogue() {
  const API_URL = process.env.REACT_APP_API_URL;

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/productlist`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setItems(data);
        setFilteredItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []); // eslint-disable-line

  useEffect(() => {
    let result = items;
    if (selectedSpeciesType !== "all")
      result = result.filter(
        (i) => i.species_type?.toLowerCase() === selectedSpeciesType,
      );
    if (searchQuery.trim())
      result = result.filter(
        (i) =>
          i.common_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    setFilteredItems(result);
  }, [selectedSpeciesType, searchQuery, items]);

  const getSpeciesTypeCount = (val) =>
    val === "all"
      ? items.length
      : items.filter((i) => i.species_type?.toLowerCase() === val).length;

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_URL}${url}`;
  };

  // Group into sections
  const sectionMap = {};
  SECTION_CATEGORIES.forEach((s) => {
    sectionMap[s.name] = [];
  });
  sectionMap["Other"] = [];
  filteredItems.forEach((p) => sectionMap[getProductSection(p)].push(p));

  const sectionsWithProducts = [
    ...SECTION_CATEGORIES.map((s) => s.name),
    "Other",
  ].filter((s) => sectionMap[s]?.length > 0);

  return (
    <div className="pricelist-container">
      {/* ── Header ── */}
      <h2>🐠 Product Catalogue</h2>
      <p className="cat-subtitle">
        Browse our full range of fresh, frozen and live seafood products
      </p>

      {/* ── Toolbar ── */}
      <div className="cat-toolbar">
        {/* Search */}
        <div className="cat-search-wrap">
          <span className="cat-search-icon">🔍</span>
          <input
            className="cat-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products…"
          />
          {searchQuery && (
            <button
              className="cat-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <span className="cat-count">
          {filteredItems.length} product{filteredItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Species Filter Pills ── */}
      <div className="species-filter">
        {SPECIES_TYPES.map((type) => {
          const count = getSpeciesTypeCount(type.value);
          return (
            <button
              key={type.value}
              className={`species-pill ${selectedSpeciesType === type.value ? "active" : ""}`}
              onClick={() => setSelectedSpeciesType(type.value)}
              disabled={count === 0 && type.value !== "all"}
            >
              <span className="species-icon">{type.icon}</span>
              <span className="species-label">{type.label}</span>
              <span className="species-count">({count})</span>
            </button>
          );
        })}
      </div>

      {loading && <div className="info">Loading catalogue…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="cat-empty">
          <span className="cat-empty-icon">🐚</span>
          <p>No products found{searchQuery ? ` for "${searchQuery}"` : ""}.</p>
        </div>
      )}

      {/* ── Sections ── */}
      {!loading &&
        !error &&
        sectionsWithProducts.map((section) => (
          <div key={section} className="cat-section">
            <div className="cat-section-header">
              <span className="cat-section-icon">
                {SECTION_ICONS[section] || "📦"}
              </span>
              <span className="cat-section-name">{section}</span>
              <span className="cat-section-count">
                {sectionMap[section].length}
              </span>
            </div>

            <div className="cat-grid">
              {sectionMap[section].map((product) => {
                const imgSrc = getImageUrl(product.image_url);
                const variants = product.variants || [];
                const minPrice =
                  variants.length > 0
                    ? Math.min(
                        ...variants.map(
                          (v) => parseFloat(v.selling_price) || 0,
                        ),
                      )
                    : null;
                const maxPrice =
                  variants.length > 0
                    ? Math.max(
                        ...variants.map(
                          (v) => parseFloat(v.selling_price) || 0,
                        ),
                      )
                    : null;

                return (
                  <div
                    key={product.id}
                    className="cat-card"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Image */}
                    <div className="cat-card-img-wrap">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={product.common_name}
                          className="cat-card-img"
                        />
                      ) : (
                        <div className="cat-card-img-placeholder">🐟</div>
                      )}
                      {/* Category badge overlay */}
                      <span
                        className={`cat-card-badge category-badge ${getCategoryBadgeClass(product.category)}`}
                      >
                        {getCategoryBadgeIcon(product.category)}{" "}
                        {product.category
                          ? product.category.charAt(0).toUpperCase() +
                            product.category.slice(1)
                          : "—"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="cat-card-body">
                      <h3 className="cat-card-name">{product.common_name}</h3>
                      {product.scientific_name && (
                        <p className="cat-card-scientific">
                          {product.scientific_name}
                        </p>
                      )}

                      {/* Species */}
                      <span
                        className={`species-badge ${getSpeciesBadgeClass(product.species_type)} cat-card-species`}
                      >
                        {getSpeciesBadgeIcon(product.species_type)}{" "}
                        {product.species_type
                          ? product.species_type.charAt(0).toUpperCase() +
                            product.species_type.slice(1)
                          : "—"}
                      </span>

                      {/* Variants summary */}
                      {variants.length > 0 ? (
                        <div className="cat-card-variants">
                          <span className="cat-card-variant-count">
                            {variants.length} size
                            {variants.length !== 1 ? "s" : ""} available
                          </span>
                          {minPrice != null && minPrice > 0 && (
                            <span className="cat-card-price">
                              Rs. {minPrice.toFixed(2)}
                              {maxPrice !== minPrice &&
                                ` – ${maxPrice.toFixed(2)}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="cat-card-variants">
                          <span className="cat-card-variant-count">
                            Contact for pricing
                          </span>
                        </div>
                      )}

                      <button className="cat-card-btn">View Details →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {/* ══════════ PRODUCT DETAIL MODAL ══════════ */}
      {selectedProduct && (
        <div
          className="cat-modal-overlay"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              className="cat-modal-close"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            {/* Image */}
            <div className="cat-modal-img-wrap">
              {getImageUrl(selectedProduct.image_url) ? (
                <img
                  src={getImageUrl(selectedProduct.image_url)}
                  alt={selectedProduct.common_name}
                  className="cat-modal-img"
                />
              ) : (
                <div className="cat-modal-img-placeholder">🐟</div>
              )}
            </div>

            {/* Info */}
            <div className="cat-modal-body">
              <div className="cat-modal-badges">
                <span
                  className={`category-badge ${getCategoryBadgeClass(selectedProduct.category)}`}
                >
                  {getCategoryBadgeIcon(selectedProduct.category)}{" "}
                  {selectedProduct.category
                    ? selectedProduct.category.charAt(0).toUpperCase() +
                      selectedProduct.category.slice(1)
                    : "—"}
                </span>
                <span
                  className={`species-badge ${getSpeciesBadgeClass(selectedProduct.species_type)}`}
                >
                  {getSpeciesBadgeIcon(selectedProduct.species_type)}{" "}
                  {selectedProduct.species_type
                    ? selectedProduct.species_type.charAt(0).toUpperCase() +
                      selectedProduct.species_type.slice(1)
                    : "—"}
                </span>
              </div>

              <h2 className="cat-modal-name">{selectedProduct.common_name}</h2>
              {selectedProduct.scientific_name && (
                <p className="cat-modal-scientific">
                  {selectedProduct.scientific_name}
                </p>
              )}
              {selectedProduct.description && (
                <p className="cat-modal-desc">{selectedProduct.description}</p>
              )}

              {/* Variants table */}
              {selectedProduct.variants?.length > 0 && (
                <div className="cat-modal-variants">
                  <h4 className="cat-modal-variants-title">
                    Available Sizes & Pricing
                  </h4>
                  <div className="cat-modal-variant-list">
                    {selectedProduct.variants.map((v, i) => (
                      <div key={v.id || i} className="cat-modal-variant-row">
                        <div className="cat-modal-variant-size">
                          <span className="cat-modal-variant-label">Size</span>
                          <span className="cat-modal-variant-val">
                            {v.size && v.size !== "-" ? v.size : "—"}
                            {v.unit ? ` ${v.unit}` : ""}
                          </span>
                        </div>
                        <div className="cat-modal-variant-price">
                          <span className="cat-modal-variant-label">
                            Selling Price
                          </span>
                          <span className="cat-modal-variant-val price-cell">
                            {parseFloat(v.selling_price) > 0
                              ? `Rs. ${parseFloat(v.selling_price).toFixed(2)}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="cat-modal-note">
                💬 Contact us for bulk orders and custom pricing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
