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
  const [freightRates, setFreightRates] = useState([]);
  const [currentUsdRate, setCurrentUsdRate] = useState(null);
  
  // Form state - costs are now in USD
  const [formData, setFormData] = useState({
    product_id: '',
    variant_id: '',
    common_name: '',
    category: '',
    size_range: '',
    purchasing_price: '',
    exfactoryprice: '',
    export_doc: '', // USD
    transport_cost: '', // USD
    loading_cost: '', // USD
    airway_cost: '', // USD
    forwardHandling_cost: '', // USD
    gross_weight_tier: '',
    multiplier: '',
    divisor: '',
    freight_cost: '',
    fob_price: '',
    cnf: ''
  });

  useEffect(() => {
    fetchCustomer();
    fetchPrices();
    fetchProducts();
    fetchFreightRates();
    fetchUsdRate();
  }, [cus_id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchFreightRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/freight-rates`);
      if (!res.ok) throw new Error('Failed to fetch freight rates');
      const data = await res.json();
      setFreightRates(data);
    } catch (err) {
      console.error('Error fetching freight rates:', err);
    }
  };

  const getFreightRateForCountry = (country) => {
    if (!country || freightRates.length === 0) return null;
    const countryRates = freightRates.filter(rate =>
      rate.country.toLowerCase() === country.toLowerCase()
    );
    if (countryRates.length === 0) return null;
    return countryRates.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    )[0];
  };

  const getFreightRateByTier = (tier, rateData) => {
    if (!rateData || !tier) return 0;
    switch (tier) {
      case 'gross+45kg':
        return parseFloat(rateData.rate_45kg);
      case 'gross+100kg':
        return parseFloat(rateData.rate_100kg);
      case 'gross+300kg':
        return parseFloat(rateData.rate_300kg);
      case 'gross+500kg':
        return parseFloat(rateData.rate_500kg);
      default:
        return 0;
    }
  };

  const fetchUsdRate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/usd-rate`);
      if (!res.ok) throw new Error('Failed to fetch USD rate');
      const data = await res.json();
      setCurrentUsdRate(data.rate);
    } catch (err) {
      console.error('Error fetching USD rate:', err);
    }
  };

  const convertToUSD = (lkrAmount) => {
    if (!currentUsdRate || !lkrAmount) return 0;
    return (parseFloat(lkrAmount) / parseFloat(currentUsdRate)).toFixed(2);
  };

  const convertToLKR = (usdAmount) => {
    if (!currentUsdRate || !usdAmount) return 0;
    return (parseFloat(usdAmount) * parseFloat(currentUsdRate)).toFixed(2);
  };

  const calculateCNF = (fobPriceLKR, freightCostUSD) => {
    if (!currentUsdRate || !fobPriceLKR) return '0.00';
    const fobInUSD = parseFloat(fobPriceLKR) / parseFloat(currentUsdRate);
    const freightUSD = parseFloat(freightCostUSD) || 0;
    const cnf = fobInUSD + freightUSD;
    return cnf.toFixed(2);
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
          purchasing_price: '',
          exfactoryprice: '',
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
        purchasing_price: '',
        exfactoryprice: '',
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
        purchasing_price: '',
        exfactoryprice: '',
      }));
      return;
    }
    const variant = selectedProduct.variants?.find(v => String(v.id) === String(variantId));
    if (variant) {
      const sizeRange = `${variant.size}`;
      const purchasingPrice = variant.purchasing_price;
      const exfactoryprice = variant.exfactoryprice;

      setFormData(prev => ({
        ...prev,
        variant_id: String(variantId),
        size_range: sizeRange,
        purchasing_price: purchasingPrice,
        exfactoryprice: exfactoryprice,
      }));
      
    }
  };

  const calculatePrices = (field, value) => {
    const data = {
      ...formData,
      [field]: value
    };

    const exfactoryprice = parseFloat(data.exfactoryprice) || 0;
    
    // All these costs are now in USD
    let export_doc_usd = parseFloat(data.export_doc) || 0;
    let transport_cost_usd = parseFloat(data.transport_cost) || 0;
    let loading_cost_usd = parseFloat(data.loading_cost) || 0;
    let airway_cost_usd = parseFloat(data.airway_cost) || 0;
    let forwardHandling_cost_usd = parseFloat(data.forwardHandling_cost) || 0;
    
    let multiplier = parseFloat(data.multiplier) || 0;
    let divisor = parseFloat(data.divisor) || 1;
    let freight_cost = parseFloat(data.freight_cost) || 0;

    // Calculate freight cost if weight tier is selected
    if (field === 'gross_weight_tier' || field === 'multiplier' || field === 'divisor') {
      const freightRateData = getFreightRateForCountry(customer?.country);
      if (freightRateData && data.gross_weight_tier && multiplier > 0 && divisor > 0) {
        const applicableRate = getFreightRateByTier(data.gross_weight_tier, freightRateData);
        freight_cost = (multiplier * applicableRate) / divisor;
        data.freight_cost = freight_cost.toFixed(2);
      }
    }

    // Calculate total costs in USD
    const totalCostsUSD = export_doc_usd + transport_cost_usd + loading_cost_usd + airway_cost_usd + forwardHandling_cost_usd;
    
    // Convert total costs to LKR
    const totalCostsLKR = currentUsdRate ? totalCostsUSD * parseFloat(currentUsdRate) : 0;
    
    // Calculate FOB in LKR (Ex-Factory + all costs in LKR)
    const fobPriceLKR = exfactoryprice + totalCostsLKR;
    data.fob_price = fobPriceLKR.toFixed(2);
    
    // Calculate CNF (FOB in USD + Freight)
    data.cnf = calculateCNF(fobPriceLKR, freight_cost);

    setFormData(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPrice
        ? `${API_URL}/api/exportcustomer-products/${editingPrice.id}`
        : `${API_URL}/api/exportcustomer-products`;
      const method = editingPrice ? 'PUT' : 'POST';
      const payload = {
        cus_id: parseInt(cus_id),
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        variant_id: formData.variant_id ? parseInt(formData.variant_id) : null,
        common_name: formData.common_name,
        category: formData.category,
        size_range: formData.size_range,
        purchasing_price: parseFloat(formData.purchasing_price),
        exfactoryprice: parseFloat(formData.exfactoryprice),
        export_doc: parseFloat(formData.export_doc) || 0, // USD
        transport_cost: parseFloat(formData.transport_cost) || 0, // USD
        loading_cost: parseFloat(formData.loading_cost) || 0, // USD
        airway_cost: parseFloat(formData.airway_cost) || 0, // USD
        forwardHandling_cost: parseFloat(formData.forwardHandling_cost) || 0, // USD
        gross_weight_tier: formData.gross_weight_tier || null,
        multiplier: parseFloat(formData.multiplier) || 0,
        divisor: parseFloat(formData.divisor) || 1,
        freight_cost: parseFloat(formData.freight_cost) || 0,
        fob_price: parseFloat(formData.fob_price),
        cnf: parseFloat(formData.cnf) || 0
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
    if (products.length === 0) {
      await fetchProducts();
    }
    const product = products.find(p => p.id === price.product_id);
    if (product) {
      setSelectedProduct(product);
      let variantId = '';
      if (product.variants && product.variants.length > 0 && price.size_range) {
        const matchingVariant = product.variants.find(variant =>
          `${variant.size}` === price.size_range
        );
        if (matchingVariant) {
          variantId = String(matchingVariant.id);
        }
      }
      setEditingPrice(price);
      setShowForm(true);
      setFormData({
        product_id: String(price.product_id),
        variant_id: variantId,
        common_name: price.common_name,
        category: price.category,
        size_range: price.size_range,
        purchasing_price: price.purchasing_price,
        exfactoryprice: price.exfactoryprice,
        export_doc: price.export_doc, // Already in USD
        transport_cost: price.transport_cost, // Already in USD
        loading_cost: price.loading_cost, // Already in USD
        airway_cost: price.airway_cost, // Already in USD
        forwardHandling_cost: price.forwardHandling_cost, // Already in USD
        gross_weight_tier: price.gross_weight_tier || '',
        multiplier: price.multiplier || '',
        divisor: price.divisor || '',
        freight_cost: price.freight_cost || '',
        fob_price: price.fob_price,
        cnf: price.cnf || calculateCNF(price.fob_price, price.freight_cost)
      });
    } else {
      setEditingPrice(price);
      setShowForm(true);
      setFormData({
        product_id: String(price.product_id),
        variant_id: price.variant_id ? String(price.variant_id) : '',
        common_name: price.common_name,
        category: price.category,
        size_range: price.size_range,
        purchasing_price: price.purchasing_price,
        exfactoryprice: price.exfactoryprice,
        export_doc: price.export_doc,
        transport_cost: price.transport_cost,
        loading_cost: price.loading_cost,
        airway_cost: price.airway_cost,
        forwardHandling_cost: price.forwardHandling_cost,
        gross_weight_tier: price.gross_weight_tier || '',
        multiplier: price.multiplier || '',
        divisor: price.divisor || '',
        freight_cost: price.freight_cost || '',
        fob_price: price.fob_price,
        cnf: price.cnf || calculateCNF(price.fob_price, price.freight_cost)
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
      exfactoryprice: '',
      export_doc: '',
      transport_cost: '',
      loading_cost: '',
      airway_cost: '',
      forwardHandling_cost: '',
      gross_weight_tier: '',
      multiplier: '',
      divisor: '',
      freight_cost: '',
      fob_price: '',
      cnf: ''
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

  const getCurrentFreightInfo = () => {
    if (!customer?.country) return null;
    const rateData = getFreightRateForCountry(customer.country);
    if (!rateData) return null;
    return (
      <div style={{
        backgroundColor: '#000000',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #2196f3'
      }}>
        <h4 style={{ marginTop: 0, color: '#2196f3' }}>Current Freight Rates for {customer.country}</h4>
        <br />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <div><strong>+45kg:</strong> ${parseFloat(rateData.rate_45kg).toFixed(2)}/kg</div>
          <div><strong>+100kg:</strong> ${parseFloat(rateData.rate_100kg).toFixed(2)}/kg</div>
          <div><strong>+300kg:</strong> ${parseFloat(rateData.rate_300kg).toFixed(2)}/kg</div>
          <div><strong>+500kg:</strong> ${parseFloat(rateData.rate_500kg).toFixed(2)}/kg</div>
        </div>
        <br />
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 0, marginTop: '10px' }}>
          Effective Date: {new Date(rateData.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    );
  };

  const getUsdRateInfo = () => {
    if (!currentUsdRate) return null;
    return (
      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #4caf50'
      }}>
        <h4 style={{ marginTop: 0, color: '#2e7d32' }}>
          Current USD Exchange Rate: Rs. {parseFloat(currentUsdRate).toFixed(2)}
        </h4>
      </div>
    );
  };

  // PDF Download Function
  const handleDownloadPDF = async () => {
    if (prices.length === 0) {
      alert('No products to download');
      return;
    }

    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default;

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Customer Product Price List', pageWidth / 2, 15, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.text(`Customer: ${customer?.cus_name || 'N/A'}`, 14, 25);
      doc.text(`Country: ${customer?.country || 'N/A'}`, 14, 31);

      if (currentUsdRate) {
        doc.text(`USD Rate: Rs. ${parseFloat(currentUsdRate).toFixed(2)}`, 14, 37);
      }

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated: ${currentDate}`, 14, 43);

      const tableData = prices.map(price => {
        const cnfValue = price.cnf || calculateCNF(price.fob_price, price.freight_cost);
        const exFactoryUSD = convertToUSD(price.exfactoryprice);
        const fobUSD = convertToUSD(price.fob_price);

        return [
          price.common_name,
          formatCategory(price.category),
          price.size_range || '-',
          `Rs.${parseFloat(price.purchasing_price).toFixed(2)}`,
          `Rs.${parseFloat(price.exfactoryprice).toFixed(2)}\n$${exFactoryUSD}`,
          price.freight_cost && parseFloat(price.freight_cost) > 0
            ? `$${parseFloat(price.freight_cost).toFixed(2)}\n${price.gross_weight_tier ? price.gross_weight_tier.replace('gross+', '+') : ''}`
            : '-',
          `Rs.${parseFloat(price.fob_price).toFixed(2)}\n$${fobUSD}`,
          `$${cnfValue}`
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [['Product Name', 'Category', 'Size Range', 'Purchasing\nPrice (LKR)', 'Ex-Factory\nPrice', 'Freight\nCost (USD)', 'FOB\nPrice', 'CNF\n(USD)']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [33, 150, 243],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
          5: { cellWidth: 30 },
          6: { cellWidth: 35 },
          7: { cellWidth: 25 }
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3,
          fontSize: 9,
          valign: 'middle',
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 50 }
      });

      const fileName = `${customer?.cus_name || 'Customer'}_Product_List_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please install jsPDF and jspdf-autotable: npm install jspdf jspdf-autotable');
    }
  };

  useEffect(() => {
    console.log('=== DEBUG INFO ===');
    console.log('Selected Product:', selectedProduct);
    console.log('Selected Product Variants:', selectedProduct?.variants);
    console.log('Form Data:', formData);
    console.log('Form Data Variant ID:', formData.variant_id);
    console.log('Editing Price:', editingPrice);
    console.log('Editing Price Variant ID:', editingPrice?.variant_id);
    console.log('Freight Rates:', freightRates);
    console.log('Customer Country:', customer?.country);
    console.log('==================');
  }, [selectedProduct, formData, editingPrice, freightRates, customer]);

  return (
    <div className="pricelist-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/exportcustomerlist')} className="cancel-btn">
          ← Back
        </button>
      </div>
      <h2>Custom Prices - {customer?.cus_name}</h2>
      <h2>{customer?.country}</h2>

      {getCurrentFreightInfo()}
      {getUsdRateInfo()}

      <div className="add-section" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="apf-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ Add Custom Price'}
        </button>
        <button
          className="apf-btn"
          onClick={handleDownloadPDF}
          style={{ backgroundColor: '#4caf50' }}
          disabled={prices.length === 0}
        >
          📄 Download PDF
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
              disabled={editingPrice}
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
                    {variant.size}
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

            <label className="apf-label">Purchasing Price (LKR):</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.purchasing_price}
              onChange={(e) => calculatePrices('purchasing_price', e.target.value)}
              required
              readOnly={editingPrice || (!editingPrice && formData.variant_id !== '')}
              style={editingPrice ? { cursor: 'not-allowed' } : {}}
              placeholder={!editingPrice && selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0
                ? "Auto-filled from selected size"
                : "Enter purchasing price"}
            />

            {editingPrice && (
              <div className="info-text" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Note: Purchasing price cannot be changed when editing
              </div>
            )}

            <label className="apf-label">Ex-Factory Price (LKR):</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.exfactoryprice}
              onChange={(e) => calculatePrices('exfactoryprice', e.target.value)}
              required
              readOnly={editingPrice || (!editingPrice && formData.variant_id !== '')}
              style={editingPrice ? { cursor: 'not-allowed' } : {}}
              placeholder={!editingPrice && selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0
                ? "Auto-filled from selected size"
                : "Enter Ex-Factory price"}
            />

            <label className="apf-label">
              Ex-Factory Price (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#2196f3', marginLeft: '5px', fontWeight: 'normal' }}>
                  (Rate: Rs.{parseFloat(currentUsdRate).toFixed(2)})
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.exfactoryprice && currentUsdRate ? convertToUSD(formData.exfactoryprice) : '0.00'}
              disabled
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
              style={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: '500',
                cursor: 'not-allowed'
              }}
            />

            {editingPrice && (
              <div className="info-text" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Note: Ex-Factory price cannot be changed when editing
              </div>
            )}

            <label className="apf-label">
              Export Documentation Cost (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#ff9800', marginLeft: '5px', fontWeight: 'normal' }}>
                  → Rs.{formData.export_doc ? convertToLKR(formData.export_doc) : '0.00'}
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.export_doc}
              onChange={(e) => calculatePrices('export_doc', e.target.value)}
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
            />

            <label className="apf-label">
              Transport Cost (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#ff9800', marginLeft: '5px', fontWeight: 'normal' }}>
                  → Rs.{formData.transport_cost ? convertToLKR(formData.transport_cost) : '0.00'}
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.transport_cost}
              onChange={(e) => calculatePrices('transport_cost', e.target.value)}
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
            />

            <label className="apf-label">
              Loading Cost (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#ff9800', marginLeft: '5px', fontWeight: 'normal' }}>
                  → Rs.{formData.loading_cost ? convertToLKR(formData.loading_cost) : '0.00'}
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.loading_cost}
              onChange={(e) => calculatePrices('loading_cost', e.target.value)}
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
            />

            <label className="apf-label">
              Airway Bill Cost (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#ff9800', marginLeft: '5px', fontWeight: 'normal' }}>
                  → Rs.{formData.airway_cost ? convertToLKR(formData.airway_cost) : '0.00'}
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.airway_cost}
              onChange={(e) => calculatePrices('airway_cost', e.target.value)}
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
            />

            <label className="apf-label">
              Forward Handling Cost (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#ff9800', marginLeft: '5px', fontWeight: 'normal' }}>
                  → Rs.{formData.forwardHandling_cost ? convertToLKR(formData.forwardHandling_cost) : '0.00'}
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.forwardHandling_cost}
              onChange={(e) => calculatePrices('forwardHandling_cost', e.target.value)}
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
            />

            <label className="apf-label">FOB Price (LKR):</label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.fob_price}
              disabled
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
              style={{
                backgroundColor: '#fff3e0',
                color: '#e65100',
                fontWeight: 'bold',
                cursor: 'not-allowed'
              }}
            />

            <label className="apf-label">
              FOB Price (USD)
              {currentUsdRate && (
                <span style={{ fontSize: '11px', color: '#2196f3', marginLeft: '5px', fontWeight: 'normal' }}>
                  (Rate: Rs.{parseFloat(currentUsdRate).toFixed(2)})
                </span>
              )}
            </label>
            <input
              type="number"
              className="apf-input"
              step="0.01"
              value={formData.fob_price && currentUsdRate ? convertToUSD(formData.fob_price) : '0.00'}
              disabled
              placeholder="0.00"
              onWheel={(e) => e.target.blur()}
              style={{
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontWeight: 'bold',
                cursor: 'not-allowed'
              }}
            />

            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: 'transparent',
              padding: '15px',
              borderRadius: '8px',
              marginTop: '15px',
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#ffffff' }}>
                Freight Calculation
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label className="apf-label">Gross Weight Tier:</label>
                  <select
                    className="apf-input"
                    value={formData.gross_weight_tier}
                    onChange={(e) => calculatePrices('gross_weight_tier', e.target.value)}
                  >
                    <option value="">-- Select Weight Tier --</option>
                    <option value="gross+45kg">Gross +45kg</option>
                    <option value="gross+100kg">Gross +100kg</option>
                    <option value="gross+300kg">Gross +300kg</option>
                    <option value="gross+500kg">Gross +500kg</option>
                  </select>
                </div>

                <div>
                  <label className="apf-label">Gross Weight (kg) - Multiplier:</label>
                  <input
                    type="number"
                    className="apf-input"
                    step="0.01"
                    value={formData.multiplier}
                    onChange={(e) => calculatePrices('multiplier', e.target.value)}
                    placeholder="e.g., 150"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div>
                  <label className="apf-label">Divisor:</label>
                  <input
                    type="number"
                    className="apf-input"
                    step="0.01"
                    value={formData.divisor}
                    onChange={(e) => calculatePrices('divisor', e.target.value)}
                    placeholder="e.g., 1"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div>
                  <label className="apf-label">Freight Cost (USD - Calculated):</label>
                  <input
                    type="number"
                    className="apf-input"
                    step="0.01"
                    value={formData.freight_cost}
                    onChange={(e) => calculatePrices('freight_cost', e.target.value)}
                    placeholder="0.00"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>
                <div>
                  <label className="apf-label">
                    CNF (Cost and Freight) - USD
                    <span style={{ fontSize: '11px', color: '#9c27b0', marginLeft: '5px', fontWeight: 'normal' }}>
                      (FOB + Freight Cost)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="apf-input"
                    step="0.01"
                    value={formData.cnf}
                    disabled
                    placeholder="0.00"
                    onWheel={(e) => e.target.blur()}
                    style={{
                      backgroundColor: '#f3e5f5',
                      color: '#7b1fa2',
                      fontWeight: 'bold',
                      cursor: 'not-allowed',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>
            </div>

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
                <th>Ex-Factory Price</th>
                <th>Freight Cost</th>
                <th>FOB Price</th>
                <th>CNF (USD)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted">No custom prices set</td>
                </tr>
              )}

              {prices.map(price => {
                const cnfValue = price.cnf || calculateCNF(price.fob_price, price.freight_cost);

                return (
                  <tr key={price.id} className="responsive-row">
                    <td data-label="Common Name">{price.common_name}</td>
                    <td data-label="Category">{formatCategory(price.category)}</td>
                    <td data-label="Size Range">{price.size_range || '-'}</td>
                    <td data-label="Purchasing Price">Rs.{parseFloat(price.purchasing_price).toFixed(2)}</td>
                    <td data-label="Ex-Factory Price">
                      <div style={{ fontWeight: 'bold' }}>Rs.{parseFloat(price.exfactoryprice).toFixed(2)}</div>
                      {currentUsdRate && (
                        <small style={{ color: '#1976d2', fontSize: '0.85rem', fontWeight: '600' }}>
                          ${convertToUSD(price.exfactoryprice)}
                        </small>
                      )}
                    </td>
                    <td data-label="Freight Cost">
                      {price.freight_cost && parseFloat(price.freight_cost) > 0 ? (
                        <>
                          $ {parseFloat(price.freight_cost).toFixed(2)}
                          {price.gross_weight_tier && (
                            <small style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>
                              {price.gross_weight_tier.replace('gross+', '+')}
                              {price.multiplier && ` (${price.multiplier}kg ÷ ${price.divisor || 1})`}
                            </small>
                          )}
                        </>
                      ) : '-'}
                    </td>
                    <td data-label="FOB Price">
                      <div style={{ fontWeight: 'bold' }}>Rs.{parseFloat(price.fob_price).toFixed(2)}</div>
                      {currentUsdRate && (
                        <small style={{ color: '#1976d2', fontSize: '0.85rem', fontWeight: '600' }}>
                          ${convertToUSD(price.fob_price)}
                        </small>
                      )}
                    </td>
                    <td data-label="CNF (USD)">
                      <div style={{ fontWeight: 'bold', color: '#ffffff', fontSize: '15px' }}>
                        ${cnfValue}
                      </div>
                      <small style={{ color: '#666', fontSize: '0.75rem' }}>
                        (Cost & Freight)
                      </small>
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExportCustomerDetail;