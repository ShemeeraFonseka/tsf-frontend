// components/Products/AddProductForm.jsx — MASTER CATALOGUE
// Products are type-agnostic. Only base info + variants (size, unit, purchasing_price).
// Local/export pricing is set separately from the respective list pages.
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddProductForm.css";

const API_URL = process.env.REACT_APP_API_URL;
const sf = (v, d = 0) => (isFinite(parseFloat(v)) ? parseFloat(v) : d);

const blankVariant = () => ({
  _tmp: Date.now(),
  size: "",
  unit: "kg",
  purchasing_price: "",
});

export default function AddProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    common_name: "",
    scientific_name: "",
    description: "",
    species_type: "fish",
  });

  const [variants, setVariants] = useState([blankVariant()]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Load product for edit ─────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`${API_URL}/api/productlist/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setForm({
          common_name: p.common_name || "",
          scientific_name: p.scientific_name || "",
          description: p.description || "",
          category: p.category || "fresh",
          species_type: p.species_type || "fish",
        });
        setExistingImage(p.image_url || null);
        setImagePreview(p.image_url || null);

        const mapped = (p.variants || []).map((v) => ({
          _tmp: v.id,
          id: v.id,
          size: v.size || "",
          unit: v.unit || "kg",
          purchasing_price: v.purchasing_price ?? "",
        }));
        setVariants(mapped.length ? mapped : [blankVariant()]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]); // eslint-disable-line

  // ── Image handler ─────────────────────────────────────────────
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Variant handlers ──────────────────────────────────────────
  const setV = (idx, field, val) =>
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v)),
    );

  const addV = () => setVariants((p) => [...p, blankVariant()]);
  const removeV = (idx) => setVariants((p) => p.filter((_, i) => i !== idx));

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.common_name.trim()) {
      setError("Common name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("common_name", form.common_name);
      fd.append("scientific_name", form.scientific_name);
      fd.append("description", form.description);
      fd.append("species_type", form.species_type);
      if (existingImage) fd.append("existing_image_url", existingImage);
      if (imageFile) fd.append("image", imageFile);

      const cleanVariants = variants
        .filter((v) => (v.size || "").trim())
        .map((v) => ({
          id: v.id || Date.now(),
          size: v.size.trim(),
          unit: v.unit || "kg",
          purchasing_price: sf(v.purchasing_price),
        }));

      fd.append("variants", JSON.stringify(cleanVariants));

      const url = isEdit
        ? `${API_URL}/api/productlist/upload/${id}`
        : `${API_URL}/api/productlist/upload`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      navigate("/allproductlist");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = "apf-input";
  const lbl = "apf-label";

  if (loading)
    return (
      <div className="pricelist-container">
        <div className="info">Loading…</div>
      </div>
    );

  return (
    <div className="pricelist-container">
      <div className="detail-back-row">
        <button onClick={() => navigate(-1)} className="cancel-btn">
          ← Back
        </button>
      </div>
      <h2>{isEdit ? "Edit Product" : "Add Product"}</h2>

      <form onSubmit={handleSubmit} className="apf-container">
        {/* ── PRODUCT DETAILS ── */}
        <div className="apf-section">
          <h3 className="apf-section-title">Product Details</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
            }}
          >
            <div>
              <label className={lbl}>Common Name *</label>
              <input
                className={inp}
                value={form.common_name}
                required
                onChange={(e) =>
                  setForm((p) => ({ ...p, common_name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={lbl}>Scientific Name</label>
              <input
                className={inp}
                value={form.scientific_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, scientific_name: e.target.value }))
                }
              />
            </div>

            <div>
              <label className={lbl}>Species Type</label>
              <select
                className={inp}
                value={form.species_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, species_type: e.target.value }))
                }
              >
                <option value="fish">Fish</option>
                <option value="crustacean">Crustacean</option>
                <option value="mollusc">Mollusc</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label className={lbl}>Description</label>
              <textarea
                className={inp}
                rows={3}
                value={form.description}
                style={{ resize: "vertical" }}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* ── IMAGE ── */}
        <div className="apf-section">
          <h3 className="apf-section-title">Product Image</h3>
          <div
            className="apf-image-upload-area"
            onClick={() => fileRef.current?.click()}
            style={{ cursor: "pointer" }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                className="apf-image-preview-img"
              />
            ) : (
              <div className="apf-image-placeholder">Click to upload image</div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImage}
          />
        </div>

        {/* ── VARIANTS ── */}
        <div className="apf-section">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <div>
              <h3 className="apf-section-title" style={{ margin: 0 }}>
                Sizes & Purchasing Price
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  margin: "4px 0 0",
                }}
              >
                Profit, selling price and export pricing are set from each
                product list separately.
              </p>
            </div>
            <button
              type="button"
              className="apf-btn"
              style={{ padding: "6px 16px", fontSize: "12px" }}
              onClick={addV}
            >
              + Add Size
            </button>
          </div>

          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 160px 36px",
              gap: "8px",
              marginBottom: "6px",
            }}
          >
            {["Size / Grade", "Unit", "Purchasing Price (Rs.)", ""].map(
              (h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {h}
                </span>
              ),
            )}
          </div>

          {variants.map((v, i) => (
            <div
              key={v._tmp || i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 100px 160px 36px",
                gap: "8px",
                marginBottom: "8px",
                alignItems: "center",
              }}
            >
              <input
                className={inp}
                value={v.size}
                onChange={(e) => setV(i, "size", e.target.value)}
                placeholder="e.g. 200-300g"
              />

              <select
                className={inp}
                value={v.unit}
                onChange={(e) => setV(i, "unit", e.target.value)}
              >
                {["kg", "g", "pcs", "box", "tray"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>

              <input
                className={inp}
                type="number"
                step="0.01"
                value={v.purchasing_price}
                onChange={(e) => setV(i, "purchasing_price", e.target.value)}
                placeholder="0.00"
              />

              <button
                type="button"
                onClick={() => removeV(i)}
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "#f87171",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                ✕
              </button>
            </div>
          ))}

          {variants.length === 0 && (
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                padding: "12px 0",
              }}
            >
              No sizes added yet. Click "+ Add Size" to add one.
            </div>
          )}
        </div>

        {/* ── ERROR & SUBMIT ── */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "var(--radius-sm)",
              color: "#f87171",
              fontSize: "13px",
            }}
          >
            ⚠ {error}
          </div>
        )}

        <div className="form-btn-row">
          <button type="submit" className="apf-btn" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Update Product" : "Add Product"}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
