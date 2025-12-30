import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css'


const ExportCustomerDetail = () => {
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

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    variant_id: '',
    common_name: '',
    category: '',
    size_range: '',
    purchasing_price: '',
    margin: '',
    margin_percentage: '',
    selling_price: ''
  });

  useEffect(() => {
    fetchCustomer();
    fetchPrices();
    fetchProducts();
  }, [cus_id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exportcustomerlist/${cus_id}`);
      if (!res.ok) throw new Error('Failed to fetch customer');
      const data = await res.json();
      setCustomer(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exportcustomer-products/${cus_id}`);
      if (!res.ok) throw new Error('Failed to fetch prices');
      const data = await res.json();
      console.log('Fetched Prices:', data); 
      setPrices(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/exportproductlist`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;

    setFormData(prev => {
      if (!productId) {
        setSelectedProduct(null);
        return {
          ...prev,
          product_id: '',
          variant_id: '',
          common_name: '',
          category: '',
          size_range: '',
          purchasing_price: ''
        };
      }

      const product = products.find(p => p.id === Number(productId));
      setSelectedProduct(product);

      return {
        ...prev,
        product_id: productId,
        variant_id: '',
        common_name: product?.common_name || '',
        category: product?.category || '',
        size_range: '',
        purchasing_price: ''
      };
    });
  };

  const handleVariantSelect = (e) => {
    const variantId = e.target.value;

    if (!variantId || !selectedProduct) {
      setFormData(prev => ({
        ...prev,
        variant_id: '',
        size_range: '',
        purchasing_price: ''
      }));
      return;
    }

    const variant = selectedProduct.variants?.find(v => String(v.id) === String(variantId));

    if (variant) {
      const sizeRange = `${variant.size} ${variant.unit}`;
      const purchasingPrice = variant.purchasing_price;

      // Check current form data for existing margin values before updating
      const currentMarginPercentage = formData.margin_percentage;
      const currentMargin = formData.margin;

      setFormData(prev => ({
        ...prev,
        variant_id: String(variantId),
        size_range: sizeRange,
        purchasing_price: purchasingPrice
      }));

      // Trigger price calculations if margin or margin_percentage exists
      if (currentMarginPercentage) {
        calculatePrices('purchasing_price', purchasingPrice);
      } else if (currentMargin) {
        calculatePrices('purchasing_price', purchasingPrice);
      }
    }
  };

  const calculatePrices = (field, value) => {
    const data = {
      ...formData,
      [field]: value
    };

    const purchasingPrice = parseFloat(data.purchasing_price) || 0;
    let margin = parseFloat(data.margin) || 0;
    let marginPercentage = parseFloat(data.margin_percentage) || 0;
    let sellingPrice = parseFloat(data.selling_price) || 0;

    // If purchasing price changes - only recalculate if other values exist
    if (field === 'purchasing_price') {
      // Keep the raw value for purchasing price while typing
      data.purchasing_price = value;

      // If margin percentage exists, recalculate margin and selling price
      if (data.margin_percentage && parseFloat(data.margin_percentage) !== 0) {
        margin = (purchasingPrice * marginPercentage) / 100;
        sellingPrice = purchasingPrice + margin;
        data.margin = margin.toFixed(2);
        data.selling_price = sellingPrice.toFixed(2);
      }
      // If margin exists but no percentage, recalculate percentage and selling price
      else if (data.margin && parseFloat(data.margin) !== 0) {
        sellingPrice = purchasingPrice + margin;
        marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;

        data.margin_percentage = marginPercentage.toFixed(2);
        data.selling_price = sellingPrice.toFixed(2);
      }

      // If selling price exists, recalculate margin and percentage
      else if (data.selling_price && parseFloat(data.selling_price) !== 0) {
        margin = sellingPrice - purchasingPrice;
        marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;

        data.margin = margin.toFixed(2);
        data.margin_percentage = marginPercentage.toFixed(2);
      }

      setFormData(data);
      return;
    }

    // If margin % changes
    else if (field === 'margin_percentage') {
      data.margin_percentage = value;

      margin = (purchasingPrice * marginPercentage) / (100 - marginPercentage);
      sellingPrice = purchasingPrice + margin;

      data.margin = margin.toFixed(2);
      data.selling_price = sellingPrice.toFixed(2);
    }

    // If margin changes
    else if (field === 'margin') {
      data.margin = value;

      sellingPrice = purchasingPrice + margin;
      marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;

      data.margin_percentage = marginPercentage.toFixed(2);
      data.selling_price = sellingPrice.toFixed(2);
    }

    // If selling price changes
    else if (field === 'selling_price') {
      data.selling_price = value;

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
        ? `${API_URL}/api/exportcustomer-products/${editingPrice.id}`
        : `${API_URL}/api/exportcustomer-products`;

      const method = editingPrice ? 'PUT' : 'POST';

      // Ensure product_id and variant_id are included
      const payload = {
        cus_id: parseInt(cus_id),
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        variant_id: formData.variant_id ? parseInt(formData.variant_id) : null,
        common_name: formData.common_name,
        category: formData.category,
        size_range: formData.size_range,
        purchasing_price: parseFloat(formData.purchasing_price),
        margin: parseFloat(formData.margin) || 0,
        margin_percentage: parseFloat(formData.margin_percentage) || 0,
        selling_price: parseFloat(formData.selling_price)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save');
      }

      await fetchPrices();
      resetForm();
      alert(editingPrice ? 'Price updated successfully!' : 'Price added successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
      console.error('Submit error:', err);
    }
  };

  const handleEdit = async (price) => {
    console.log('Editing Price Object:', price);

    // If products aren't loaded yet, wait for them
    if (products.length === 0) {
      await fetchProducts();
    }

    const product = products.find(p => p.id === price.product_id);

    if (product) {
      setSelectedProduct(product);

      // Try to find the variant ID from the variants array
      let variantId = '';
      if (product.variants && product.variants.length > 0 && price.size_range) {
        // Try to match variant by size range
        const matchingVariant = product.variants.find(variant =>
          `${variant.size} ${variant.unit}` === price.size_range
        );

        if (matchingVariant) {
          variantId = String(matchingVariant.id);
        }
      }

      console.log('Found Variant ID:', variantId);

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
        selling_price: price.selling_price
      });
    } else {
      // If product not found, still set the form data
      setEditingPrice(price);
      setShowForm(true);

      setFormData({
        product_id: String(price.product_id),
        variant_id: price.variant_id ? String(price.variant_id) : '',
        common_name: price.common_name,
        category: price.category,
        size_range: price.size_range,
        purchasing_price: price.purchasing_price,
        margin: price.margin,
        margin_percentage: price.margin_percentage,
        selling_price: price.selling_price
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete custom price for "${name}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/exportcustomer-products/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      await fetchPrices();
      alert('Price deleted successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
      console.error('Delete error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      variant_id: '',
      common_name: '',
      category: '',
      size_range: '',
      purchasing_price: '',
      margin: '',
      margin_percentage: '',
      selling_price: ''
    });
    setSelectedProduct(null);
    setEditingPrice(null);
    setShowForm(false);
  };

  const formatCategory = (category) => {
    if (!category) return '-'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getProductDisplayName = (product) => {
    const name = product.common_name || 'Unnamed Product';
    const category = product.category || 'No Category';

    return `${name} - ${formatCategory(category)}`;
  };

  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('Selected Product:', selectedProduct);
    console.log('Selected Product Variants:', selectedProduct?.variants);
    console.log('Form Data:', formData);
    console.log('Form Data Variant ID:', formData.variant_id);
    console.log('Editing Price:', editingPrice);
    console.log('Editing Price Variant ID:', editingPrice?.variant_id);
    console.log('==================');
  }, [selectedProduct, formData, editingPrice]);

  return (
    <div className="pricelist-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/exportcustomerlist')} className="cancel-btn">
          ← Back
        </button>
      </div>
      <h2>Custom Prices - {customer?.cus_name}</h2>

      <div className="add-section">
        <button
          className="apf-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Custom Price'}
        </button>
      </div>

      {showForm && (
        <div className="priceform-container" style={{ marginBottom: '2rem' }}>
          <h3>{editingPrice ? 'Edit Custom Price' : 'Add Custom Price'}</h3>
          <br /><br />
          <form onSubmit={handleSubmit} className="apf-container">
            <label className="apf-label">Select Product:</label>
            <select
              value={formData.product_id}
              onChange={handleProductSelect}
              className="apf-input"
              required
              disabled={editingPrice} // Make product selection disabled when editing
            >
              <option value="">-- Select a Product --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {getProductDisplayName(product)}
                </option>
              ))}
            </select>

            <label className="apf-label">Common Name:</label>
            <input
              type="text"
              className="apf-input"
              value={formData.common_name}
              readOnly
              placeholder="Auto-filled from product"
            />

            <label className="apf-label">Category:</label>
            <input
              type="text"
              className="apf-input"
              value={formatCategory(formData.category)}
              readOnly
              placeholder="Auto-filled from product"
            />

            <label className="apf-label">Size Range:</label>
            {/* When editing, always show as read-only text input */}
            {editingPrice ? (
              <input
                type="text"
                className="apf-input"
                value={formData.size_range}
                readOnly
                style={{ cursor: 'not-allowed' }}
              />
            ) : selectedProduct?.variants?.length > 0 ? (
              <select
                value={formData.variant_id}
                onChange={handleVariantSelect}
                className="apf-input"
                required
              >
                <option value="">-- Select Size --</option>
                {selectedProduct.variants.map(variant => (
                  <option key={variant.id} value={String(variant.id)}>
                    {variant.size} {variant.unit}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
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
              <div className="info-text" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Note: Size range cannot be changed when editing
              </div>
            )}

            <label className="apf-label">Purchasing Price:</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.purchasing_price}
              onChange={(e) => calculatePrices('purchasing_price', e.target.value)}
              required
              readOnly={editingPrice || (!editingPrice && formData.variant_id !== '')}
              style={editingPrice ? {  cursor: 'not-allowed' } : {}}
              placeholder={!editingPrice && selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0
                ? "Auto-filled from selected size"
                : "Enter purchasing price"}
            />

            {editingPrice && (
              <div className="info-text" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Note: Purchasing price cannot be changed when editing
              </div>
            )}

            <label className="apf-label">Margin:</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.margin}
              onChange={(e) => calculatePrices('margin', e.target.value)}
              placeholder="0.00"
            />

            <label className="apf-label">Margin %:</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.margin_percentage}
              onChange={(e) => calculatePrices('margin_percentage', e.target.value)}
              placeholder="0.00"
            />

            <label className="apf-label">Selling Price:</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.selling_price}
              onChange={(e) => calculatePrices('selling_price', e.target.value)}
              required
              placeholder="0.00"
            />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="apf-btn">
                {editingPrice ? 'Update' : 'Add'} Price
              </button>
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="info">Loading...</div>}
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
                  <td colSpan={8} className="muted">No custom prices set</td>
                </tr>
              )}

              {prices.map(price => (
                <tr key={price.id} className="responsive-row">
                  <td data-label="Common Name">{price.common_name}</td>
                  <td data-label="Category">{formatCategory(price.category)}</td>
                  <td data-label="Size Range">{price.size_range || '-'}</td>
                  <td data-label="Purchasing Price">Rs.{parseFloat(price.purchasing_price).toFixed(2)}</td>
                  <td data-label="Margin">Rs.{parseFloat(price.margin).toFixed(2)}</td>
                  <td data-label="Margin %">{parseFloat(price.margin_percentage).toFixed(2)}%</td>
                  <td data-label="Selling Price">Rs.{parseFloat(price.selling_price).toFixed(2)}</td>
                  <td data-label="Actions">
                    <div className="actions-wrapper">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(price)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(price.id, price.common_name)}
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

export default ExportCustomerDetail;