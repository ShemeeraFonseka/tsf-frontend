// components/Products/AddProductForm.jsx — UNIFIED
// Handles local + export sea + export air in one form
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddProductForm.css"; // keep existing CSS

const API_URL = process.env.REACT_APP_API_URL;
const sf = (v, d = 0) => (isFinite(parseFloat(v)) ? parseFloat(v) : d);

// ── Blank variant templates ─────────────────────────────────────
const blankLocalVariant = () => ({
  _tmp: Date.now() + Math.random(),
  size: "",
  unit: "kg",
  purchasing_price: "",
  profit: "",
  selling_price: "",
  profit_margin_percentage: "",
});

const blankExportVariant = () => ({
  _tmp: Date.now() + Math.random(),
  size: "",
  unit: "kg",
  // pricing model toggle: "purchase" | "jc_fob"
  model: "purchase",
  purchasing_price: "", // export purchasing price (same field as local)
  jc_fob: "",
  usdrate: "",
  labour_overhead: "",
  packing_cost: "",
  // profit toggle: "usd" | "lkr"
  profit_currency: "usd",
  profit_usd: "",
  profit_lkr: "",
  profit_margin: "",
  exfactoryprice: "",
  multiplier: "",
  divisor: "1",
});

// ── Local variant calculations ─────────────────────────────────
function calcLocal(variant, field, val) {
  const v = { ...variant, [field]: val };
  const pp = sf(v.purchasing_price);
  const pr = sf(v.profit);
  const sp = sf(v.selling_price);
  const pm = sf(v.profit_margin_percentage);

  if (field === "purchasing_price" || field === "profit") {
    const newSP = pp + sf(v.profit);
    const newPM = newSP > 0 ? (sf(v.profit) / newSP) * 100 : 0;
    return {
      ...v,
      selling_price: parseFloat(newSP.toFixed(2)),
      profit_margin_percentage: parseFloat(newPM.toFixed(2)),
    };
  }
  if (field === "selling_price") {
    const newPr = sp - pp;
    const newPM = sp > 0 ? (newPr / sp) * 100 : 0;
    return {
      ...v,
      profit: parseFloat(newPr.toFixed(2)),
      profit_margin_percentage: parseFloat(newPM.toFixed(2)),
    };
  }
  if (field === "profit_margin_percentage") {
    const newPr = pp > 0 ? (pm / (100 - pm)) * pp : 0;
    const newSP = pp + newPr;
    return {
      ...v,
      profit: parseFloat(newPr.toFixed(2)),
      selling_price: parseFloat(newSP.toFixed(2)),
    };
  }
  return v;
}

// ── Export variant calculations ────────────────────────────────
function calcExport(variant, field, val, usdRateOverride) {
  const v = { ...variant, [field]: val };
  const usdRate = sf(usdRateOverride || v.usdrate, 304);

  // sync profit LKR ↔ USD when profit field or currency changes
  if (field === "profit_usd") {
    v.profit_lkr = (sf(val) * usdRate).toFixed(2);
  } else if (field === "profit_lkr") {
    v.profit_usd = usdRate > 0 ? (sf(val) / usdRate).toFixed(4) : "0";
  } else if (field === "profit_currency") {
    // just toggled — don't change the numbers, but recalc the other side
    if (val === "usd" && v.profit_usd) {
      v.profit_lkr = (sf(v.profit_usd) * usdRate).toFixed(2);
    } else if (val === "lkr" && v.profit_lkr) {
      v.profit_usd =
        usdRate > 0 ? (sf(v.profit_lkr) / usdRate).toFixed(4) : "0";
    }
  } else if (field === "usdrate") {
    // USD rate changed — resync whichever profit the user last entered
    if (v.profit_currency === "usd" && v.profit_usd)
      v.profit_lkr = (sf(v.profit_usd) * sf(val, 304)).toFixed(2);
    else if (v.profit_currency === "lkr" && v.profit_lkr)
      v.profit_usd =
        sf(val, 304) > 0 ? (sf(v.profit_lkr) / sf(val, 304)).toFixed(4) : "0";
  }

  // recalculate exfactoryprice
  const profitUSD = sf(v.profit_usd);
  const labour = sf(v.labour_overhead);
  const packing = sf(v.packing_cost);
  const rate = sf(v.usdrate, 304);

  if (v.model === "purchase" && sf(v.purchasing_price) > 0) {
    const totalUSD = labour + packing + profitUSD;
    const exFactory = sf(v.purchasing_price) + totalUSD * rate;
    const fobUSD = rate > 0 ? exFactory / rate : 0;
    const pm = fobUSD > 0 ? (profitUSD / fobUSD) * 100 : 0;
    v.exfactoryprice = parseFloat(exFactory.toFixed(2));
    v.profit_margin = parseFloat(pm.toFixed(4));
  } else if (v.model === "jc_fob" && sf(v.jc_fob) > 0) {
    const totalUSD = sf(v.jc_fob) + profitUSD + packing + labour;
    const exFactory = totalUSD * rate;
    const fobUSD = totalUSD;
    const pm = fobUSD > 0 ? (profitUSD / fobUSD) * 100 : 0;
    v.exfactoryprice = parseFloat(exFactory.toFixed(2));
    v.profit_margin = parseFloat(pm.toFixed(4));
  }

  return v;
}

// ── Helpers for preparing payload ─────────────────────────────
// localVariant: the matching local variant (same index) — used to sync purchasing_price when product is both local+export
function finaliseVariant(v, types, localVariant = null) {
  const out = { id: v.id || Date.now(), size: v.size, unit: v.unit };

  if (types.includes("local")) {
    Object.assign(out, {
      purchasing_price: sf(v.purchasing_price),
      profit: sf(v.profit),
      selling_price: sf(v.selling_price),
      profit_margin_percentage: sf(v.profit_margin_percentage),
    });
  }

  if (types.includes("export_sea") || types.includes("export_air")) {
    // If product is also local, use the local variant purchasing_price (one source of truth).
    // If export-only, use the export variant purchasing_price.
    const pp = types.includes("local")
      ? sf(localVariant?.purchasing_price ?? v.purchasing_price)
      : sf(v.purchasing_price);

    Object.assign(out, {
      purchasing_price: pp, // single purchasing_price field — no export_purchasing_price
      jc_fob: sf(v.jc_fob),
      usdrate: sf(v.usdrate, 304),
      labour_overhead: sf(v.labour_overhead),
      packing_cost: sf(v.packing_cost),
      profit_usd: sf(v.profit_usd),
      profit_lkr: sf(v.profit_lkr),
      profit_currency: v.profit_currency || "usd",
      profit_margin: sf(v.profit_margin),
      exfactoryprice: sf(v.exfactoryprice),
      multiplier: sf(v.multiplier),
      divisor: sf(v.divisor, 1),
      model: v.model || "purchase",
    });
  }

  return out;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AddProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileRef = useRef(null);

  // ── form state ──
  const [form, setForm] = useState({
    common_name: "",
    scientific_name: "",
    description: "",
    category: "fresh",
    species_type: "fish",
    product_types: ["local"],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  // separate variant arrays
  const [localVariants, setLocalVariants] = useState([blankLocalVariant()]);
  const [exportVariants, setExportVariants] = useState([blankExportVariant()]);

  const [usdRate, setUsdRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const hasLocal = form.product_types.includes("local");
  const hasExport =
    form.product_types.includes("export_sea") ||
    form.product_types.includes("export_air");

  // ── fetch USD rate on mount ──
  useEffect(() => {
    fetch(`${API_URL}/api/usd-rate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rate) setUsdRate(String(d.rate));
      })
      .catch(() => {});
  }, []);

  // ── load product for edit ──
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
          product_types: p.product_types || ["local"],
        });
        setExistingImage(p.image_url || null);
        setImagePreview(p.image_url || null);

        // In the unified model ALL variants in the array are shared rows (one row per size).
        // Each variant carries both local fields (purchasing_price, profit, selling_price)
        // and export fields (exfactoryprice, jc_fob, usdrate, etc.).
        // Both local and export variant editors point to the SAME variant rows.
        const variants = p.variants || [];
        const types = p.product_types || ["local"];

        const mappedLocal = variants.map((v) => ({
          ...blankLocalVariant(),
          id: v.id,
          size: v.size || "",
          unit: v.unit || "kg",
          purchasing_price: v.purchasing_price ?? "",
          profit: v.profit ?? "",
          selling_price: v.selling_price ?? "",
          profit_margin_percentage: v.profit_margin_percentage ?? "",
        }));

        const mappedExport = variants.map((v) => ({
          ...blankExportVariant(),
          id: v.id,
          size: v.size || "",
          unit: v.unit || "kg",
          purchasing_price: v.purchasing_price ?? "",
          jc_fob: v.jc_fob ?? "",
          usdrate: v.usdrate ?? "",
          labour_overhead: v.labour_overhead ?? "",
          packing_cost: v.packing_cost ?? "",
          profit_usd: v.profit_usd ?? "",
          profit_lkr: v.profit_lkr ?? "",
          profit_currency: v.profit_currency || (v.profit_usd ? "usd" : "lkr"),
          profit_margin: v.profit_margin ?? "",
          exfactoryprice: v.exfactoryprice ?? "",
          multiplier: v.multiplier ?? "",
          divisor: v.divisor ?? "1",
          model:
            v.jc_fob > 0 && !(v.purchasing_price > 0) ? "jc_fob" : "purchase",
        }));

        setLocalVariants(
          mappedLocal.length ? mappedLocal : [blankLocalVariant()],
        );
        setExportVariants(
          mappedExport.length ? mappedExport : [blankExportVariant()],
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]); // eslint-disable-line

  // ── product_types toggle ──
  const toggleType = (type) => {
    setForm((prev) => {
      const has = prev.product_types.includes(type);
      const next = has
        ? prev.product_types.filter((t) => t !== type)
        : [...prev.product_types, type];
      // always keep at least one
      return { ...prev, product_types: next.length ? next : [type] };
    });
  };

  // ── image ──
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── local variant handlers ──
  const setLV = (idx, field, val) => {
    setLocalVariants((prev) =>
      prev.map((v, i) => (i === idx ? calcLocal(v, field, val) : v)),
    );
    // When purchasing_price changes and product is also export, recalc matching export variant exfactory
    if (field === "purchasing_price" && hasExport) {
      setExportVariants((prev) =>
        prev.map((v, i) => {
          if (i !== idx) return v;
          const newPP = sf(val);
          const rate = sf(v.usdrate || usdRate, 304);
          return calcExport(
            { ...v, purchasing_price: newPP },
            "purchasing_price",
            newPP,
            rate,
          );
        }),
      );
    }
  };
  const addLV = () => {
    setLocalVariants((p) => [...p, blankLocalVariant()]);
    // Add matching export row if product is also export
    if (hasExport) {
      const base = { ...blankExportVariant(), usdrate: usdRate };
      setExportVariants((p) => [...p, base]);
    }
  };
  const removeLV = (idx) => {
    setLocalVariants((p) => p.filter((_, i) => i !== idx));
    // Remove matching export row too
    if (hasExport) setExportVariants((p) => p.filter((_, i) => i !== idx));
  };

  // ── export variant handlers ──
  const setEV = (idx, field, val) => {
    setExportVariants((prev) =>
      prev.map((v, i) => {
        if (i !== idx) return v;
        const rate = field === "usdrate" ? val : v.usdrate || usdRate;
        let updated = calcExport(v, field, val, sf(rate, 304));
        return updated;
      }),
    );
  };

  // Called when a local variant purchasing_price changes — re-trigger export calc for matching export row
  const syncExportPurchasePrice = (localIdx, newPP) => {
    setExportVariants((prev) =>
      prev.map((v, i) => {
        if (i !== localIdx) return v;
        // inject the new purchasing_price into the export variant and recalc
        const rate = sf(v.usdrate || usdRate, 304);
        return calcExport(
          { ...v, purchasing_price: newPP },
          "purchasing_price",
          newPP,
          rate,
        );
      }),
    );
  };
  const addEV = () => {
    const matchingLocalPP = hasLocal
      ? (localVariants[exportVariants.length]?.purchasing_price ??
        localVariants[0]?.purchasing_price ??
        "")
      : "";
    const base = {
      ...blankExportVariant(),
      usdrate: usdRate,
      purchasing_price: matchingLocalPP,
    };
    const initialised = matchingLocalPP
      ? calcExport(base, "purchasing_price", matchingLocalPP, sf(usdRate, 304))
      : base;
    setExportVariants((p) => [...p, initialised]);
    // Add matching local row if product is also local
    if (hasLocal) setLocalVariants((p) => [...p, blankLocalVariant()]);
  };
  const removeEV = (idx) => {
    setExportVariants((p) => p.filter((_, i) => i !== idx));
    // Remove matching local row too
    if (hasLocal) setLocalVariants((p) => p.filter((_, i) => i !== idx));
  };

  // ── submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.common_name.trim()) {
      setError("Common name is required.");
      return;
    }
    if (!form.product_types.length) {
      setError("Select at least one product type.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("common_name", form.common_name);
      fd.append("scientific_name", form.scientific_name);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("species_type", form.species_type);
      fd.append("product_types", JSON.stringify(form.product_types));
      if (existingImage) fd.append("existing_image_url", existingImage);
      if (imageFile) fd.append("image", imageFile);

      // Build unified variant array — one row per size.
      // Local and export editors edit the same rows, so we merge them by index.
      // The row count is determined by whichever editor has more rows.
      const rowCount = Math.max(
        hasLocal ? localVariants.length : 0,
        hasExport ? exportVariants.length : 0,
      );

      const allVariants = Array.from({ length: rowCount }, (_, i) => {
        const lv = localVariants[i];
        const ev = exportVariants[i];
        // Start with a base from whichever exists
        const base = { id: lv?.id || ev?.id || Date.now() + i };

        if (hasLocal && lv) {
          Object.assign(base, {
            size: lv.size || "",
            unit: lv.unit || "kg",
            purchasing_price: sf(lv.purchasing_price),
            profit: sf(lv.profit),
            selling_price: sf(lv.selling_price),
            profit_margin_percentage: sf(lv.profit_margin_percentage),
          });
        }

        if (hasExport && ev) {
          // purchasing_price comes from local if product is also local, else from export editor
          const pp = hasLocal
            ? sf(lv?.purchasing_price)
            : sf(ev.purchasing_price);
          Object.assign(base, {
            size: ev.size || lv?.size || "",
            unit: ev.unit || lv?.unit || "kg",
            purchasing_price: pp,
            jc_fob: sf(ev.jc_fob),
            usdrate: sf(ev.usdrate, 304),
            labour_overhead: sf(ev.labour_overhead),
            packing_cost: sf(ev.packing_cost),
            profit_usd: sf(ev.profit_usd),
            profit_lkr: sf(ev.profit_lkr),
            profit_currency: ev.profit_currency || "usd",
            profit_margin: sf(ev.profit_margin),
            exfactoryprice: sf(ev.exfactoryprice),
            multiplier: sf(ev.multiplier),
            divisor: sf(ev.divisor, 1),
            model: ev.model || "purchase",
          });
        }

        return base;
      }).filter((v) => (v.size || "").trim());

      fd.append("variants", JSON.stringify(allVariants));

      const url = isEdit
        ? `${API_URL}/api/productlist/upload/${id}`
        : `${API_URL}/api/productlist/upload`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      // Navigate: local-only → local list, everything else → all products
      const types = form.product_types;
      const isLocalOnly =
        types.includes("local") &&
        !types.includes("export_sea") &&
        !types.includes("export_air");
      navigate(isLocalOnly ? "/productlist" : "/allproductlist");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── style helpers ──
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
        {/* ── PRODUCT TYPES ── */}
        <div className="apf-section">
          <h3 className="apf-section-title">Product Types</h3>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginBottom: "12px",
            }}
          >
            Select all that apply — a product can be local, export sea, and
            export air simultaneously.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { key: "local", label: "🏪 Local", color: "#60a5fa" },
              { key: "export_sea", label: "🚢 Export Sea", color: "#34d399" },
              { key: "export_air", label: "✈️ Export Air", color: "#c084fc" },
            ].map((t) => {
              const on = form.product_types.includes(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleType(t.key)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: `2px solid ${on ? t.color : "var(--border-subtle)"}`,
                    background: on ? `${t.color}18` : "var(--bg-surface)",
                    color: on ? t.color : "var(--text-muted)",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {on ? "✓ " : ""}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BASIC INFO ── */}
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, common_name: e.target.value }))
                }
                required
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
              <label className={lbl}>Category</label>
              <select
                className={inp}
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
              >
                <option value="live">Live</option>
                <option value="fresh">Fresh</option>
                <option value="frozen">Frozen</option>
              </select>
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                style={{ resize: "vertical" }}
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

        {/* ── LOCAL VARIANTS ── */}
        {hasLocal && (
          <div className="apf-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3 className="apf-section-title" style={{ margin: 0 }}>
                🏪 Local Variants (LKR)
              </h3>
              <button
                type="button"
                className="apf-btn"
                style={{ padding: "6px 16px", fontSize: "12px" }}
                onClick={addLV}
              >
                + Add Size
              </button>
            </div>

            {/* header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 110px 110px 110px 90px 36px",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              {[
                "Size",
                "Unit",
                "Purchase (Rs.)",
                "Profit (Rs.)",
                "Selling (Rs.)",
                "Margin %",
                "",
              ].map((h, i) => (
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
              ))}
            </div>

            {localVariants.map((v, i) => (
              <div
                key={v._tmp || i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 110px 110px 110px 90px 36px",
                  gap: "8px",
                  marginBottom: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  className={inp}
                  value={v.size}
                  onChange={(e) => setLV(i, "size", e.target.value)}
                  placeholder="200-300g"
                />
                <select
                  className={inp}
                  value={v.unit}
                  onChange={(e) => setLV(i, "unit", e.target.value)}
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
                  onChange={(e) => setLV(i, "purchasing_price", e.target.value)}
                  placeholder="0.00"
                />
                <input
                  className={inp}
                  type="number"
                  step="0.01"
                  value={v.profit}
                  onChange={(e) => setLV(i, "profit", e.target.value)}
                  placeholder="0.00"
                />
                <input
                  className={inp}
                  type="number"
                  step="0.01"
                  value={v.selling_price}
                  onChange={(e) => setLV(i, "selling_price", e.target.value)}
                  placeholder="0.00"
                />
                <input
                  className={inp}
                  type="number"
                  step="0.01"
                  value={v.profit_margin_percentage}
                  onChange={(e) =>
                    setLV(i, "profit_margin_percentage", e.target.value)
                  }
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => removeLV(i)}
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
          </div>
        )}

        {/* ── EXPORT VARIANTS ── */}
        {hasExport && (
          <div className="apf-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
              }}
            >
              <h3 className="apf-section-title" style={{ margin: 0 }}>
                {form.product_types.includes("export_sea") && "🚢 "}
                {form.product_types.includes("export_air") && "✈️ "}
                Export Variants
              </h3>
              <button
                type="button"
                className="apf-btn"
                style={{ padding: "6px 16px", fontSize: "12px" }}
                onClick={addEV}
              >
                + Add Size
              </button>
            </div>

            {exportVariants.map((v, i) => (
              <div
                key={v._tmp || i}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  marginBottom: "12px",
                  position: "relative",
                }}
              >
                {/* remove btn */}
                <button
                  type="button"
                  onClick={() => removeEV(i)}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "var(--radius-sm)",
                    color: "#f87171",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 160px",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <label className={lbl}>Size / Grade</label>
                    <input
                      className={inp}
                      value={v.size}
                      onChange={(e) => setEV(i, "size", e.target.value)}
                      placeholder="200-300g"
                    />
                  </div>
                  <div>
                    <label className={lbl}>Unit</label>
                    <select
                      className={inp}
                      value={v.unit}
                      onChange={(e) => setEV(i, "unit", e.target.value)}
                    >
                      {["kg", "g", "pcs", "box", "tray"].map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>USD Rate</label>
                    <input
                      className={inp}
                      type="number"
                      step="0.01"
                      value={v.usdrate || usdRate}
                      onChange={(e) => setEV(i, "usdrate", e.target.value)}
                      placeholder={usdRate || "304"}
                    />
                  </div>
                </div>

                {/* Pricing model toggle */}
                <div style={{ marginBottom: "14px" }}>
                  <label className={lbl}>Pricing Model</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      ["purchase", "💰 Purchase Price"],
                      ["jc_fob", "📋 JC FOB"],
                    ].map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEV(i, "model", m)}
                        style={{
                          padding: "7px 16px",
                          borderRadius: "var(--radius-sm)",
                          border: `1.5px solid ${v.model === m ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                          background:
                            v.model === m
                              ? "rgba(0,212,255,0.1)"
                              : "var(--bg-raised)",
                          color:
                            v.model === m
                              ? "var(--accent-cyan)"
                              : "var(--text-muted)",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pricing fields row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  {v.model === "purchase" ? (
                    <div>
                      <label
                        className={lbl}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        Purchase Price (Rs.)
                        {hasLocal && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "var(--text-muted)",
                              fontWeight: "400",
                            }}
                          >
                            ← from local
                          </span>
                        )}
                      </label>
                      {hasLocal ? (
                        // Mirror the matching local variant purchasing_price — read-only
                        // Uses same index; if no matching local row falls back to first local variant
                        <div>
                          <input
                            className={inp}
                            type="number"
                            value={
                              localVariants[i]?.purchasing_price ??
                              localVariants[0]?.purchasing_price ??
                              ""
                            }
                            readOnly
                            placeholder="Enter in Local Variants above"
                            style={{
                              background: "var(--bg-deep)",
                              color: "var(--accent-cyan)",
                              cursor: "not-allowed",
                              fontWeight: "700",
                            }}
                          />
                          {!localVariants[i] && localVariants[0] && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#facc15",
                                marginTop: "3px",
                              }}
                            >
                              ⚠ No matching local row — using row 1 price
                            </div>
                          )}
                        </div>
                      ) : (
                        // Export-only product — editable
                        <input
                          className={inp}
                          type="number"
                          step="0.01"
                          value={v.purchasing_price}
                          onChange={(e) =>
                            setEV(i, "purchasing_price", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className={lbl}>JC FOB (USD)</label>
                      <input
                        className={inp}
                        type="number"
                        step="0.0001"
                        value={v.jc_fob}
                        onChange={(e) => setEV(i, "jc_fob", e.target.value)}
                        placeholder="0.0000"
                      />
                    </div>
                  )}
                  <div>
                    <label className={lbl}>Labour Overhead (USD)</label>
                    <input
                      className={inp}
                      type="number"
                      step="0.0001"
                      value={v.labour_overhead}
                      onChange={(e) =>
                        setEV(i, "labour_overhead", e.target.value)
                      }
                      placeholder="0.0000"
                    />
                  </div>
                  <div>
                    <label className={lbl}>Packing Cost (USD)</label>
                    <input
                      className={inp}
                      type="number"
                      step="0.0001"
                      value={v.packing_cost}
                      onChange={(e) => setEV(i, "packing_cost", e.target.value)}
                      placeholder="0.0000"
                    />
                  </div>

                  {/* Profit with LKR/USD toggle */}
                  <div>
                    <label
                      className={lbl}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Profit</span>
                      {/* toggle pill */}
                      <div
                        style={{
                          display: "flex",
                          background: "var(--bg-raised)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "20px",
                          overflow: "hidden",
                          fontSize: "10px",
                        }}
                      >
                        {["usd", "lkr"].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEV(i, "profit_currency", c)}
                            style={{
                              padding: "2px 8px",
                              border: "none",
                              background:
                                v.profit_currency === c
                                  ? "var(--accent-cyan)"
                                  : "transparent",
                              color:
                                v.profit_currency === c
                                  ? "#000"
                                  : "var(--text-muted)",
                              fontWeight: "700",
                              cursor: "pointer",
                              fontSize: "10px",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {c.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </label>
                    {v.profit_currency === "usd" ? (
                      <div style={{ position: "relative" }}>
                        <input
                          className={inp}
                          type="number"
                          step="0.0001"
                          value={v.profit_usd}
                          onChange={(e) =>
                            setEV(i, "profit_usd", e.target.value)
                          }
                          placeholder="0.0000"
                          style={{ paddingRight: "48px" }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            pointerEvents: "none",
                          }}
                        >
                          USD
                        </span>
                      </div>
                    ) : (
                      <div style={{ position: "relative" }}>
                        <input
                          className={inp}
                          type="number"
                          step="0.01"
                          value={v.profit_lkr}
                          onChange={(e) =>
                            setEV(i, "profit_lkr", e.target.value)
                          }
                          placeholder="0.00"
                          style={{ paddingRight: "40px" }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            pointerEvents: "none",
                          }}
                        >
                          Rs.
                        </span>
                      </div>
                    )}
                    {/* show converted value */}
                    {v.profit_currency === "usd" && v.profit_usd && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "3px",
                        }}
                      >
                        ≈ Rs.{" "}
                        {(
                          sf(v.profit_usd) * sf(v.usdrate || usdRate, 304)
                        ).toFixed(2)}
                      </div>
                    )}
                    {v.profit_currency === "lkr" && v.profit_lkr && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "3px",
                        }}
                      >
                        ≈ $
                        {sf(v.usdrate || usdRate, 304) > 0
                          ? (
                              sf(v.profit_lkr) / sf(v.usdrate || usdRate, 304)
                            ).toFixed(4)
                          : "0"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculated results */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <label className={lbl}>Ex-Factory (Rs.) — auto</label>
                    <input
                      className={inp}
                      value={v.exfactoryprice || ""}
                      readOnly
                      style={{
                        background: "var(--bg-deep)",
                        color: "var(--accent-cyan)",
                        fontWeight: "700",
                      }}
                    />
                  </div>
                  <div>
                    <label className={lbl}>FOB USD — auto</label>
                    <input
                      className={inp}
                      value={
                        v.exfactoryprice && sf(v.usdrate || usdRate, 304) > 0
                          ? (
                              sf(v.exfactoryprice) /
                              sf(v.usdrate || usdRate, 304)
                            ).toFixed(4)
                          : ""
                      }
                      readOnly
                      style={{
                        background: "var(--bg-deep)",
                        color: "var(--accent-cyan)",
                        fontWeight: "700",
                      }}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Profit Margin % — auto</label>
                    <input
                      className={inp}
                      value={
                        v.profit_margin
                          ? `${parseFloat(v.profit_margin).toFixed(2)}%`
                          : ""
                      }
                      readOnly
                      style={{
                        background: "var(--bg-deep)",
                        color: "var(--text-secondary)",
                      }}
                    />
                  </div>
                  <div>
                    {/* Multiplier & Divisor side by side */}
                    <label className={lbl}>
                      Gross Weight (Multiplier / Divisor)
                    </label>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                      }}
                    >
                      <input
                        className={inp}
                        type="number"
                        step="0.01"
                        value={v.multiplier}
                        onChange={(e) => setEV(i, "multiplier", e.target.value)}
                        placeholder="Multiplier"
                      />
                      <input
                        className={inp}
                        type="number"
                        step="0.01"
                        value={v.divisor}
                        onChange={(e) => setEV(i, "divisor", e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
