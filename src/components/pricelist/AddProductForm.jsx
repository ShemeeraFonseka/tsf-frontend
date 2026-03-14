import React, { useState, useEffect } from "react";
import "./AddProductForm.css";
import { useParams, useNavigate } from "react-router-dom";

const AddProductForm = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [form, setForm] = useState({
    common_name: "",
    scientific_name: "",
    description: "",
    category: "live",
    species_type: "crustacean",
    image: null,
    existing_image_url: null,
  });

  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({
    size: "",
    unit: "kg",
    purchasing_price: "",
    profit: "",
    profit_margin_percentage: "",
    selling_price: "",
  });
  const [editingVariant, setEditingVariant] = useState(null);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    return `${API_URL}${imageUrl}`;
  };

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id, isEditMode]);

  const fetchProduct = async () => {
    setLoading(true);
    setError("");

    try {
      const url = `${API_URL}/api/productlist/${id}`;
      console.log("Fetching product from:", url);

      const res = await fetch(url);

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server returned ${res.status}: ${res.statusText}. Make sure the backend server is running.`,
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch product");
      }

      const product = await res.json();
      console.log("Product fetched:", product);

      setForm({
        common_name: product.common_name || "",
        scientific_name: product.scientific_name || "",
        description: product.description || "",
        category: product.category || "live",
        species_type: product.species_type || "crustacean",
        image: null,
        existing_image_url: product.image_url || null,
      });

      if (product.image_url) setPreview(getImageUrl(product.image_url));
      if (product.variants && Array.isArray(product.variants)) {
        setVariants(product.variants);
      }
    } catch (err) {
      console.error("Fetch product error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setSuccess("");
    setError("");
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    const variantData = editingVariant ? editingVariant : newVariant;
    const setter = editingVariant ? setEditingVariant : setNewVariant;

    // Update the field
    setter((prev) => ({ ...prev, [name]: value }));

    // Auto-calculate based on which field was changed
    const purchasing_price =
      name === "purchasing_price"
        ? parseFloat(value) || 0
        : parseFloat(variantData.purchasing_price) || 0;

    if (name === "profit") {
      const profit = parseFloat(value) || 0;
      if (purchasing_price > 0) {
        // Calculate selling price and margin percentage
        const sellingPrice = purchasing_price + profit;
        const marginPercentage =
          sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        setter((prev) => ({
          ...prev,
          profit: value,
          selling_price: sellingPrice.toFixed(2),
          profit_margin_percentage: marginPercentage.toFixed(2),
        }));
      }
    } else if (name === "profit_margin_percentage") {
      const marginPercentage = parseFloat(value) || 0;
      if (purchasing_price > 0 && marginPercentage < 100) {
        // Calculate selling price and profit based on margin percentage
        // Formula: selling_price = purchasing_price / (1 - marginPercentage/100)
        const marginDecimal = marginPercentage / 100;
        const sellingPrice = purchasing_price / (1 - marginDecimal);
        const profit = sellingPrice - purchasing_price;
        setter((prev) => ({
          ...prev,
          profit_margin_percentage: value,
          selling_price: sellingPrice.toFixed(2),
          profit: profit.toFixed(2),
        }));
      }
    } else if (name === "selling_price") {
      const sellingPrice = parseFloat(value) || 0;
      if (purchasing_price > 0 && sellingPrice > purchasing_price) {
        const profit = sellingPrice - purchasing_price;
        const marginPercentage = (profit / sellingPrice) * 100;
        setter((prev) => ({
          ...prev,
          selling_price: value,
          profit: profit.toFixed(2),
          profit_margin_percentage: marginPercentage.toFixed(2),
        }));
      }
    } else if (name === "purchasing_price") {
      // Recalculate based on existing profit or margin or selling price
      const existingProfit = parseFloat(variantData.profit) || 0;
      const existingMargin =
        parseFloat(variantData.profit_margin_percentage) || 0;
      const existingSelling = parseFloat(variantData.selling_price) || 0;
      const newPurchasePrice = parseFloat(value) || 0;

      if (existingProfit > 0 && newPurchasePrice > 0) {
        // Keep profit constant
        const profit = existingProfit;
        const sellingPrice = newPurchasePrice + profit;
        const marginPercentage =
          sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        setter((prev) => ({
          ...prev,
          purchasing_price: value,
          profit: profit.toFixed(2),
          selling_price: sellingPrice.toFixed(2),
          profit_margin_percentage: marginPercentage.toFixed(2),
        }));
      } else if (
        existingMargin > 0 &&
        existingMargin < 100 &&
        newPurchasePrice > 0
      ) {
        // Keep margin percentage constant
        const marginDecimal = existingMargin / 100;
        const sellingPrice = newPurchasePrice / (1 - marginDecimal);
        const profit = sellingPrice - newPurchasePrice;
        setter((prev) => ({
          ...prev,
          purchasing_price: value,
          profit_margin_percentage: existingMargin,
          selling_price: sellingPrice.toFixed(2),
          profit: profit.toFixed(2),
        }));
      } else if (existingSelling > 0 && newPurchasePrice > 0) {
        // Keep selling price constant
        const sellingPrice = existingSelling;
        const profit = sellingPrice - newPurchasePrice;
        const marginPercentage =
          sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
        setter((prev) => ({
          ...prev,
          purchasing_price: value,
          selling_price: existingSelling,
          profit: profit.toFixed(2),
          profit_margin_percentage: marginPercentage.toFixed(2),
        }));
      }
    }
  };

  const handleAddVariant = async () => {
    // Get the current variant data
    const variantData = editingVariant || newVariant;

    // Validate required fields
    if (!variantData.size || variantData.size.trim() === "") {
      setError("Please enter a size/variant name");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!variantData.purchasing_price || variantData.purchasing_price === "") {
      setError("Please enter a purchase price");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Parse and validate purchasing price
    const purchasePrice = parseFloat(variantData.purchasing_price);
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      setError("Please enter a valid purchase price (greater than 0)");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Calculate values based on what's provided
    let profit = variantData.profit ? parseFloat(variantData.profit) : 0;
    let marginPercentage = variantData.profit_margin_percentage
      ? parseFloat(variantData.profit_margin_percentage)
      : 0;
    let sellingPrice = variantData.selling_price
      ? parseFloat(variantData.selling_price)
      : 0;

    // If no profit data provided, calculate default 20% margin
    if (profit === 0 && marginPercentage === 0 && sellingPrice === 0) {
      marginPercentage = 20;
      const marginDecimal = marginPercentage / 100;
      sellingPrice = purchasePrice / (1 - marginDecimal);
      profit = sellingPrice - purchasePrice;
    }
    // If only selling price is provided
    else if (sellingPrice > 0 && profit === 0 && marginPercentage === 0) {
      profit = sellingPrice - purchasePrice;
      marginPercentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    }
    // If only profit is provided
    else if (profit > 0 && sellingPrice === 0 && marginPercentage === 0) {
      sellingPrice = purchasePrice + profit;
      marginPercentage = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    }
    // If only margin percentage is provided
    else if (marginPercentage > 0 && sellingPrice === 0 && profit === 0) {
      const marginDecimal = marginPercentage / 100;
      sellingPrice = purchasePrice / (1 - marginDecimal);
      profit = sellingPrice - purchasePrice;
    }

    // Validate calculated values
    if (sellingPrice <= purchasePrice) {
      setError("Selling price must be greater than purchase price");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (marginPercentage >= 100) {
      setError("Margin percentage must be less than 100%");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const variantToAdd = {
      id: Date.now(),
      size: variantData.size.trim(),
      unit: variantData.unit || "kg",
      purchasing_price: purchasePrice,
      profit: parseFloat(profit.toFixed(2)),
      profit_margin_percentage: parseFloat(marginPercentage.toFixed(2)),
      selling_price: parseFloat(sellingPrice.toFixed(2)),
    };

    if (!isEditMode) {
      setVariants((prev) => [...prev, variantToAdd]);
      // Clear the form
      setNewVariant({
        size: "",
        unit: "kg",
        purchasing_price: "",
        profit: "",
        profit_margin_percentage: "",
        selling_price: "",
      });
      if (editingVariant) setEditingVariant(null);
      setSuccess("Variant added (will be saved with product)");
      setTimeout(() => setSuccess(""), 2000);
      return;
    }

    try {
      const url = `${API_URL}/api/productlist/${id}/variants`;
      console.log("Adding variant to:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantToAdd),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server returned ${res.status}: ${res.statusText}. Make sure the backend server is running.`,
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add variant");
      }

      const savedVariant = await res.json();
      setVariants((prev) => [...prev, savedVariant]);
      setNewVariant({
        size: "",
        unit: "kg",
        purchasing_price: "",
        profit: "",
        profit_margin_percentage: "",
        selling_price: "",
      });
      if (editingVariant) setEditingVariant(null);
      setSuccess("Variant added successfully!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Add variant error:", err);
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEditVariant = (variant) => {
    setEditingVariant({ ...variant });
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant.size || !editingVariant.purchasing_price) {
      setError("Please fill in size and purchase price");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Recalculate values to ensure consistency
    const purchasePrice = parseFloat(editingVariant.purchasing_price);
    const profit = parseFloat(editingVariant.profit) || 0;
    const marginPercentage =
      parseFloat(editingVariant.profit_margin_percentage) || 0;
    const sellingPrice = parseFloat(editingVariant.selling_price) || 0;

    let updatedVariant = { ...editingVariant };

    if (sellingPrice > 0 && profit === 0 && marginPercentage === 0) {
      // Recalculate from selling price
      const calculatedProfit = sellingPrice - purchasePrice;
      const calculatedMargin = (calculatedProfit / sellingPrice) * 100;
      updatedVariant = {
        ...editingVariant,
        profit: calculatedProfit.toFixed(2),
        profit_margin_percentage: calculatedMargin.toFixed(2),
      };
    } else if (profit > 0 && sellingPrice === 0 && marginPercentage === 0) {
      // Recalculate from profit
      const calculatedSelling = purchasePrice + profit;
      const calculatedMargin = (profit / calculatedSelling) * 100;
      updatedVariant = {
        ...editingVariant,
        selling_price: calculatedSelling.toFixed(2),
        profit_margin_percentage: calculatedMargin.toFixed(2),
      };
    } else if (marginPercentage > 0 && sellingPrice === 0 && profit === 0) {
      // Recalculate from margin percentage
      const marginDecimal = marginPercentage / 100;
      const calculatedSelling = purchasePrice / (1 - marginDecimal);
      const calculatedProfit = calculatedSelling - purchasePrice;
      updatedVariant = {
        ...editingVariant,
        selling_price: calculatedSelling.toFixed(2),
        profit: calculatedProfit.toFixed(2),
      };
    }

    // Validate calculated values
    if (parseFloat(updatedVariant.selling_price) <= purchasePrice) {
      setError("Selling price must be greater than purchase price");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (parseFloat(updatedVariant.profit_margin_percentage) >= 100) {
      setError("Margin percentage must be less than 100%");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (!isEditMode) {
      setVariants((prev) =>
        prev.map((v) => (v.id === editingVariant.id ? updatedVariant : v)),
      );
      setEditingVariant(null);
      setSuccess("Variant updated");
      setTimeout(() => setSuccess(""), 2000);
      return;
    }

    try {
      const url = `${API_URL}/api/productlist/${id}/variants/${editingVariant.id}`;
      console.log("Updating variant at:", url);

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedVariant),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server returned ${res.status}: ${res.statusText}. Make sure the backend server is running.`,
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update variant");
      }

      const savedVariant = await res.json();
      setVariants((prev) =>
        prev.map((v) => (v.id === savedVariant.id ? savedVariant : v)),
      );
      setEditingVariant(null);
      setSuccess("Variant updated successfully!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Update variant error:", err);
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Are you sure you want to delete this variant?"))
      return;

    if (!isEditMode) {
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      setSuccess("Variant removed");
      setTimeout(() => setSuccess(""), 2000);
      return;
    }

    try {
      const url = `${API_URL}/api/productlist/${id}/variants/${variantId}`;
      console.log("Deleting variant at:", url);

      const res = await fetch(url, {
        method: "DELETE",
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server returned ${res.status}: ${res.statusText}. Make sure the backend server is running.`,
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete variant");
      }

      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      setSuccess("Variant deleted successfully!");
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      console.error("Delete variant error:", err);
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form
    if (!form.common_name.trim()) {
      setError("Please enter a common name");
      setTimeout(() => setError(""), 3000);
      return;
    }

    // Validate that at least one variant exists
    if (variants.length === 0) {
      setError("Please add at least one variant before saving the product");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const data = new FormData();
      data.append("common_name", form.common_name.trim());
      data.append("scientific_name", form.scientific_name.trim());
      data.append("description", form.description.trim());
      data.append("category", form.category);
      data.append("species_type", form.species_type);
      data.append("variants", JSON.stringify(variants));

      if (form.image) {
        data.append("image", form.image);
      } else if (form.existing_image_url) {
        data.append("existing_image_url", form.existing_image_url);
      }

      const url = isEditMode
        ? `${API_URL}/api/productlist/upload/${id}`
        : `${API_URL}/api/productlist/upload`;

      console.log("Submitting to:", url);

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: data,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error(
          `Server returned ${res.status}: ${res.statusText}. Make sure the backend server is running.`,
        );
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isEditMode ? "update" : "add"} product`,
        );
      }

      const responseData = await res.json();
      console.log("Success response:", responseData);

      setSuccess(`Product ${isEditMode ? "updated" : "added"} successfully!`);
      setTimeout(() => navigate("/productlist"), 1500);
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  const clearVariantForm = () => {
    setNewVariant({
      size: "",
      unit: "kg",
      purchasing_price: "",
      profit: "",
      profit_margin_percentage: "",
      selling_price: "",
    });
    setEditingVariant(null);
  };

  if (loading) {
    return (
      <div className="form-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>{isEditMode ? "Edit Product" : "Add Product"}</h2>

      <form onSubmit={handleSubmit} className="apf-container">
        {/* Basic info */}
        <label className="apf-label">Common Name *</label>
        <input
          className="apf-input"
          name="common_name"
          placeholder="Common Name"
          value={form.common_name}
          onChange={handleChange}
          required
        />

        <label className="apf-label">Scientific Name</label>
        <input
          className="apf-input"
          name="scientific_name"
          placeholder="Scientific Name"
          value={form.scientific_name}
          onChange={handleChange}
        />

        <label className="apf-label">Description</label>
        <textarea
          className="apf-input"
          name="description"
          placeholder="Product Description"
          value={form.description}
          onChange={handleChange}
          rows="4"
        />

        <label className="apf-label">Product Condition</label>
        <select
          className="apf-input"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="live">🟢 Live</option>
          <option value="fresh">💧 Fresh</option>
          <option value="frozen">❄️ Frozen</option>
        </select>

        <label className="apf-label">Species Type</label>
        <select
          className="apf-input"
          name="species_type"
          value={form.species_type}
          onChange={handleChange}
          required
        >
          <option value="crustacean">🦞 Crustacean</option>
          <option value="fish">🐟 Fish</option>
        </select>

        <label className="apf-label">Product Image</label>
        <input
          className="apf-input"
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
        />
        {preview && (
          <div className="image-preview-container">
            <img src={preview} alt="preview" className="img-preview" />
          </div>
        )}

        <hr />

        {/* Variants section */}
        <h3 style={{ marginBottom: "1rem" }}>
          Product Variants (Size & Pricing) *
        </h3>

        {variants.length > 0 && (
          <div className="variants-table-wrap">
            <table className="variants-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Unit</th>
                  <th>Purchase Price</th>
                  <th>Profit (Rs)</th>
                  <th>Margin %</th>
                  <th>Selling Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td>{variant.size}</td>
                    <td>{variant.unit}</td>
                    <td className="price-cell">
                      Rs. {parseFloat(variant.purchasing_price).toFixed(2)}
                    </td>
                    <td className="price-cell">
                      Rs.{" "}
                      {variant.profit
                        ? parseFloat(variant.profit).toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="price-cell">
                      {variant.profit_margin_percentage
                        ? parseFloat(variant.profit_margin_percentage).toFixed(
                            2,
                          )
                        : "0.00"}
                      %
                    </td>
                    <td className="price-cell">
                      Rs.{" "}
                      {variant.selling_price
                        ? parseFloat(variant.selling_price).toFixed(2)
                        : parseFloat(variant.purchasing_price).toFixed(2)}
                    </td>
                    <td className="td-actions">
                      <button
                        type="button"
                        className="tbl-btn-edit"
                        onClick={() => handleEditVariant(variant)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="tbl-btn-delete"
                        onClick={() => handleDeleteVariant(variant.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add / Edit variant form */}
        <div className="variant-form">
          <h4>{editingVariant ? "Edit Variant" : "Add New Variant"}</h4>

          <div className="info-message">
            <small>
              Fields auto-calculate: Enter any one of Profit, Margin %, or
              Selling Price
            </small>
          </div>

          <div className="variant-form-grid">
            <div className="form-group">
              <label className="apf-label">Size / Variant *</label>
              <input
                className="apf-input"
                name="size"
                type="text"
                placeholder="e.g. 100-150g"
                value={editingVariant ? editingVariant.size : newVariant.size}
                onChange={handleVariantChange}
              />
            </div>

            <div className="form-group">
              <label className="apf-label">Unit</label>
              <select
                className="apf-input"
                name="unit"
                value={editingVariant ? editingVariant.unit : newVariant.unit}
                onChange={handleVariantChange}
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lbs">lbs</option>
                <option value="pcs">pcs</option>
              </select>
            </div>

            <div className="form-group">
              <label className="apf-label">Purchase Price (Rs) *</label>
              <input
                className="apf-input"
                name="purchasing_price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={
                  editingVariant
                    ? editingVariant.purchasing_price
                    : newVariant.purchasing_price
                }
                onChange={handleVariantChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>

            <div className="form-group">
              <label className="apf-label">Profit (Rs)</label>
              <input
                className="apf-input"
                name="profit"
                type="number"
                step="0.01"
                min="0"
                placeholder="Auto-calculated"
                value={
                  editingVariant
                    ? editingVariant.profit || ""
                    : newVariant.profit || ""
                }
                onChange={handleVariantChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>

            <div className="form-group">
              <label className="apf-label">Margin Percentage (%)</label>
              <input
                className="apf-input"
                name="profit_margin_percentage"
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                placeholder="Auto-calculated"
                value={
                  editingVariant
                    ? editingVariant.profit_margin_percentage || ""
                    : newVariant.profit_margin_percentage || ""
                }
                onChange={handleVariantChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>

            <div className="form-group">
              <label className="apf-label">Selling Price (Rs)</label>
              <input
                className="apf-input"
                name="selling_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Auto-calculated"
                value={
                  editingVariant
                    ? editingVariant.selling_price || ""
                    : newVariant.selling_price || ""
                }
                onChange={handleVariantChange}
                onWheel={(e) => e.target.blur()}
              />
            </div>
          </div>

          <div className="variant-actions">
            {editingVariant ? (
              <>
                <button
                  type="button"
                  className="vbtn-update"
                  onClick={handleUpdateVariant}
                >
                  Update Variant
                </button>
                <button
                  type="button"
                  className="vbtn-cancel"
                  onClick={clearVariantForm}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="vbtn-add"
                  onClick={handleAddVariant}
                >
                  + Add Variant
                </button>
                <button
                  type="button"
                  className="vbtn-cancel"
                  onClick={clearVariantForm}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {/* Submit / Cancel */}
        <div className="form-actions">
          <button type="submit" className="apf-btn">
            {isEditMode ? "Update Product" : "Add Product"}
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/productlist")}
          >
            Cancel
          </button>
        </div>
      </form>

      {success && <div className="apf-success">{success}</div>}
      {error && <div className="apf-error">{error}</div>}
    </div>
  );
};

export default AddProductForm;
