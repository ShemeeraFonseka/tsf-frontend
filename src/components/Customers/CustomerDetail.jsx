import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "./CustomerDetail.css";
import logoSrc from "./logo.png";

const CustomerDetail = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { cus_id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [prices, setPrices] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);

  const [formData, setFormData] = useState({
    product_id: "",
    variant_id: "",
    common_name: "",
    category: "",
    size_range: "",
    purchasing_price: "",
    margin: "",
    margin_percentage: "",
    selling_price: "",
    image: "",
    scientific_name: "",
  });

  useEffect(() => {
    fetchCustomer();
    fetchPrices();
    fetchProducts();
    const handleFocus = () => fetchPrices();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [cus_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customerlist/${cus_id}`);
      if (!res.ok) throw new Error("Failed to fetch customer");
      setCustomer(await res.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-products/${cus_id}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      const data = await res.json();
      // Debug: verify scientific_name is returned by the API
      if (data.length > 0)
        console.log(
          "[CustomerDetail] prices[0] scientific_name:",
          data[0].scientific_name,
        );
      setPrices(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productlist`);
      if (!res.ok) throw new Error("Failed to fetch products");
      setProducts(await res.json());
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setFormData((prev) => {
      if (!productId) {
        setSelectedProduct(null);
        return {
          ...prev,
          product_id: "",
          variant_id: "",
          common_name: "",
          category: "",
          size_range: "",
          purchasing_price: "",
          image: "",
          scientific_name: "",
        };
      }
      const product = products.find((p) => p.id === Number(productId));
      setSelectedProduct(product);
      console.log("[ProductSelect] image_url field:", product?.image_url);
      return {
        ...prev,
        product_id: productId,
        variant_id: "",
        common_name: product?.common_name || "",
        category: product?.category || "",
        size_range: "",
        purchasing_price: "",
        image: product?.image_url || "",
        scientific_name: product?.scientific_name || "",
      };
    });
  };

  const handleVariantSelect = (e) => {
    const variantId = e.target.value;
    if (!variantId || !selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        variant_id: "",
        size_range: "",
        purchasing_price: "",
      }));
      return;
    }
    const variant = selectedProduct.variants?.find(
      (v) => String(v.id) === String(variantId),
    );
    if (variant) {
      setFormData((prev) => ({
        ...prev,
        variant_id: String(variantId),
        size_range: `${variant.size} ${variant.unit}`,
        purchasing_price: variant.purchasing_price,
      }));
    }
  };

  const calculatePrices = (field, value) => {
    const data = { ...formData, [field]: value };
    const purchasingPrice = parseFloat(data.purchasing_price) || 0;
    let margin = parseFloat(data.margin) || 0;
    let marginPercentage = parseFloat(data.margin_percentage) || 0;
    let sellingPrice = parseFloat(data.selling_price) || 0;

    if (field === "purchasing_price") {
      data.purchasing_price = value;
      if (data.margin_percentage && parseFloat(data.margin_percentage) !== 0) {
        margin = (purchasingPrice * marginPercentage) / 100;
        sellingPrice = purchasingPrice + margin;
        data.margin = margin.toFixed(2);
        data.selling_price = sellingPrice.toFixed(2);
      } else if (data.margin && parseFloat(data.margin) !== 0) {
        sellingPrice = purchasingPrice + margin;
        marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
        data.margin_percentage = marginPercentage.toFixed(2);
        data.selling_price = sellingPrice.toFixed(2);
      } else if (data.selling_price && parseFloat(data.selling_price) !== 0) {
        margin = sellingPrice - purchasingPrice;
        marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
        data.margin = margin.toFixed(2);
        data.margin_percentage = marginPercentage.toFixed(2);
      }
    } else if (field === "margin_percentage") {
      margin = (purchasingPrice * marginPercentage) / (100 - marginPercentage);
      sellingPrice = purchasingPrice + margin;
      data.margin = margin.toFixed(2);
      data.selling_price = sellingPrice.toFixed(2);
    } else if (field === "margin") {
      sellingPrice = purchasingPrice + margin;
      marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
      data.margin_percentage = marginPercentage.toFixed(2);
      data.selling_price = sellingPrice.toFixed(2);
    } else if (field === "selling_price") {
      margin = sellingPrice - purchasingPrice;
      marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
      data.margin = margin.toFixed(2);
      data.margin_percentage = marginPercentage.toFixed(2);
    }
    setFormData(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPrice
        ? `${API_URL}/api/customer-products/${editingPrice.id}`
        : `${API_URL}/api/customer-products`;
      const method = editingPrice ? "PUT" : "POST";
      const payload = {
        cus_id: parseInt(cus_id),
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        variant_id: formData.variant_id ? parseInt(formData.variant_id) : null,
        common_name: formData.common_name,
        category: formData.category,
        scientific_name: formData.scientific_name || null,
        image_url: formData.image || null,
        size_range: formData.size_range,
        purchasing_price: parseFloat(formData.purchasing_price),
        margin: parseFloat(formData.margin) || 0,
        margin_percentage: parseFloat(formData.margin_percentage) || 0,
        selling_price: parseFloat(formData.selling_price),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      await fetchPrices();
      resetForm();
      alert(
        editingPrice
          ? "Price updated successfully!"
          : "Price added successfully!",
      );
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleEdit = async (price) => {
    if (products.length === 0) await fetchProducts();
    const product = products.find((p) => p.id === price.product_id);
    let variantId = "";
    if (product?.variants?.length > 0 && price.size_range) {
      const match = product.variants.find(
        (v) => `${v.size} ${v.unit}` === price.size_range,
      );
      if (match) variantId = String(match.id);
    }
    if (product) setSelectedProduct(product);
    setEditingPrice(price);
    setShowForm(true);
    setFormData({
      product_id: String(price.product_id),
      variant_id: variantId,
      common_name: price.common_name,
      category: price.category,
      size_range: price.size_range,
      purchasing_price: price.purchasing_price,
      margin: price.margin,
      margin_percentage: price.margin_percentage,
      selling_price: price.selling_price,
      scientific_name: price.scientific_name || "",
      image:
        price.image_url ||
        products.find((pr) => pr.id === price.product_id)?.image_url ||
        "",
    });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete custom price for "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/customer-products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      await fetchPrices();
      alert("Price deleted successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      variant_id: "",
      common_name: "",
      category: "",
      size_range: "",
      purchasing_price: "",
      margin: "",
      margin_percentage: "",
      selling_price: "",
      image: "",
      scientific_name: "",
    });
    setSelectedProduct(null);
    setEditingPrice(null);
    setShowForm(false);
  };

  const formatCategory = (cat) =>
    cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "—";
  const getProductDisplayName = (p) =>
    `${p.common_name || "Unnamed"} - ${formatCategory(p.category)}`;

  /* ─────────────────────────────────────────────────────────────────────
     PDF DOWNLOAD  —  Tropical Shellfish catalog style
     Layout: Logo header | Sub-info strip | Per-category tables
     Columns: Picture | Common Name | Scientific Name | Size Range + Selling Price (LKR)
  ───────────────────────────────────────────────────────────────────── */
  const handleDownloadPDF = async () => {
    if (prices.length === 0) {
      alert("No products to download");
      return;
    }

    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTableModule = await import("jspdf-autotable");
      const autoTable = autoTableModule.default;

      const doc = new jsPDF("p", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;

      const NAVY = [13, 71, 161];
      const NAVY_DARK = [8, 47, 114];
      const NAVY_LIGHT = [224, 232, 247];
      const WHITE = [255, 255, 255];
      const DARK = [20, 20, 40];
      const GREY_LINE = [180, 200, 230];

      // ── Header band ───────────────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 40, "F");
      try {
        doc.addImage(logoSrc, "PNG", margin, 7, 36, 26);
      } catch {
        /* no logo */
      }
      doc.setTextColor(...WHITE);
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Tropical Shellfish (Pvt) Ltd", margin + 42, 19);
      doc.setFontSize(8.5);
      doc.setFont(undefined, "normal");
      doc.text(
        "Fresh & Frozen Seafood Exporters  |  Quality You Can Trust",
        margin + 42,
        26,
      );

      // "PRICE LIST" badge
      doc.setFillColor(...WHITE);
      doc.roundedRect(pageW - margin - 30, 9, 30, 11, 2, 2, "F");
      doc.setTextColor(...NAVY_DARK);
      doc.setFontSize(9);
      doc.setFont(undefined, "bold");
      doc.text("PRICE LIST", pageW - margin - 15, 16.5, { align: "center" });

      // ── Sub-header strip ──────────────────────────────────────────
      doc.setFillColor(...NAVY_LIGHT);
      doc.rect(0, 40, pageW, 11, "F");
      doc.setDrawColor(...GREY_LINE);
      doc.setLineWidth(0.3);
      doc.line(0, 40, pageW, 40);
      doc.line(0, 51, pageW, 51);

      doc.setTextColor(...DARK);
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.text("Customer:", margin, 47);
      doc.setFont(undefined, "normal");
      doc.text(customer?.cus_name || "N/A", margin + 19, 47);

      const genDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFont(undefined, "bold");
      doc.text("Date:", pageW - margin - 50, 47);
      doc.setFont(undefined, "normal");
      doc.text(genDate, pageW - margin - 43, 47);

      // ── Group prices by category ──────────────────────────────────
      const grouped = prices.reduce((acc, p) => {
        const cat = formatCategory(p.category) || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
      }, {});

      let startY = 57;

      // ── Render each category ──────────────────────────────────────
      Object.entries(grouped).forEach(([category, items]) => {
        if (startY > pageH - 35) {
          doc.addPage();
          startY = 20;
        }

        // Category header bar
        doc.setFillColor(...NAVY);
        doc.rect(margin, startY, pageW - margin * 2, 8, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text(category.toUpperCase(), margin + 4, startY + 5.5);
        startY += 10;

        // Group by common_name within category
        const productMap = {};
        items.forEach((p) => {
          const key = `${p.common_name}__${p.scientific_name || ""}`;
          if (!productMap[key]) {
            productMap[key] = {
              common_name: String(p.common_name || "—"),
              scientific_name:
                p.scientific_name && String(p.scientific_name).trim() !== ""
                  ? String(p.scientific_name).trim()
                  : "—",
              category: p.category,
              variants: [],
            };
          }
          productMap[key].variants.push({
            size: String(p.size_range || "—"),
            price: `Rs. ${parseFloat(p.selling_price).toFixed(2)}`,
          });
        });

        // Flatten to rows
        const tableBody = [];
        const firstRowSet = new Set();

        Object.values(productMap).forEach((prod) => {
          prod.variants.forEach((v, vi) => {
            const rowIdx = tableBody.length;
            if (vi === 0) firstRowSet.add(rowIdx);
            tableBody.push({ prod, v, vi });
          });
        });

        const bodyRows = tableBody.map(({ prod, v, vi }) => [
          vi === 0 ? prod.common_name : "",
          vi === 0 ? prod.scientific_name : "",
          vi === 0 ? formatCategory(prod.category || "") : "",
          v.size,
          v.price,
        ]);

        autoTable(doc, {
          startY,
          margin: { left: margin, right: margin },
          head: [
            [
              { content: "Common Name", styles: { halign: "left" } },
              { content: "Scientific Name", styles: { halign: "left" } },
              { content: "Condition", styles: { halign: "left" } },
              { content: "Size", styles: { halign: "left" } },
              { content: "Selling Price (Rs)", styles: { halign: "right" } },
            ],
          ],
          body: bodyRows,
          theme: "grid",
          columnStyles: {
            0: {
              cellWidth: 45,
              halign: "left",
              valign: "middle",
              fontStyle: "bold",
              fontSize: 10,
            },
            1: {
              cellWidth: 40,
              halign: "left",
              valign: "middle",
              fontStyle: "italic",
              fontSize: 9,
              textColor: [50, 80, 150],
            },
            2: {
              cellWidth: 28,
              halign: "left",
              valign: "middle",
              fontSize: 10,
            },
            3: {
              cellWidth: 35,
              halign: "left",
              valign: "middle",
              fontSize: 10,
            },
            4: {
              halign: "right",
              valign: "middle",
              fontSize: 10,
              fontStyle: "bold",
              textColor: [0, 120, 0],
            },
          },
          headStyles: {
            fillColor: NAVY_DARK,
            textColor: WHITE,
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
          },
          bodyStyles: {
            fontSize: 10,
            cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
            minCellHeight: 14,
            textColor: DARK,
            lineColor: GREY_LINE,
            lineWidth: 0.3,
          },
          alternateRowStyles: {
            fillColor: [245, 248, 255],
          },
          willDrawCell: (data) => {
            if (data.section !== "body") return;
            const ri = data.row.index;
            if (!firstRowSet.has(ri) && data.column.index <= 2) {
              data.cell.styles.lineWidth = {
                top: 0,
                bottom: 0.3,
                left: 0.3,
                right: 0.3,
              };
            }
          },
        });

        startY = doc.lastAutoTable.finalY + 10;
      });

      // ── Footer on every page ──────────────────────────────────────
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...NAVY);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(7);
        doc.setFont(undefined, "normal");
        doc.text(
          "Tropical Shellfish (Pvt) Ltd  |  All prices in LKR  |  Prices subject to change without prior notice",
          pageW / 2,
          pageH - 4,
          { align: "center" },
        );
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 4, {
          align: "right",
        });
      }

      const safeName = (customer?.cus_name || "Customer").replace(
        /[^a-z0-9_\- ]/gi,
        "_",
      );
      doc.save(
        `${safeName}_Price_List_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error(err);
      alert(
        "Error generating PDF. Ensure jspdf and jspdf-autotable are installed.",
      );
    }
  };
  /* ══════════════════════════ RENDER ══════════════════════════════════ */
  return (
    <div className="pricelist-container">
      <div className="detail-back-row">
        <button
          onClick={() => navigate("/customerlist")}
          className="cancel-btn"
        >
          ← Back
        </button>
      </div>

      <h2>Custom Prices — {customer?.cus_name}</h2>

      <div className="add-section">
        <button className="apf-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ Add Custom Price"}
        </button>
        <button
          className="apf-btn"
          onClick={handleDownloadPDF}
          disabled={prices.length === 0}
        >
          📄 Download PDF
        </button>
      </div>

      {showForm && (
        <div className="priceform-container">
          <h3>{editingPrice ? "Edit Custom Price" : "Add Custom Price"}</h3>

          <form onSubmit={handleSubmit} className="apf-container">
            <label className="apf-label">Select Product</label>
            <select
              className="apf-input"
              value={formData.product_id}
              onChange={handleProductSelect}
              required
              disabled={!!editingPrice}
            >
              <option value="">— Select a Product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {getProductDisplayName(p)}
                </option>
              ))}
            </select>

            <label className="apf-label">Common Name</label>
            <input
              className="apf-input"
              value={formData.common_name}
              readOnly
              placeholder="Auto-filled from product"
            />

            <label className="apf-label">Scientific Name</label>
            <input
              className="apf-input"
              value={formData.scientific_name}
              readOnly
              placeholder="Auto-filled from product"
            />

            <label className="apf-label">Product Image</label>
            {formData.image ? (
              <div className="apf-image-preview">
                <img
                  src={
                    formData.image.startsWith("http")
                      ? formData.image
                      : `${API_URL}${formData.image.startsWith("/") ? "" : "/"}${formData.image}`
                  }
                  alt="Product"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #d0d8ef",
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "block";
                  }}
                />
                <span
                  style={{ display: "none", fontSize: "12px", color: "#888" }}
                >
                  Image not found
                </span>
              </div>
            ) : (
              <div className="apf-image-empty">No image available</div>
            )}

            <label className="apf-label">Category</label>
            <input
              className="apf-input"
              value={formatCategory(formData.category)}
              readOnly
              placeholder="Auto-filled from product"
            />

            <label className="apf-label">Size Range</label>
            {editingPrice ? (
              <input
                className="apf-input"
                value={formData.size_range}
                readOnly
              />
            ) : selectedProduct?.variants?.length > 0 ? (
              <select
                className="apf-input"
                value={formData.variant_id}
                onChange={handleVariantSelect}
                required
              >
                <option value="">— Select Size —</option>
                {selectedProduct.variants.map((v) => (
                  <option key={v.id} value={String(v.id)}>
                    {v.size} {v.unit}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="apf-input"
                value={formData.size_range}
                onChange={(e) =>
                  setFormData({ ...formData, size_range: e.target.value })
                }
                placeholder="Enter size range manually"
                required
              />
            )}
            {editingPrice && selectedProduct?.variants?.length > 0 && (
              <p className="apf-note">
                Size range cannot be changed when editing
              </p>
            )}

            <label className="apf-label">Purchasing Price (LKR)</label>
            <input
              className="apf-input"
              type="number"
              step="0.01"
              value={formData.purchasing_price}
              onChange={(e) =>
                calculatePrices("purchasing_price", e.target.value)
              }
              required
              readOnly={
                editingPrice || (!editingPrice && formData.variant_id !== "")
              }
              placeholder="Auto-filled or enter manually"
            />
            {editingPrice && (
              <p className="apf-note">
                Purchasing price cannot be changed when editing
              </p>
            )}

            <label className="apf-label">Margin (LKR)</label>
            <input
              className="apf-input"
              type="number"
              step="0.01"
              value={formData.margin}
              onChange={(e) => calculatePrices("margin", e.target.value)}
              placeholder="0.00"
            />

            <label className="apf-label">Margin %</label>
            <input
              className="apf-input"
              type="number"
              step="0.01"
              value={formData.margin_percentage}
              onChange={(e) =>
                calculatePrices("margin_percentage", e.target.value)
              }
              placeholder="0.00"
            />

            <label className="apf-label">Selling Price (LKR)</label>
            <input
              className="apf-input is-fob"
              type="number"
              step="0.01"
              value={formData.selling_price}
              onChange={(e) => calculatePrices("selling_price", e.target.value)}
              required
              placeholder="0.00"
            />

            <div className="form-btn-row">
              <button type="submit" className="apf-btn">
                {editingPrice ? "Update" : "Add"} Price
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="info">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="pricelist-table">
            <thead>
              <tr>
                <th>Common Name</th>
                <th>Category</th>
                <th>Size Range</th>
                <th>Purchasing Price</th>
                <th>Margin</th>
                <th>Margin %</th>
                <th>Selling Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.length === 0 && (
                <tr>
                  <td colSpan={8} className="muted">
                    No custom prices set
                  </td>
                </tr>
              )}
              {prices.map((price) => (
                <tr key={price.id}>
                  <td data-label="Common Name">{price.common_name}</td>
                  <td data-label="Category">
                    {formatCategory(price.category)}
                  </td>
                  <td data-label="Size Range">{price.size_range || "—"}</td>
                  <td data-label="Purchasing Price">
                    <span className="td-price">
                      Rs.{parseFloat(price.purchasing_price).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Margin">
                    <span className="td-margin">
                      Rs.{parseFloat(price.margin).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Margin %">
                    {parseFloat(price.margin_percentage).toFixed(2)}%
                  </td>
                  <td data-label="Selling Price">
                    <span className="td-sell">
                      Rs.{parseFloat(price.selling_price).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    <div className="actions-wrapper">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(price)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleDelete(price.id, price.common_name)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;
