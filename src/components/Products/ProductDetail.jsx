import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetail.css";

const ProductDetail = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/productlist/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]); // eslint-disable-line

  const formatCategory = (c) =>
    !c ? "—" : c.charAt(0).toUpperCase() + c.slice(1);

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
    const v = s.toLowerCase();
    if (v === "fish") return "🐟";
    if (v === "crustacean") return "🦞";
    return "🌊";
  };

  if (loading)
    return (
      <div className="pd-container">
        <div className="pd-loading">Loading…</div>
      </div>
    );
  if (error)
    return (
      <div className="pd-container">
        <div className="pd-error">Error: {error}</div>
      </div>
    );
  if (!product) return null;

  const variants = product.variants || [];

  return (
    <div className="pd-container">
      <div className="pd-back-row">
        <button onClick={() => navigate(-1)} className="cancel-btn">
          ← Back
        </button>
      </div>

      <div className="pd-card">
        {/* ── Image + Header ── */}
        <div className="pd-header">
          <div className="pd-image-wrap">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.common_name}
                className="pd-image"
                onError={(e) => {
                  e.target.src = "/images/placeholder-seafood.png";
                }}
              />
            ) : (
              <div className="pd-image-placeholder">
                🌊<span>No Image</span>
              </div>
            )}
          </div>

          <div className="pd-info">
            <h1 className="pd-common-name">{product.common_name}</h1>
            {product.scientific_name && (
              <p className="pd-scientific-name">{product.scientific_name}</p>
            )}
            <div className="pd-badges">
              {product.category && (
                <span
                  className={`pd-badge pd-badge-cat pd-badge-${product.category}`}
                >
                  {getCategoryIcon(product.category)}{" "}
                  {formatCategory(product.category)}
                </span>
              )}
              {product.species_type && (
                <span className="pd-badge pd-badge-species">
                  {getSpeciesIcon(product.species_type)}{" "}
                  {product.species_type.charAt(0).toUpperCase() +
                    product.species_type.slice(1)}
                </span>
              )}
            </div>
            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}
          </div>
        </div>

        {/* ── Variants Table ── */}
        <div className="pd-variants-section">
          <h2 className="pd-variants-title">Size &amp; Pricing</h2>
          {variants.length === 0 ? (
            <p className="pd-no-variants">No variants added yet.</p>
          ) : (
            <div className="pd-table-wrap">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Unit</th>
                    <th>Purchase Price</th>
                    <th>Profit</th>
                    <th>Selling Price</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.id || i}>
                      <td>{v.size || "—"}</td>
                      <td>{v.unit || "—"}</td>
                      <td className="pd-price">
                        Rs. {parseFloat(v.purchasing_price || 0).toFixed(2)}
                      </td>
                      <td className="pd-price">
                        Rs. {parseFloat(v.profit || 0).toFixed(2)}
                      </td>
                      <td className="pd-price pd-selling">
                        Rs. {parseFloat(v.selling_price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
