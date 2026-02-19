import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css'

const CustomerDetail = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { cus_id } = useParams();
  const navigate = useNavigate();

  const [customer,       setCustomer]       = useState(null);
  const [prices,         setPrices]         = useState([]);
  const [products,       setProducts]       = useState([]);
  const [selectedProduct,setSelectedProduct]= useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [showForm,       setShowForm]       = useState(false);
  const [editingPrice,   setEditingPrice]   = useState(null);

  const [formData, setFormData] = useState({
    product_id: '', variant_id: '', common_name: '', category: '',
    size_range: '', purchasing_price: '', margin: '',
    margin_percentage: '', selling_price: ''
  });

  useEffect(() => {
    fetchCustomer(); fetchPrices(); fetchProducts();
    const handleFocus = () => fetchPrices();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cus_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customerlist/${cus_id}`);
      if (!res.ok) throw new Error('Failed to fetch customer');
      setCustomer(await res.json());
    } catch (err) { setError(err.message); }
  };

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customer-products/${cus_id}`);
      if (!res.ok) throw new Error('Failed to fetch prices');
      setPrices(await res.json());
      setLoading(false);
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productlist`);
      if (!res.ok) throw new Error('Failed to fetch products');
      setProducts(await res.json());
    } catch (err) { console.error('Error fetching products:', err); }
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    setFormData(prev => {
      if (!productId) { setSelectedProduct(null); return { ...prev, product_id: '', variant_id: '', common_name: '', category: '', size_range: '', purchasing_price: '' }; }
      const product = products.find(p => p.id === Number(productId));
      setSelectedProduct(product);
      return { ...prev, product_id: productId, variant_id: '', common_name: product?.common_name || '', category: product?.category || '', size_range: '', purchasing_price: '' };
    });
  };

  const handleVariantSelect = (e) => {
    const variantId = e.target.value;
    if (!variantId || !selectedProduct) { setFormData(prev => ({ ...prev, variant_id: '', size_range: '', purchasing_price: '' })); return; }
    const variant = selectedProduct.variants?.find(v => String(v.id) === String(variantId));
    if (variant) {
      setFormData(prev => ({ ...prev, variant_id: String(variantId), size_range: `${variant.size} ${variant.unit}`, purchasing_price: variant.purchasing_price }));
    }
  };

  const calculatePrices = (field, value) => {
    const data = { ...formData, [field]: value };
    const purchasingPrice  = parseFloat(data.purchasing_price)  || 0;
    let margin             = parseFloat(data.margin)             || 0;
    let marginPercentage   = parseFloat(data.margin_percentage)  || 0;
    let sellingPrice       = parseFloat(data.selling_price)      || 0;

    if (field === 'purchasing_price') {
      data.purchasing_price = value;
      if (data.margin_percentage && parseFloat(data.margin_percentage) !== 0) {
        margin = (purchasingPrice * marginPercentage) / 100;
        sellingPrice = purchasingPrice + margin;
        data.margin = margin.toFixed(2); data.selling_price = sellingPrice.toFixed(2);
      } else if (data.margin && parseFloat(data.margin) !== 0) {
        sellingPrice = purchasingPrice + margin;
        marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
        data.margin_percentage = marginPercentage.toFixed(2); data.selling_price = sellingPrice.toFixed(2);
      } else if (data.selling_price && parseFloat(data.selling_price) !== 0) {
        margin = sellingPrice - purchasingPrice;
        marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
        data.margin = margin.toFixed(2); data.margin_percentage = marginPercentage.toFixed(2);
      }
    } else if (field === 'margin_percentage') {
      margin = (purchasingPrice * marginPercentage) / (100 - marginPercentage);
      sellingPrice = purchasingPrice + margin;
      data.margin = margin.toFixed(2); data.selling_price = sellingPrice.toFixed(2);
    } else if (field === 'margin') {
      sellingPrice = purchasingPrice + margin;
      marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
      data.margin_percentage = marginPercentage.toFixed(2); data.selling_price = sellingPrice.toFixed(2);
    } else if (field === 'selling_price') {
      margin = sellingPrice - purchasingPrice;
      marginPercentage = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
      data.margin = margin.toFixed(2); data.margin_percentage = marginPercentage.toFixed(2);
    }
    setFormData(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url    = editingPrice ? `${API_URL}/api/customer-products/${editingPrice.id}` : `${API_URL}/api/customer-products`;
      const method = editingPrice ? 'PUT' : 'POST';
      const payload = {
        cus_id: parseInt(cus_id),
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        variant_id: formData.variant_id ? parseInt(formData.variant_id) : null,
        common_name: formData.common_name, category: formData.category,
        size_range: formData.size_range, purchasing_price: parseFloat(formData.purchasing_price),
        margin: parseFloat(formData.margin) || 0,
        margin_percentage: parseFloat(formData.margin_percentage) || 0,
        selling_price: parseFloat(formData.selling_price)
      };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to save'); }
      await fetchPrices(); resetForm();
      alert(editingPrice ? 'Price updated successfully!' : 'Price added successfully!');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleEdit = async (price) => {
    if (products.length === 0) await fetchProducts();
    const product = products.find(p => p.id === price.product_id);
    let variantId = '';
    if (product?.variants?.length > 0 && price.size_range) {
      const match = product.variants.find(v => `${v.size} ${v.unit}` === price.size_range);
      if (match) variantId = String(match.id);
    }
    if (product) setSelectedProduct(product);
    setEditingPrice(price); setShowForm(true);
    setFormData({
      product_id: String(price.product_id), variant_id: variantId,
      common_name: price.common_name, category: price.category,
      size_range: price.size_range, purchasing_price: price.purchasing_price,
      margin: price.margin, margin_percentage: price.margin_percentage,
      selling_price: price.selling_price
    });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete custom price for "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/customer-products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to delete'); }
      await fetchPrices(); alert('Price deleted successfully!');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const resetForm = () => {
    setFormData({ product_id: '', variant_id: '', common_name: '', category: '', size_range: '', purchasing_price: '', margin: '', margin_percentage: '', selling_price: '' });
    setSelectedProduct(null); setEditingPrice(null); setShowForm(false);
  };

  const formatCategory = (cat) => cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : '—';
  const getProductDisplayName = (p) => `${p.common_name || 'Unnamed'} - ${formatCategory(p.category)}`;

  return (
    <div className="pricelist-container">

      <div className="detail-back-row">
        <button onClick={() => navigate('/customerlist')} className="cancel-btn">← Back</button>
      </div>

      <h2>Custom Prices — {customer?.cus_name}</h2>

      <div className="add-section">
        <button className="apf-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Custom Price'}
        </button>
      </div>

      {showForm && (
        <div className="priceform-container">
          <h3>{editingPrice ? 'Edit Custom Price' : 'Add Custom Price'}</h3>

          <form onSubmit={handleSubmit} className="apf-container">

            <label className="apf-label">Select Product</label>
            <select className="apf-input" value={formData.product_id} onChange={handleProductSelect} required disabled={!!editingPrice}>
              <option value="">— Select a Product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{getProductDisplayName(p)}</option>)}
            </select>

            <label className="apf-label">Common Name</label>
            <input className="apf-input" value={formData.common_name} readOnly placeholder="Auto-filled from product" />

            <label className="apf-label">Category</label>
            <input className="apf-input" value={formatCategory(formData.category)} readOnly placeholder="Auto-filled from product" />

            <label className="apf-label">Size Range</label>
            {editingPrice ? (
              <input className="apf-input" value={formData.size_range} readOnly />
            ) : selectedProduct?.variants?.length > 0 ? (
              <select className="apf-input" value={formData.variant_id} onChange={handleVariantSelect} required>
                <option value="">— Select Size —</option>
                {selectedProduct.variants.map(v => <option key={v.id} value={String(v.id)}>{v.size} {v.unit}</option>)}
              </select>
            ) : (
              <input className="apf-input" value={formData.size_range} onChange={e => setFormData({ ...formData, size_range: e.target.value })} placeholder="Enter size range manually" required />
            )}
            {editingPrice && selectedProduct?.variants?.length > 0 && (
              <p className="apf-note">Size range cannot be changed when editing</p>
            )}

            <label className="apf-label">Purchasing Price (LKR)</label>
            <input className="apf-input" type="number" step="0.01"
              value={formData.purchasing_price}
              onChange={e => calculatePrices('purchasing_price', e.target.value)}
              required
              readOnly={editingPrice || (!editingPrice && formData.variant_id !== '')}
              placeholder="Auto-filled or enter manually" />
            {editingPrice && <p className="apf-note">Purchasing price cannot be changed when editing</p>}

            <label className="apf-label">Margin (LKR)</label>
            <input className="apf-input" type="number" step="0.01" value={formData.margin}
              onChange={e => calculatePrices('margin', e.target.value)} placeholder="0.00" />

            <label className="apf-label">Margin %</label>
            <input className="apf-input" type="number" step="0.01" value={formData.margin_percentage}
              onChange={e => calculatePrices('margin_percentage', e.target.value)} placeholder="0.00" />

            <label className="apf-label">Selling Price (LKR)</label>
            <input className="apf-input is-fob" type="number" step="0.01" value={formData.selling_price}
              onChange={e => calculatePrices('selling_price', e.target.value)} required placeholder="0.00" />

            <div className="form-btn-row">
              <button type="submit" className="apf-btn">{editingPrice ? 'Update' : 'Add'} Price</button>
              <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="info">Loading…</div>}
      {error   && <div className="error">{error}</div>}

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
              {prices.length === 0 && <tr><td colSpan={8} className="muted">No custom prices set</td></tr>}
              {prices.map(price => (
                <tr key={price.id}>
                  <td data-label="Common Name">{price.common_name}</td>
                  <td data-label="Category">{formatCategory(price.category)}</td>
                  <td data-label="Size Range">{price.size_range || '—'}</td>
                  <td data-label="Purchasing Price"><span className="td-price">Rs.{parseFloat(price.purchasing_price).toFixed(2)}</span></td>
                  <td data-label="Margin"><span className="td-margin">Rs.{parseFloat(price.margin).toFixed(2)}</span></td>
                  <td data-label="Margin %">{parseFloat(price.margin_percentage).toFixed(2)}%</td>
                  <td data-label="Selling Price"><span className="td-sell">Rs.{parseFloat(price.selling_price).toFixed(2)}</span></td>
                  <td data-label="Actions" className="actions-cell">
                    <div className="actions-wrapper">
                      <button className="btn-edit"   onClick={() => handleEdit(price)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(price.id, price.common_name)}>Delete</button>
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