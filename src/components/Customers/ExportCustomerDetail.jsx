import React, { useEffect, useState,useCallback } from 'react';
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
  const [seaFreightRates, setSeaFreightRates] = useState([]);
  const [currentUsdRate, setCurrentUsdRate] = useState(null);
  
  // Form state - costs stored in USD, but user can input in either currency
  const [formData, setFormData] = useState({
    product_id: '',
    variant_id: '',
    common_name: '',
    category: '',
    size_range: '',
    purchasing_price: '',
    exfactoryprice: '',
    export_doc_usd: '',
    export_doc_lkr: '',
    transport_cost_usd: '',
    transport_cost_lkr: '',
    loading_cost_usd: '',
    loading_cost_lkr: '',
    airway_cost_usd: '',
    airway_cost_lkr: '',
    forwardHandling_cost_usd: '',
    forwardHandling_cost_lkr: '',
    freight_type: 'air', // 'air' or 'sea'
    gross_weight_tier: '',
    container_type: '', // '20ft' or '40ft'
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
    fetchSeaFreightRates();
    fetchUsdRate();
  }, [cus_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
  if (formData.exfactoryprice && currentUsdRate) {
    const exfactoryprice = parseFloat(formData.exfactoryprice) || 0;
    
    let export_doc_usd = parseFloat(formData.export_doc_usd) || 0;
    let transport_cost_usd = parseFloat(formData.transport_cost_usd) || 0;
    let loading_cost_usd = parseFloat(formData.loading_cost_usd) || 0;
    let airway_cost_usd = parseFloat(formData.airway_cost_usd) || 0;
    let forwardHandling_cost_usd = parseFloat(formData.forwardHandling_cost_usd) || 0;
    let freight_cost = parseFloat(formData.freight_cost) || 0;

    const totalCostsUSD =
      export_doc_usd +
      transport_cost_usd +
      loading_cost_usd +
      airway_cost_usd +
      forwardHandling_cost_usd;

    const totalCostsLKR = totalCostsUSD * parseFloat(currentUsdRate);

    const fobPriceLKR = exfactoryprice + totalCostsLKR;
    const fob_price = fobPriceLKR.toFixed(2);

    const cnf = calculateCNF(fobPriceLKR, freight_cost);

    if (formData.fob_price !== fob_price || formData.cnf !== cnf) {
      setFormData(prev => ({
        ...prev,
        fob_price,
        cnf
      }));
    }
  }
}, [
  formData.exfactoryprice,
  formData.export_doc_usd,
  formData.transport_cost_usd,
  formData.loading_cost_usd,
  formData.airway_cost_usd,
  formData.forwardHandling_cost_usd,
  formData.freight_cost,
  currentUsdRate,
  calculateCNF,
  formData.cnf,
  formData.fob_price
]);


 
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

  const fetchSeaFreightRates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sea-freight-rates`);
      if (!res.ok) throw new Error('Failed to fetch sea freight rates');
      const data = await res.json();
      setSeaFreightRates(data);
    } catch (err) {
      console.error('Error fetching sea freight rates:', err);
    }
  };

  // Get air freight rate for customer's specific country AND airport code
  const getAirFreightRateForCustomer = (customer) => {
    if (!customer || freightRates.length === 0) return null;
    
    // First, try to find rate for specific country AND airport code
    if (customer.airport_code) {
      const exactMatch = freightRates.filter(rate =>
        rate.country.toLowerCase() === customer.country.toLowerCase() &&
        rate.airport_code && rate.airport_code.toUpperCase() === customer.airport_code.toUpperCase()
      );
      
      if (exactMatch.length > 0) {
        // Return the most recent rate for this country + airport combination
        return exactMatch.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      }
    }
    
    // Fallback: If no specific airport match, get any rate for the country
    const countryRates = freightRates.filter(rate =>
      rate.country.toLowerCase() === customer.country.toLowerCase()
    );
    
    if (countryRates.length === 0) return null;
    
    // Return the most recent rate for this country
    return countryRates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  // Get sea freight rate for customer's specific country AND port code
  const getSeaFreightRateForCustomer = (customer) => {
    if (!customer || seaFreightRates.length === 0) return null;
    
    // First, try to find rate for specific country AND port code
    if (customer.port_code) {
      const exactMatch = seaFreightRates.filter(rate =>
        rate.country.toLowerCase() === customer.country.toLowerCase() &&
        rate.port_code && rate.port_code.toUpperCase() === customer.port_code.toUpperCase()
      );
      
      if (exactMatch.length > 0) {
        // Return the most recent rate for this country + port combination
        return exactMatch.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      }
    }
    
    // Fallback: If no specific port match, get any rate for the country
    const countryRates = seaFreightRates.filter(rate =>
      rate.country.toLowerCase() === customer.country.toLowerCase()
    );
    
    if (countryRates.length === 0) return null;
    
    // Return the most recent rate for this country
    return countryRates.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  };

  const getAirFreightRateByTier = (tier, rateData) => {
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

  const getSeaFreightRateByContainer = (containerType, rateData) => {
    if (!rateData || !containerType) return { rate: 0, kilos: 0 };
    
    if (containerType === '20ft') {
      return {
        rate: parseFloat(rateData.rate_20ft) || 0,
        kilos: parseFloat(rateData.kilos_20ft) || 0,
        perKilo: parseFloat(rateData.freight_per_kilo_20ft) || 0
      };
    } else if (containerType === '40ft') {
      return {
        rate: parseFloat(rateData.rate_40ft) || 0,
        kilos: parseFloat(rateData.kilos_40ft) || 0,
        perKilo: parseFloat(rateData.freight_per_kilo_40ft) || 0
      };
    }
    
    return { rate: 0, kilos: 0, perKilo: 0 };
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

 const calculateCNF = useCallback((fobPriceLKR, freightCostUSD) => {
  const usdRate = parseFloat(currentUsdRate);

  if (!usdRate || isNaN(usdRate)) return '0.00';

  const fobLKR = parseFloat(fobPriceLKR) || 0;
  const freightUSD = parseFloat(freightCostUSD) || 0;

  const fobInUSD = fobLKR / usdRate;
  const cnf = fobInUSD + freightUSD;

  return cnf.toFixed(2);
}, [currentUsdRate]);


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
      multiplier: '',      // ADD THIS
      divisor: '',         // ADD THIS
      fob_price: '',
      cnf: ''
      }));
      return;
    }
    const variant = selectedProduct.variants?.find(v => String(v.id) === String(variantId));
    if (variant) {
      const sizeRange = `${variant.size}`;
      const purchasingPrice = variant.purchasing_price;
      const exfactoryprice = variant.exfactoryprice;
      const multiplier = variant.multiplier || '';     // ADD THIS
    const divisor = variant.divisor || '1';          // ADD THIS


      // Update formData - useEffect will handle FOB/CNF calculation
      setFormData(prev => ({
        ...prev,
        variant_id: String(variantId),
        size_range: sizeRange,
        purchasing_price: purchasingPrice,
        exfactoryprice: exfactoryprice,
        multiplier: multiplier,      // ADD THIS
      divisor: divisor             // ADD THIS
      }));
    }
  };

  const calculatePrices = (field, value) => {
    const data = {
      ...formData,
      [field]: value
    };

    // Handle USD/LKR pair updates
    if (field === 'export_doc_usd') {
      data.export_doc_lkr = convertToLKR(value);
    } else if (field === 'export_doc_lkr') {
      data.export_doc_usd = convertToUSD(value);
    } else if (field === 'transport_cost_usd') {
      data.transport_cost_lkr = convertToLKR(value);
    } else if (field === 'transport_cost_lkr') {
      data.transport_cost_usd = convertToUSD(value);
    } else if (field === 'loading_cost_usd') {
      data.loading_cost_lkr = convertToLKR(value);
    } else if (field === 'loading_cost_lkr') {
      data.loading_cost_usd = convertToUSD(value);
    } else if (field === 'airway_cost_usd') {
      data.airway_cost_lkr = convertToLKR(value);
    } else if (field === 'airway_cost_lkr') {
      data.airway_cost_usd = convertToUSD(value);
    } else if (field === 'forwardHandling_cost_usd') {
      data.forwardHandling_cost_lkr = convertToLKR(value);
    } else if (field === 'forwardHandling_cost_lkr') {
      data.forwardHandling_cost_usd = convertToUSD(value);
    }

    // Reset freight-specific fields when freight type changes
    if (field === 'freight_type') {
      data.gross_weight_tier = '';
      data.container_type = '';
      data.freight_cost = '';
      // Clear multiplier and divisor only when switching to sea freight
      if (value === 'sea') {
        data.multiplier = '';
        data.divisor = '';
      }
    }

    const exfactoryprice = parseFloat(data.exfactoryprice) || 0;
    
    // Use USD values for calculation
    let export_doc_usd = parseFloat(data.export_doc_usd) || 0;
    let transport_cost_usd = parseFloat(data.transport_cost_usd) || 0;
    let loading_cost_usd = parseFloat(data.loading_cost_usd) || 0;
    let airway_cost_usd = parseFloat(data.airway_cost_usd) || 0;
    let forwardHandling_cost_usd = parseFloat(data.forwardHandling_cost_usd) || 0;
    
    let multiplier = parseFloat(data.multiplier) || 0;
    let divisor = parseFloat(data.divisor) || 1;
    let freight_cost = parseFloat(data.freight_cost) || 0;

    // Calculate freight cost based on type
    if (data.freight_type === 'air') {
      // Air freight calculation
      if (field === 'gross_weight_tier' || field === 'multiplier' || field === 'divisor') {
        const airRateData = getAirFreightRateForCustomer(customer);
        if (airRateData && data.gross_weight_tier && multiplier > 0 && divisor > 0) {
          const applicableRate = getAirFreightRateByTier(data.gross_weight_tier, airRateData);
          freight_cost = (multiplier * applicableRate) / divisor;
          data.freight_cost = freight_cost.toFixed(2);
        }
      }
    } else if (data.freight_type === 'sea') {
      // Sea freight calculation - use full container rate
      if (field === 'container_type') {
        const seaRateData = getSeaFreightRateForCustomer(customer);
        if (seaRateData && data.container_type) {
          const containerData = getSeaFreightRateByContainer(data.container_type, seaRateData);
          // Use the full container rate directly
          freight_cost = containerData.perKilo;
          data.freight_cost = freight_cost.toFixed(4);
        }
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
      
      // Save USD values to database
      const payload = {
        cus_id: parseInt(cus_id),
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        variant_id: formData.variant_id ? parseInt(formData.variant_id) : null,
        common_name: formData.common_name,
        category: formData.category,
        size_range: formData.size_range,
        purchasing_price: parseFloat(formData.purchasing_price),
        exfactoryprice: parseFloat(formData.exfactoryprice),
        export_doc: parseFloat(formData.export_doc_usd) || 0,
        transport_cost: parseFloat(formData.transport_cost_usd) || 0,
        loading_cost: parseFloat(formData.loading_cost_usd) || 0,
        airway_cost: parseFloat(formData.airway_cost_usd) || 0,
        forwardHandling_cost: parseFloat(formData.forwardHandling_cost_usd) || 0,
        freight_type: formData.freight_type,
        gross_weight_tier: formData.freight_type === 'air' ? formData.gross_weight_tier : null,
        container_type: formData.freight_type === 'sea' ? formData.container_type : null,
        multiplier: formData.freight_type === 'air' ? parseFloat(formData.multiplier) || 0 : 0,
        divisor: formData.freight_type === 'air' ? parseFloat(formData.divisor) || 1 : 1,
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
      
      // Costs are stored in USD, populate both USD and LKR fields
      setFormData({
        product_id: String(price.product_id),
        variant_id: variantId,
        common_name: price.common_name,
        category: price.category,
        size_range: price.size_range,
        purchasing_price: price.purchasing_price,
        exfactoryprice: price.exfactoryprice,
        export_doc_usd: price.export_doc || '',
        export_doc_lkr: convertToLKR(price.export_doc),
        transport_cost_usd: price.transport_cost || '',
        transport_cost_lkr: convertToLKR(price.transport_cost),
        loading_cost_usd: price.loading_cost || '',
        loading_cost_lkr: convertToLKR(price.loading_cost),
        airway_cost_usd: price.airway_cost || '',
        airway_cost_lkr: convertToLKR(price.airway_cost),
        forwardHandling_cost_usd: price.forwardHandling_cost || '',
        forwardHandling_cost_lkr: convertToLKR(price.forwardHandling_cost),
        freight_type: price.freight_type || 'air',
        gross_weight_tier: price.gross_weight_tier || '',
        container_type: price.container_type || '',
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
        export_doc_usd: price.export_doc || '',
        export_doc_lkr: convertToLKR(price.export_doc),
        transport_cost_usd: price.transport_cost || '',
        transport_cost_lkr: convertToLKR(price.transport_cost),
        loading_cost_usd: price.loading_cost || '',
        loading_cost_lkr: convertToLKR(price.loading_cost),
        airway_cost_usd: price.airway_cost || '',
        airway_cost_lkr: convertToLKR(price.airway_cost),
        forwardHandling_cost_usd: price.forwardHandling_cost || '',
        forwardHandling_cost_lkr: convertToLKR(price.forwardHandling_cost),
        freight_type: price.freight_type || 'air',
        gross_weight_tier: price.gross_weight_tier || '',
        container_type: price.container_type || '',
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
      export_doc_usd: '',
      export_doc_lkr: '',
      transport_cost_usd: '',
      transport_cost_lkr: '',
      loading_cost_usd: '',
      loading_cost_lkr: '',
      airway_cost_usd: '',
      airway_cost_lkr: '',
      forwardHandling_cost_usd: '',
      forwardHandling_cost_lkr: '',
      freight_type: 'air',
      gross_weight_tier: '',
      container_type: '',
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
    if (!customer) return null;
    
    const airRateData = getAirFreightRateForCustomer(customer);
    const seaRateData = getSeaFreightRateForCustomer(customer);
    
    if (!airRateData && !seaRateData) {
      return (
        <div style={{
          backgroundColor: '#ff5722',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #d84315',
          color: 'white'
        }}>
          <h4 style={{ marginTop: 0 }}>⚠️ No Freight Rates Available</h4>
          <p style={{ marginBottom: 0 }}>
            No freight rates found for {customer.country}.
            Please add freight rates in the Freight Rates section.
          </p>
        </div>
      );
    }
    
    return (
      <>
        {/* Air Freight Rates */}
        {airRateData && (
          <div style={{
            backgroundColor: '#1b5e20',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #4caf50'
          }}>
            <h4 style={{ marginTop: 0, color: '#81c784' }}>
              ✈️ Air Freight Rates - {customer.country}
              {airRateData.airport_code && ` (${airRateData.airport_code})`}
            </h4>
            {customer.airport_name && (
              <p style={{ fontSize: '0.9rem', color: '#a5d6a7', marginTop: '5px', marginBottom: '10px' }}>
                {customer.airport_name}
              </p>
            )}
            
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#81c784', marginBottom: '8px' }}>
                Rates (USD/kg)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div><strong>+45kg:</strong> ${parseFloat(airRateData.rate_45kg).toFixed(2)}/kg</div>
                <div><strong>+100kg:</strong> ${parseFloat(airRateData.rate_100kg).toFixed(2)}/kg</div>
                <div><strong>+300kg:</strong> ${parseFloat(airRateData.rate_300kg).toFixed(2)}/kg</div>
                <div><strong>+500kg:</strong> ${parseFloat(airRateData.rate_500kg).toFixed(2)}/kg</div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 0, marginTop: '15px' }}>
              Effective Date: {new Date(airRateData.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Sea Freight Rates */}
        {seaRateData && (
          <div style={{
            backgroundColor: '#0d47a1',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #2196f3'
          }}>
            <h4 style={{ marginTop: 0, color: '#64b5f6' }}>
              🚢 Sea Freight Rates - {customer.country}
              {seaRateData.port_code && ` (${seaRateData.port_code})`}
            </h4>
            {customer.port_name && (
              <p style={{ fontSize: '0.9rem', color: '#90caf9', marginTop: '5px', marginBottom: '10px' }}>
                {customer.port_name}
              </p>
            )}
            
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#64b5f6', marginBottom: '8px' }}>
                Container Rates
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>20ft Container</div>
                  <div>Rate: ${parseFloat(seaRateData.rate_20ft).toFixed(2)}</div>
                  <div>Capacity: {parseFloat(seaRateData.kilos_20ft).toLocaleString()} kg</div>
                  <div>Per Kilo: ${parseFloat(seaRateData.freight_per_kilo_20ft || 0).toFixed(4)}/kg</div>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>40ft Container</div>
                  <div>Rate: ${parseFloat(seaRateData.rate_40ft).toFixed(2)}</div>
                  <div>Capacity: {parseFloat(seaRateData.kilos_40ft).toLocaleString()} kg</div>
                  <div>Per Kilo: ${parseFloat(seaRateData.freight_per_kilo_40ft || 0).toFixed(4)}/kg</div>
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: 0, marginTop: '15px' }}>
              Effective Date: {new Date(seaRateData.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </>
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
      
      let yPos = 37;
      if (customer?.airport_code) {
        doc.text(`Airport: ${customer.airport_code}${customer.airport_name ? ' - ' + customer.airport_name : ''}`, 14, yPos);
        yPos += 6;
      }
      if (customer?.port_code) {
        doc.text(`Port: ${customer.port_code}${customer.port_name ? ' - ' + customer.port_name : ''}`, 14, yPos);
        yPos += 6;
      }

      if (currentUsdRate) {
        doc.text(`USD Rate: Rs. ${parseFloat(currentUsdRate).toFixed(2)}`, 14, yPos);
        yPos += 6;
      }

      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated: ${currentDate}`, 14, yPos);
      yPos += 6;

      const tableData = prices.map(price => {
        const cnfValue = price.cnf || calculateCNF(price.fob_price, price.freight_cost);
        const exFactoryUSD = convertToUSD(price.exfactoryprice);
        const fobUSD = convertToUSD(price.fob_price);

        let freightInfo = '-';
        if (price.freight_cost && parseFloat(price.freight_cost) > 0) {
          const freightType = price.freight_type === 'sea' ? '(SEA)' : '(AIR)';
          if (price.freight_type === 'air' && price.gross_weight_tier) {
            freightInfo = `${freightType} $${parseFloat(price.freight_cost).toFixed(2)}\n${price.gross_weight_tier.replace('gross+', '+')}`;
          } else if (price.freight_type === 'sea' && price.container_type) {
            freightInfo = `${freightType} $${parseFloat(price.freight_cost).toFixed(2)}\n${price.container_type} Container`;
          } else {
            freightInfo = `$${parseFloat(price.freight_cost).toFixed(2)}`;
          }
        }

        return [
          price.common_name,
          formatCategory(price.category),
          price.size_range || '-',
          `Rs.${parseFloat(price.purchasing_price).toFixed(2)}`,
          `Rs.${parseFloat(price.exfactoryprice).toFixed(2)}\n$${exFactoryUSD}`,
          freightInfo,
          `Rs.${parseFloat(price.fob_price).toFixed(2)}\n$${fobUSD}`,
          `$${cnfValue}`
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Product Name', 'Category', 'Size Range', 'Purchasing\nPrice (LKR)', 'Ex-Factory\nPrice', 'Freight\nCost', 'FOB\nPrice', 'CNF\n(USD)']],
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
        margin: { top: yPos }
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
    console.log('Customer:', customer);
    console.log('Air Freight Rates:', freightRates);
    console.log('Sea Freight Rates:', seaFreightRates);
    console.log('Matched Air Rate:', customer ? getAirFreightRateForCustomer(customer) : null);
    console.log('Matched Sea Rate:', customer ? getSeaFreightRateForCustomer(customer) : null);
    console.log('==================');
  }, [customer, freightRates, seaFreightRates]); // eslint-disable-line react-hooks/exhaustive-deps


  return (
    <div className="pricelist-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => navigate('/exportcustomerlist')} className="cancel-btn">
          ← Back
        </button>
      </div>
      <h2>Custom Prices - {customer?.cus_name}</h2>
      <h2>{customer?.country}
        {customer?.airport_code && ` - ${customer.airport_code}`}
        {customer?.airport_name && (
          <span style={{ fontSize: '0.8em', color: '#2196f3', marginLeft: '10px' }}>
            ({customer.airport_name})
          </span>
        )}
      </h2>

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

            <div style={{
              gridColumn: '1 / -1',
              backgroundColor: 'transparent',
              padding: '20px',
              borderRadius: '8px',
              marginTop: '20px',
              marginBottom: '10px'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '18px' }}>
                Additional Costs
              </h3>
              {currentUsdRate && (
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#ffffff', fontStyle: 'italic' }}>
                  Exchange Rate: 1 USD = Rs.{parseFloat(currentUsdRate).toFixed(2)} | Enter values in either currency
                </p>
              )}

              {/* Export Documentation Cost */}
              <div style={{ 
                marginBottom: '20px',
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                  Export Documentation Cost
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      USD ($)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.export_doc_usd}
                      onChange={(e) => calculatePrices('export_doc_usd', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      LKR (Rs.)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.export_doc_lkr}
                      onChange={(e) => calculatePrices('export_doc_lkr', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Transport Cost */}
              <div style={{ 
                marginBottom: '20px',
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                  Transport Cost
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      USD ($)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.transport_cost_usd}
                      onChange={(e) => calculatePrices('transport_cost_usd', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      LKR (Rs.)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.transport_cost_lkr}
                      onChange={(e) => calculatePrices('transport_cost_lkr', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Loading Cost */}
              <div style={{ 
                marginBottom: '20px',
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                  Loading Cost
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      USD ($)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.loading_cost_usd}
                      onChange={(e) => calculatePrices('loading_cost_usd', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      LKR (Rs.)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.loading_cost_lkr}
                      onChange={(e) => calculatePrices('loading_cost_lkr', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Airway Bill Cost */}
              <div style={{ 
                marginBottom: '20px',
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                  Airway Bill Cost
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      USD ($)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.airway_cost_usd}
                      onChange={(e) => calculatePrices('airway_cost_usd', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      LKR (Rs.)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.airway_cost_lkr}
                      onChange={(e) => calculatePrices('airway_cost_lkr', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Forward Handling Cost */}
              <div style={{ 
                marginBottom: '0',
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                  Forward Handling Cost
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      USD ($)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.forwardHandling_cost_usd}
                      onChange={(e) => calculatePrices('forwardHandling_cost_usd', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '6px', 
                      fontSize: '13px', 
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>
                      LKR (Rs.)
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.forwardHandling_cost_lkr}
                      onChange={(e) => calculatePrices('forwardHandling_cost_lkr', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

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
              padding: '20px',
              borderRadius: '8px',
              marginTop: '15px',
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#ffffff', fontSize: '18px' }}>
                Freight Calculation
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#c9c9c9', fontStyle: 'italic' }}>
                Configure freight rates based on type and weight
              </p>

              {/* Freight Type Selection */}
              <div style={{
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '2px solid #2196f3',
                marginBottom: '20px'
              }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px', 
                  color: '#ffffff',
                  fontWeight: '700'
                }}>
                  Freight Type
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="freight_type"
                      value="air"
                      checked={formData.freight_type === 'air'}
                      onChange={(e) => calculatePrices('freight_type', e.target.value)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: '500' }}>
                      ✈️ Air Freight
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="freight_type"
                      value="sea"
                      checked={formData.freight_type === 'sea'}
                      onChange={(e) => calculatePrices('freight_type', e.target.value)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: '500' }}>
                      🚢 Sea Freight
                    </span>
                  </label>
                </div>
              </div>

              {/* Air Freight Configuration */}
              {formData.freight_type === 'air' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  {/* Gross Weight Tier */}
                  <div style={{
                    backgroundColor: 'transparent',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #a5d6a7'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      Gross Weight Tier
                    </label>
                    <select
                      className="apf-input"
                      value={formData.gross_weight_tier}
                      onChange={(e) => calculatePrices('gross_weight_tier', e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Select Weight Tier --</option>
                      <option value="gross+45kg">Gross +45kg</option>
                      <option value="gross+100kg">Gross +100kg</option>
                      <option value="gross+300kg">Gross +300kg</option>
                      <option value="gross+500kg">Gross +500kg</option>
                    </select>
                  </div>

                  {/* Multiplier */}
                  <div style={{
                    backgroundColor: 'transparent',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      Gross Weight (kg) - Multiplier
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.multiplier}
                      onChange={(e) => calculatePrices('multiplier', e.target.value)}
                      placeholder="e.g., 150"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Divisor */}
                  <div style={{
                    backgroundColor: 'transparent',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      Divisor
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.divisor}
                      onChange={(e) => calculatePrices('divisor', e.target.value)}
                      placeholder="e.g., 1"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Freight Cost */}
                  <div style={{
                    backgroundColor: 'transparent',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      Freight Cost (USD)
                      <span style={{ fontSize: '11px', color: '#ffffff', marginLeft: '5px', fontWeight: 'normal' }}>
                        - Calculated
                      </span>
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.freight_cost}
                      onChange={(e) => calculatePrices('freight_cost', e.target.value)}
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              {/* Sea Freight Configuration */}
              {formData.freight_type === 'sea' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  {/* Container Type */}
                  <div style={{
                    backgroundColor: 'transparent',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #64b5f6'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      Container Type
                    </label>
                    <select
                      className="apf-input"
                      value={formData.container_type}
                      onChange={(e) => calculatePrices('container_type', e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="">-- Select Container --</option>
                      <option value="20ft">20ft Container</option>
                      <option value="40ft">40ft Container</option>
                    </select>
                  </div>

                  {/* Freight Cost */}
                  <div style={{
                    backgroundColor: 'transparent',
                    padding: '15px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontSize: '14px', 
                      color: '#ffffff',
                      fontWeight: '600'
                    }}>
                      Freight Cost (USD)
                      <span style={{ fontSize: '11px', color: '#ffffff', marginLeft: '5px', fontWeight: 'normal' }}>
                        - Full Container Rate
                      </span>
                    </label>
                    <input
                      type="number"
                      className="apf-input"
                      step="0.01"
                      value={formData.freight_cost}
                      disabled
                      placeholder="0.00"
                      onWheel={(e) => e.target.blur()}
                      style={{ 
                        width: '100%',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 'bold',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* CNF - Full Width */}
              <div style={{
                backgroundColor: 'transparent',
                padding: '15px',
                borderRadius: '6px',
                border: '2px solid #ffffff',
                marginTop: '15px'
              }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '15px', 
                  color: '#ffffff',
                  fontWeight: '700'
                }}>
                  CNF (Cost and Freight) - USD
                  <span style={{ fontSize: '12px', color: '#d6d6d6', marginLeft: '8px', fontWeight: 'normal' }}>
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
                    width: '100%',
                    backgroundColor: '#ffffff',
                    color: '#6a1b9a',
                    fontWeight: 'bold',
                    cursor: 'not-allowed',
                    fontSize: '16px',
                    border: '2px solid #ba68c8'
                  }}
                />
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
                const freightType = price.freight_type === 'sea' ? '🚢' : '✈️';

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
                          {freightType} ${parseFloat(price.freight_cost).toFixed(2)}
                          {price.freight_type === 'air' && price.gross_weight_tier && (
                            <small style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>
                              {price.gross_weight_tier.replace('gross+', '+')}
                              {price.multiplier && ` (${price.multiplier}kg ÷ ${price.divisor || 1})`}
                            </small>
                          )}
                          {price.freight_type === 'sea' && price.container_type && (
                            <small style={{ display: 'block', color: '#666', fontSize: '0.8rem' }}>
                              {price.container_type} Container
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