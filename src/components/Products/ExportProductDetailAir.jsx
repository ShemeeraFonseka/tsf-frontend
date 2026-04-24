import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetail.css";

const ExportProductDetailAir = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUsdRate, setCurrentUsdRate] = useState(null);

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

    fetch(`${API_URL}/api/usd-rate`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) setCurrentUsdRate(data.rate);
      })
      .catch(() => {});
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
    if (s.toLowerCase() === "fish") return "🐟";
    if (s.toLowerCase() === "crustacean") return "🦞";
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
              <span className="pd-badge pd-badge-freight">✈️ Air Export</span>
            </div>
            {product.description && (
              <p className="pd-description">{product.description}</p>
            )}
            {currentUsdRate && (
              <p className="pd-usd-note">
                💱 USD Rate: Rs. {parseFloat(currentUsdRate).toFixed(2)}
              </p>
            )}
          </div>
        </div>

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
                    <th>Purchase (Rs)</th>
                    <th>Ex-Factory (Rs)</th>
                    <th>Ex-Factory (USD)</th>
                    <th>JC FOB (USD)</th>
                    <th>Multiplier</th>
                    <th>Divisor</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => {
                    const usdRate =
                      currentUsdRate || parseFloat(v.usdrate) || 1;
                    const exfUSD = parseFloat(v.exfactoryprice || 0) / usdRate;
                    return (
                      <tr key={v.id || i}>
                        <td>{v.size || "—"}</td>
                        <td>{v.unit || "—"}</td>
                        <td className="pd-price">
                          Rs. {parseFloat(v.purchasing_price || 0).toFixed(2)}
                        </td>
                        <td className="pd-price">
                          Rs. {parseFloat(v.exfactoryprice || 0).toFixed(2)}
                        </td>
                        <td className="pd-price pd-usd">
                          ${exfUSD.toFixed(2)}
                        </td>
                        <td className="pd-price pd-usd">
                          ${parseFloat(v.jc_fob || 0).toFixed(2)}
                        </td>
                        <td>{v.multiplier || "—"}</td>
                        <td>{v.divisor || "1"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportProductDetailAir;
