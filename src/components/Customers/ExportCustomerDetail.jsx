import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CustomerDetail.css";
import logoSrc from "./logo.png";

const sf = (v, d = 0) => (isFinite(parseFloat(v)) ? parseFloat(v) : d);

// Always recalculate FOB using live USD rate (never use stored fob_price for display)
const calcLiveFob = (price, liveRate) => {
  if (!liveRate || !price) return sf(price?.fob_price);
  const rate = sf(liveRate, 304);
  const exf = sf(price.exfactoryprice);
  const handling =
    sf(price.export_doc) +
    sf(price.transport_cost) +
    sf(price.loading_cost) +
    sf(price.airway_cost) +
    sf(price.forwardHandling_cost);
  return exf / rate + handling;
};

// Recalculate CNF using live FOB + stored freight cost
const calcLiveCNF = (fobUSD, freightUSD) => sf(fobUSD) + sf(freightUSD);

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

  const initialFormData = {
    product_id: "",
    variant_id: "",
    common_name: "",
    category: "",
    size_range: "",
    purchasing_price: "",
    exfactoryprice: "",
    export_doc_usd: "",
    export_doc_lkr: "",
    transport_cost_usd: "",
    transport_cost_lkr: "",
    loading_cost_usd: "",
    loading_cost_lkr: "",
    airway_cost_usd: "",
    airway_cost_lkr: "",
    forwardHandling_cost_usd: "",
    forwardHandling_cost_lkr: "",
    freight_type: "air",
    multiplier: "",
    divisor: "",
    fob_price_usd: "",
    freight_cost_45kg: "",
    freight_cost_100kg: "",
    freight_cost_300kg: "",
    freight_cost_500kg: "",
    cnf_45kg: "",
    cnf_100kg: "",
    cnf_300kg: "",
    cnf_500kg: "",
    freight_cost_20ft: "",
    cnf_20ft: "",
    freight_cost_40ft: "",
    cnf_40ft: "",
    image: "",
    scientific_name: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  // ── Fetchers ───────────────────────────────────────────────
  const fetchCustomer = async () => {
    try {
      const r = await fetch(`${API_URL}/api/exportcustomerlist/${cus_id}`);
      if (!r.ok) throw new Error("Failed");
      setCustomer(await r.json());
    } catch (e) {
      setError(e.message);
    }
  };
  const fetchPrices = async () => {
    try {
      const r = await fetch(`${API_URL}/api/exportcustomer-products/${cus_id}`);
      if (!r.ok) throw new Error("Failed");
      setPrices(await r.json());
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };
  const fetchProducts = async () => {
    try {
      const r = await fetch(`${API_URL}/api/exportproductlist`);
      if (!r.ok) throw new Error("Failed");
      setProducts(await r.json());
    } catch (e) {
      console.error(e);
    }
  };
  const fetchFreightRates = async () => {
    try {
      const r = await fetch(`${API_URL}/api/freight-rates`);
      if (!r.ok) throw new Error("Failed");
      setFreightRates(await r.json());
    } catch (e) {
      console.error(e);
    }
  };
  const fetchSeaRates = async () => {
    try {
      const r = await fetch(`${API_URL}/api/sea-freight-rates`);
      if (!r.ok) throw new Error("Failed");
      setSeaFreightRates(await r.json());
    } catch (e) {
      console.error(e);
    }
  };
  const fetchUsdRate = async () => {
    try {
      const r = await fetch(`${API_URL}/api/usd-rate`);
      if (!r.ok) throw new Error("Failed");
      const d = await r.json();
      setCurrentUsdRate(d.rate);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchPrices();
    fetchProducts();
    fetchFreightRates();
    fetchSeaRates();
    fetchUsdRate();
  }, [cus_id]); // eslint-disable-line

  // ── Freight rate helpers ───────────────────────────────────
  const getAirRate = (cust) => {
    if (!cust || !freightRates.length) return null;
    const sorted = [...freightRates].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    if (cust.airport_code) {
      const exact = sorted.filter(
        (r) =>
          r.country?.toLowerCase() === cust.country?.toLowerCase() &&
          r.airport_code?.toUpperCase() === cust.airport_code.toUpperCase(),
      );
      if (exact.length) return exact[0];
    }
    return (
      sorted.find(
        (r) => r.country?.toLowerCase() === cust.country?.toLowerCase(),
      ) || null
    );
  };

  const getSeaRate = (cust) => {
    if (!cust || !seaFreightRates.length) return null;
    const sorted = [...seaFreightRates].sort(
      (a, b) => new Date(b.date) - new Date(a.date),
    );
    if (cust.port_code) {
      const exact = sorted.filter(
        (r) =>
          r.country?.toLowerCase() === cust.country?.toLowerCase() &&
          r.port_code?.toUpperCase() === cust.port_code.toUpperCase(),
      );
      if (exact.length) return exact[0];
    }
    return (
      sorted.find(
        (r) => r.country?.toLowerCase() === cust.country?.toLowerCase(),
      ) || null
    );
  };

  // ── Currency helpers ───────────────────────────────────────
  const toUSD = (lkr) =>
    !currentUsdRate || !lkr
      ? "0.00"
      : (sf(lkr) / sf(currentUsdRate)).toFixed(2);
  const toLKR = (usd) =>
    !currentUsdRate || !usd
      ? "0.00"
      : (sf(usd) * sf(currentUsdRate)).toFixed(2);

  // ── CNF = FOB (USD) + freight (USD) ───────────────────────
  const calcCNF = useCallback((fobUSD, freightUSD) => {
    return (sf(fobUSD) + sf(freightUSD)).toFixed(2);
  }, []);

  // ── Air freight tiers ──────────────────────────────────────
  const calcAirTiers = (multiplier, divisor, airRateData) => {
    if (!airRateData || !multiplier || !divisor || sf(divisor) === 0)
      return {
        freight_cost_45kg: "0.00",
        freight_cost_100kg: "0.00",
        freight_cost_300kg: "0.00",
        freight_cost_500kg: "0.00",
      };
    const m = sf(multiplier),
      d = sf(divisor);
    return {
      freight_cost_45kg: ((m * sf(airRateData.rate_45kg)) / d).toFixed(2),
      freight_cost_100kg: ((m * sf(airRateData.rate_100kg)) / d).toFixed(2),
      freight_cost_300kg: ((m * sf(airRateData.rate_300kg)) / d).toFixed(2),
      freight_cost_500kg: ((m * sf(airRateData.rate_500kg)) / d).toFixed(2),
    };
  };

  // ── Core FOB recalculation (always uses live rate) ─────────
  // fob_price stored as USD: exfactory_lkr / rate + handling_usd
  const recalcFOB = (data) => {
    const rate = sf(currentUsdRate, 304);
    const exf = sf(data.exfactoryprice);
    const handlingUSD =
      sf(data.export_doc_usd) +
      sf(data.transport_cost_usd) +
      sf(data.loading_cost_usd) +
      sf(data.airway_cost_usd) +
      sf(data.forwardHandling_cost_usd);
    return exf / rate + handlingUSD;
  };

  const recalcAll = (data) => {
    const fobUSD = recalcFOB(data);
    data.fob_price_usd = fobUSD.toFixed(4);

    if (data.freight_type === "air") {
      const airRate = getAirRate(customer);
      if (airRate && data.multiplier && data.divisor) {
        const tiers = calcAirTiers(data.multiplier, data.divisor, airRate);
        Object.assign(data, tiers);
        data.cnf_45kg = calcCNF(fobUSD, tiers.freight_cost_45kg);
        data.cnf_100kg = calcCNF(fobUSD, tiers.freight_cost_100kg);
        data.cnf_300kg = calcCNF(fobUSD, tiers.freight_cost_300kg);
        data.cnf_500kg = calcCNF(fobUSD, tiers.freight_cost_500kg);
      }
    } else if (data.freight_type === "sea") {
      const seaRate = getSeaRate(customer);
      if (seaRate) {
        const fc20 = sf(seaRate.freight_per_kilo_20ft);
        const fc40 = sf(seaRate.freight_per_kilo_40ft);
        data.freight_cost_20ft = fc20.toFixed(4);
        data.freight_cost_40ft = fc40.toFixed(4);
        data.cnf_20ft = calcCNF(fobUSD, fc20);
        data.cnf_40ft = calcCNF(fobUSD, fc40);
      }
    }
    return data;
  };

  // ── Re-run FOB/CNF when USD rate loads ─────────────────────
  useEffect(() => {
    if (!currentUsdRate || !formData.exfactoryprice) return;
    setFormData((prev) => ({ ...recalcAll({ ...prev }) }));
  }, [currentUsdRate]); // eslint-disable-line

  // ── Product / variant selection ────────────────────────────
  const handleProductSelect = (e) => {
    const productId = e.target.value;
    if (!productId) {
      setSelectedProduct(null);
      setFormData({ ...initialFormData });
      return;
    }
    const product = products.find((p) => p.id === Number(productId));
    setSelectedProduct(product);
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      variant_id: "",
      common_name: product?.common_name || "",
      category: product?.category || "",
      size_range: "",
      purchasing_price: "",
      exfactoryprice: "",
      image: product?.image_url || "",
      scientific_name: product?.scientific_name || "",
    }));
  };

  const handleVariantSelect = (e) => {
    const variantId = e.target.value;
    if (!variantId || !selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        variant_id: "",
        size_range: "",
        purchasing_price: "",
        exfactoryprice: "",
        fob_price_usd: "",
        multiplier: "",
        divisor: "",
        freight_cost_45kg: "",
        freight_cost_100kg: "",
        freight_cost_300kg: "",
        freight_cost_500kg: "",
        cnf_45kg: "",
        cnf_100kg: "",
        cnf_300kg: "",
        cnf_500kg: "",
        freight_cost_20ft: "",
        cnf_20ft: "",
        freight_cost_40ft: "",
        cnf_40ft: "",
      }));
      return;
    }
    const variant = selectedProduct.variants?.find(
      (v) => String(v.id) === String(variantId),
    );
    if (!variant) return;

    const rate = sf(currentUsdRate, 304);
    // Recalculate exfactoryprice with live rate
    const pp = sf(variant.purchasing_price);
    const labour = sf(variant.labour_overhead);
    const packing = sf(variant.packing_cost);
    const profit = sf(variant.profit_usd ?? variant.profit);
    const jcFob = sf(variant.jc_fob);

    let exf;
    if (jcFob > 0) {
      exf = (jcFob + profit + packing + labour) * rate;
    } else {
      exf = pp + (labour + packing + profit) * rate;
    }

    const updated = recalcAll({
      ...formData,
      variant_id: String(variantId),
      size_range: variant.size || "",
      purchasing_price: pp,
      exfactoryprice: parseFloat(exf.toFixed(2)),
      multiplier: variant.multiplier || "",
      divisor: variant.divisor || "1",
    });
    setFormData(updated);
  };

  // ── Field change handler ───────────────────────────────────
  const calculatePrices = (field, value) => {
    let data = { ...formData, [field]: value };

    // Sync LKR ↔ USD for cost fields
    const costMap = {
      export_doc: "export_doc",
      transport_cost: "transport_cost",
      loading_cost: "loading_cost",
      airway_cost: "airway_cost",
      forwardHandling_cost: "forwardHandling_cost",
    };
    Object.keys(costMap).forEach((k) => {
      if (field === `${k}_usd`) data[`${k}_lkr`] = toLKR(value);
      if (field === `${k}_lkr`) data[`${k}_usd`] = toUSD(value);
    });

    // Reset freight fields on type change
    if (field === "freight_type") {
      [
        "freight_cost_45kg",
        "freight_cost_100kg",
        "freight_cost_300kg",
        "freight_cost_500kg",
        "cnf_45kg",
        "cnf_100kg",
        "cnf_300kg",
        "cnf_500kg",
        "freight_cost_20ft",
        "cnf_20ft",
        "freight_cost_40ft",
        "cnf_40ft",
      ].forEach((k) => (data[k] = ""));
      if (value === "sea") {
        data.multiplier = "";
        data.divisor = "";
      }
    }

    setFormData(recalcAll(data));
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPrice
        ? `${API_URL}/api/exportcustomer-products/${editingPrice.id}`
        : `${API_URL}/api/exportcustomer-products`;
      const method = editingPrice ? "PUT" : "POST";
      const isAir = formData.freight_type === "air";
      const isSea = formData.freight_type === "sea";

      const payload = {
        cus_id: parseInt(cus_id),
        product_id: formData.product_id ? parseInt(formData.product_id) : null,
        variant_id: formData.variant_id ? parseInt(formData.variant_id) : null,
        common_name: formData.common_name,
        category: formData.category,
        size_range: formData.size_range,
        scientific_name: formData.scientific_name || null,
        image_url: formData.image || null,
        purchasing_price: sf(formData.purchasing_price),
        exfactoryprice: sf(formData.exfactoryprice),
        export_doc: sf(formData.export_doc_usd),
        transport_cost: sf(formData.transport_cost_usd),
        loading_cost: sf(formData.loading_cost_usd),
        airway_cost: sf(formData.airway_cost_usd),
        forwardHandling_cost: sf(formData.forwardHandling_cost_usd),
        freight_type: formData.freight_type,
        fob_price: sf(formData.fob_price_usd), // stored as USD
        multiplier: isAir ? sf(formData.multiplier) : 0,
        divisor: isAir ? sf(formData.divisor, 1) : 1,
        freight_cost_45kg: isAir ? sf(formData.freight_cost_45kg) : 0,
        freight_cost_100kg: isAir ? sf(formData.freight_cost_100kg) : 0,
        freight_cost_300kg: isAir ? sf(formData.freight_cost_300kg) : 0,
        freight_cost_500kg: isAir ? sf(formData.freight_cost_500kg) : 0,
        cnf_45kg: isAir ? sf(formData.cnf_45kg) : 0,
        cnf_100kg: isAir ? sf(formData.cnf_100kg) : 0,
        cnf_300kg: isAir ? sf(formData.cnf_300kg) : 0,
        cnf_500kg: isAir ? sf(formData.cnf_500kg) : 0,
        freight_cost_20ft: isSea ? sf(formData.freight_cost_20ft) : 0,
        cnf_20ft: isSea ? sf(formData.cnf_20ft) : 0,
        freight_cost_40ft: isSea ? sf(formData.freight_cost_40ft) : 0,
        cnf_40ft: isSea ? sf(formData.cnf_40ft) : 0,
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
      alert(editingPrice ? "Price updated!" : "Price added!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ── Edit ───────────────────────────────────────────────────
  const handleEdit = async (price) => {
    if (products.length === 0) await fetchProducts();
    const product = products.find((p) => p.id === price.product_id);
    let variantId = "";
    if (product?.variants?.length > 0 && price.size_range) {
      const m = product.variants.find((v) => `${v.size}` === price.size_range);
      if (m) variantId = String(m.id);
    }
    if (product) setSelectedProduct(product);
    setEditingPrice(price);
    setShowForm(true);

    // fob_price is stored as USD in new architecture
    const fobUSD = sf(price.fob_price);

    setFormData(
      recalcAll({
        product_id: String(price.product_id),
        variant_id: variantId,
        common_name: price.common_name,
        category: price.category,
        size_range: price.size_range,
        scientific_name: price.scientific_name || "",
        image:
          price.image_url ||
          products.find((pr) => pr.id === price.product_id)?.image_url ||
          "",
        purchasing_price: price.purchasing_price,
        exfactoryprice: price.exfactoryprice,
        export_doc_usd: price.export_doc || "",
        export_doc_lkr: toLKR(price.export_doc),
        transport_cost_usd: price.transport_cost || "",
        transport_cost_lkr: toLKR(price.transport_cost),
        loading_cost_usd: price.loading_cost || "",
        loading_cost_lkr: toLKR(price.loading_cost),
        airway_cost_usd: price.airway_cost || "",
        airway_cost_lkr: toLKR(price.airway_cost),
        forwardHandling_cost_usd: price.forwardHandling_cost || "",
        forwardHandling_cost_lkr: toLKR(price.forwardHandling_cost),
        freight_type: price.freight_type || "air",
        multiplier: price.multiplier || "",
        divisor: price.divisor || "",
        fob_price_usd: fobUSD.toFixed(4),
        freight_cost_45kg: price.freight_cost_45kg || "",
        freight_cost_100kg: price.freight_cost_100kg || "",
        freight_cost_300kg: price.freight_cost_300kg || "",
        freight_cost_500kg: price.freight_cost_500kg || "",
        cnf_45kg: price.cnf_45kg || "",
        cnf_100kg: price.cnf_100kg || "",
        cnf_300kg: price.cnf_300kg || "",
        cnf_500kg: price.cnf_500kg || "",
        freight_cost_20ft: price.freight_cost_20ft || "",
        cnf_20ft: price.cnf_20ft || "",
        freight_cost_40ft: price.freight_cost_40ft || "",
        cnf_40ft: price.cnf_40ft || "",
      }),
    );
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete custom price for "${name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/exportcustomer-products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      await fetchPrices();
      alert("Price deleted!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedProduct(null);
    setEditingPrice(null);
    setShowForm(false);
  };
  const formatCategory = (cat) =>
    cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "—";
  const getProductDisplayName = (p) =>
    `${p.common_name || "Unnamed"} - ${formatCategory(p.category)}`;

  // ── Freight info banners ───────────────────────────────────
  const getCurrentFreightInfo = () => {
    if (!customer) return null;
    const airRate = getAirRate(customer);
    const seaRate = getSeaRate(customer);
    if (!airRate && !seaRate)
      return (
        <div className="freight-banner freight-banner-none">
          <h4>⚠️ No Freight Rates Available</h4>
          <p>No freight rates found for {customer.country}.</p>
        </div>
      );
    return (
      <>
        {airRate && (
          <div className="freight-banner freight-banner-air">
            <h4>
              ✈️ Air Freight Rates — {customer.country}
              {airRate.airport_code && ` (${airRate.airport_code})`}
            </h4>
            {customer.airport_name && (
              <p className="freight-sub-label">{customer.airport_name}</p>
            )}
            <div className="freight-rates-grid">
              <div>
                <strong>+45kg:</strong> ${sf(airRate.rate_45kg).toFixed(2)}/kg
              </div>
              <div>
                <strong>+100kg:</strong> ${sf(airRate.rate_100kg).toFixed(2)}/kg
              </div>
              <div>
                <strong>+300kg:</strong> ${sf(airRate.rate_300kg).toFixed(2)}/kg
              </div>
              <div>
                <strong>+500kg:</strong> ${sf(airRate.rate_500kg).toFixed(2)}/kg
              </div>
            </div>
            <p className="freight-effective">
              Effective:{" "}
              {new Date(airRate.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
        {seaRate && (
          <div className="freight-banner freight-banner-sea">
            <h4>
              🚢 Sea Freight Rates — {customer.country}
              {seaRate.port_code && ` (${seaRate.port_code})`}
            </h4>
            {customer.port_name && (
              <p className="freight-sub-label">{customer.port_name}</p>
            )}
            <div className="freight-container-grid">
              <div className="freight-container-col">
                <b>20ft Container</b>
                <br />
                Rate: ${sf(seaRate.rate_20ft).toFixed(2)}
                <br />
                Capacity: {sf(seaRate.kilos_20ft).toLocaleString()} kg
                <br />
                Per kilo: ${sf(seaRate.freight_per_kilo_20ft).toFixed(4)}/kg
              </div>
              <div className="freight-container-col">
                <b>40ft Container</b>
                <br />
                Rate: ${sf(seaRate.rate_40ft).toFixed(2)}
                <br />
                Capacity: {sf(seaRate.kilos_40ft).toLocaleString()} kg
                <br />
                Per kilo: ${sf(seaRate.freight_per_kilo_40ft).toFixed(4)}/kg
              </div>
            </div>
            <p className="freight-effective">
              Effective:{" "}
              {new Date(seaRate.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </>
    );
  };

  const COST_FIELDS = [
    { key: "export_doc", label: "Export Documentation" },
    { key: "transport_cost", label: "Transport Cost" },
    { key: "loading_cost", label: "Loading Cost" },
    { key: "airway_cost", label: "Airway Bill Cost" },
    { key: "forwardHandling_cost", label: "Forward Handling Cost" },
  ];

  // ── PDF ────────────────────────────────────────────────────
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

      const doc = new jsPDF("l", "mm", "a4");
      const pageW = doc.internal.pageSize.getWidth(),
        pageH = doc.internal.pageSize.getHeight(),
        margin = 14;
      const NAVY = [13, 71, 161],
        NAVY_DARK = [8, 47, 114],
        NAVY_LIGHT = [224, 232, 247],
        WHITE = [255, 255, 255],
        DARK = [20, 20, 40],
        GREY = [180, 200, 230];

      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 40, "F");
      try {
        doc.addImage(logoSrc, "PNG", margin, 6, 36, 28);
      } catch {}
      doc.setTextColor(...WHITE);
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("Tropical Shellfish (Pvt) Ltd", margin + 42, 19);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(
        "Fresh & Frozen Seafood Exporters  |  Quality You Can Trust",
        margin + 42,
        26,
      );
      doc.setFillColor(...WHITE);
      doc.roundedRect(pageW - margin - 40, 9, 40, 11, 2, 2, "F");
      doc.setTextColor(...NAVY_DARK);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("EXPORT PRICE LIST", pageW - margin - 20, 16.5, {
        align: "center",
      });
      doc.setFillColor(...NAVY_LIGHT);
      doc.rect(0, 40, pageW, 16, "F");
      doc.setDrawColor(...GREY);
      doc.setLineWidth(0.3);
      doc.line(0, 40, pageW, 40);
      doc.line(0, 56, pageW, 56);

      const imageCache = {};
      const fetchImg = async (imagePath) => {
        if (!imagePath || imageCache[imagePath]) return;
        try {
          const url = imagePath.startsWith("http")
            ? imagePath
            : `${API_URL}${imagePath}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const blob = await res.blob();
          imageCache[imagePath] = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {}
      };
      await Promise.all(
        [
          ...new Set(
            [
              ...prices.map((p) => p.image_url),
              ...products.map((p) => p.image_url),
            ].filter(Boolean),
          ),
        ].map(fetchImg),
      );

      const drawPlaceholder = (x, y, w, h) => {
        doc.setFillColor(232, 238, 252);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        doc.setFontSize(5);
        doc.setTextColor(25, 100, 200);
        doc.text("No Image", x + w / 2, y + h / 2 + h * 0.28, {
          align: "center",
        });
      };

      const renderTable = (items, startY, headDark, headLabel, extraCols) => {
        const productMap = {};
        items.forEach((p) => {
          const key = `${p.common_name}__${p.scientific_name || ""}`;
          if (!productMap[key]) {
            const pd = products.find((pr) => pr.id === p.product_id);
            productMap[key] = {
              common_name: String(p.common_name || "—"),
              scientific_name: p.scientific_name?.trim() || "—",
              image: p.image_url || pd?.image_url || null,
              variants: [],
            };
          }
          productMap[key].variants.push({ size: p.size_range || "—", p });
        });
        Object.values(productMap).forEach((prod) => {
          prod.variants.sort((a, b) => {
            const n = (s) => {
              const m = s.match(/\d+/g);
              return m ? parseInt(m[0]) : Infinity;
            };
            return n(a.size) - n(b.size) || a.size.localeCompare(b.size);
          });
        });
        const sortedProducts = Object.values(productMap).sort((a, b) =>
          a.common_name.localeCompare(b.common_name),
        );
        const tableBody = [];
        const firstRowSet = new Set();
        sortedProducts.forEach((prod) => {
          prod.variants.forEach((v, vi) => {
            const ri = tableBody.length;
            if (vi === 0) firstRowSet.add(ri);
            tableBody.push({ prod, v, vi });
          });
        });
        const bodyRows = tableBody.map(({ prod, v, vi }) => {
          const p = v.p;
          return [
            "",
            vi === 0 ? prod.common_name : "",
            vi === 0 ? prod.scientific_name : "",
            v.size,
            ...extraCols(p),
          ];
        });
        autoTable(doc, {
          startY,
          margin: { left: margin, right: margin },
          head: [
            [
              { content: "Picture", styles: { halign: "center" } },
              { content: "Common Name", styles: { halign: "left" } },
              { content: "Scientific Name", styles: { halign: "left" } },
              { content: "Size", styles: { halign: "left" } },
              ...headLabel,
            ],
          ],
          body: bodyRows,
          theme: "grid",
          columnStyles: {
            0: { cellWidth: 22, halign: "center", valign: "middle" },
            1: {
              cellWidth: 60,
              halign: "left",
              valign: "middle",
              fontStyle: "bold",
              fontSize: 10,
            },
            2: {
              cellWidth: 46,
              halign: "left",
              valign: "middle",
              fontStyle: "italic",
              fontSize: 9,
              textColor: [50, 80, 150],
            },
            3: {
              cellWidth: 46,
              halign: "left",
              valign: "middle",
              fontSize: 10,
            },
            4: { halign: "right", valign: "middle", fontSize: 10 },
            5: { halign: "right", valign: "middle", fontSize: 10 },
            6: { halign: "right", valign: "middle", fontSize: 10 },
            7: { halign: "right", valign: "middle", fontSize: 10 },
            8: { halign: "right", valign: "middle", fontSize: 10 },
          },
          headStyles: {
            fillColor: headDark,
            textColor: WHITE,
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
          },
          bodyStyles: {
            fontSize: 9,
            cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
            minCellHeight: 20,
            textColor: DARK,
            lineColor: GREY,
            lineWidth: 0.3,
          },
          willDrawCell: (data) => {
            if (data.section !== "body") return;
            if (!firstRowSet.has(data.row.index) && data.column.index <= 2)
              data.cell.styles.lineWidth = {
                top: 0,
                bottom: 0.3,
                left: 0.3,
                right: 0.3,
              };
          },
          didDrawCell: (data) => {
            if (data.section !== "body" || data.column.index !== 0) return;
            if (!firstRowSet.has(data.row.index)) return;
            const imgW = 16,
              imgH = 16,
              x = data.cell.x + (data.cell.width - imgW) / 2,
              y = data.cell.y + (data.cell.height - imgH) / 2;
            const prod = tableBody[data.row.index]?.prod;
            const imgSrc = prod?.image ? imageCache[prod.image] : null;
            if (imgSrc) {
              const fmt = imgSrc.includes("image/png") ? "PNG" : "JPEG";
              try {
                doc.addImage(imgSrc, fmt, x, y, imgW, imgH, undefined, "FAST");
              } catch {
                drawPlaceholder(x, y, imgW, imgH);
              }
            } else drawPlaceholder(x, y, imgW, imgH);
          },
        });
        return doc.lastAutoTable.finalY;
      };

      const airProducts = prices.filter((p) => p.freight_type === "air");
      const seaProducts = prices.filter((p) => p.freight_type === "sea");
      let startY = 62;

      if (airProducts.length > 0) {
        doc.setFillColor(...NAVY);
        doc.rect(margin, startY, pageW - margin * 2, 8, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text("AIR FREIGHT PRODUCTS", margin + 4, startY + 5.5);
        startY += 10;
        startY =
          renderTable(
            airProducts,
            startY,
            NAVY_DARK,
            [
              { content: "CNF +45kg", styles: { halign: "right" } },
              { content: "CNF +100kg", styles: { halign: "right" } },
              { content: "CNF +300kg", styles: { halign: "right" } },
              { content: "CNF +500kg", styles: { halign: "right" } },
            ],
            (p) => {
              const fobLive = calcLiveFob(p, currentUsdRate);
              return [
                `$${calcLiveCNF(fobLive, p.freight_cost_45kg).toFixed(2)}`,
                `$${calcLiveCNF(fobLive, p.freight_cost_100kg).toFixed(2)}`,
                `$${calcLiveCNF(fobLive, p.freight_cost_300kg).toFixed(2)}`,
                `$${calcLiveCNF(fobLive, p.freight_cost_500kg).toFixed(2)}`,
              ];
            },
          ) + 12;
      }

      if (seaProducts.length > 0) {
        if (startY > pageH - 40) {
          doc.addPage();
          startY = 20;
        }
        doc.setFillColor(...NAVY);
        doc.rect(margin, startY, pageW - margin * 2, 8, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(9);
        doc.setFont(undefined, "bold");
        doc.text("SEA FREIGHT PRODUCTS", margin + 4, startY + 5.5);
        startY += 10;
        renderTable(
          seaProducts,
          startY,
          NAVY_DARK,
          [
            { content: "CNF 20ft (USD)", styles: { halign: "right" } },
            { content: "CNF 40ft (USD)", styles: { halign: "right" } },
          ],
          (p) => {
            const fobLive = calcLiveFob(p, currentUsdRate);
            return [
              `$${calcLiveCNF(fobLive, p.freight_cost_20ft).toFixed(2)}`,
              `$${calcLiveCNF(fobLive, p.freight_cost_40ft).toFixed(2)}`,
            ];
          },
        );
      }

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...NAVY);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(7);
        doc.setFont(undefined, "normal");
        doc.text(
          "Tropical Shellfish (Pvt) Ltd  |  All prices in USD unless stated  |  Prices subject to change without prior notice",
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
        `${safeName}_Export_Price_List_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error(err);
      alert("Error generating PDF.");
    }
  };

  // ══ RENDER ════════════════════════════════════════════════
  return (
    <div className="pricelist-container">
      <div className="detail-back-row">
        <button
          onClick={() => navigate("/exportcustomerlist")}
          className="cancel-btn"
        >
          ← Back
        </button>
      </div>
      <h2>Custom Prices — {customer?.cus_name}</h2>
      <h2>
        {customer?.country}
        {customer?.airport_code && ` — ${customer.airport_code}`}
        {customer?.airport_name && (
          <span className="usd-rate-hint">({customer.airport_name})</span>
        )}
      </h2>
      <br />
      {getCurrentFreightInfo()}
      <br />
      {currentUsdRate && (
        <div className="usd-rate-banner">
          <h4>💱 USD Exchange Rate: Rs. {sf(currentUsdRate).toFixed(2)}</h4>
        </div>
      )}
      <br />

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
                      : `${API_URL}${formData.image.startsWith("/") ? "" : " /"}${formData.image}`
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
                    {v.size}
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
              placeholder="Auto-filled from selected size"
            />

            <label className="apf-label">Ex-Factory Price (LKR)</label>
            <input
              className="apf-input"
              type="number"
              step="0.01"
              value={formData.exfactoryprice}
              onChange={(e) =>
                calculatePrices("exfactoryprice", e.target.value)
              }
              required
              readOnly={
                editingPrice || (!editingPrice && formData.variant_id !== "")
              }
              placeholder="Auto-filled from selected size"
            />
            {editingPrice && (
              <p className="apf-note">
                Ex-Factory price cannot be changed when editing
              </p>
            )}

            <label className="apf-label">
              Ex-Factory Price (USD)
              {currentUsdRate && (
                <span className="usd-rate-hint">
                  Rate: Rs.{sf(currentUsdRate).toFixed(2)}
                </span>
              )}
            </label>
            <input
              className="apf-input is-usd"
              type="number"
              step="0.01"
              value={
                formData.exfactoryprice && currentUsdRate
                  ? toUSD(formData.exfactoryprice)
                  : "0.00"
              }
              disabled
              placeholder="0.00"
            />

            <div className="additional-costs-panel">
              <div className="panel-header">
                <h3>Additional Costs</h3>
                {currentUsdRate && (
                  <span>
                    1 USD = Rs.{sf(currentUsdRate).toFixed(2)} — enter in either
                    currency
                  </span>
                )}
              </div>
              {COST_FIELDS.map(({ key, label }) => (
                <div className="cost-block" key={key}>
                  <div className="cost-block-title">{label}</div>
                  <div className="cost-currency-grid">
                    <div>
                      <div className="cost-currency-label">USD ($)</div>
                      <input
                        className="apf-input"
                        type="number"
                        step="0.01"
                        value={formData[`${key}_usd`]}
                        onChange={(e) =>
                          calculatePrices(`${key}_usd`, e.target.value)
                        }
                        placeholder="0.00"
                        onWheel={(e) => e.target.blur()}
                      />
                    </div>
                    <div>
                      <div className="cost-currency-label">LKR (Rs.)</div>
                      <input
                        className="apf-input"
                        type="number"
                        step="0.01"
                        value={formData[`${key}_lkr`]}
                        onChange={(e) =>
                          calculatePrices(`${key}_lkr`, e.target.value)
                        }
                        placeholder="0.00"
                        onWheel={(e) => e.target.blur()}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <label className="apf-label">
              FOB Price (USD)
              {currentUsdRate && (
                <span className="usd-rate-hint">
                  Rate: Rs.{sf(currentUsdRate).toFixed(2)}
                </span>
              )}
            </label>
            <input
              className="apf-input is-usd"
              type="number"
              step="0.0001"
              value={formData.fob_price_usd || "0.00"}
              disabled
              placeholder="0.00"
            />

            <div className="freight-section-panel">
              <div className="panel-header">
                <h3>Freight Calculation</h3>
                <span>
                  {formData.freight_type === "air"
                    ? "All weight tiers calculated automatically"
                    : "Both container sizes calculated automatically"}
                </span>
              </div>
              <div className="freight-type-selector">
                <div className="freight-type-label">Freight Type</div>
                <div className="radio-row">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="freight_type"
                      value="air"
                      checked={formData.freight_type === "air"}
                      onChange={(e) =>
                        calculatePrices("freight_type", e.target.value)
                      }
                    />
                    ✈️ Air Freight (All Tiers)
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="freight_type"
                      value="sea"
                      checked={formData.freight_type === "sea"}
                      onChange={(e) =>
                        calculatePrices("freight_type", e.target.value)
                      }
                    />
                    🚢 Sea Freight (20ft &amp; 40ft)
                  </label>
                </div>
              </div>

              {formData.freight_type === "air" && (
                <>
                  <div className="two-col-grid">
                    <div>
                      <label className="apf-label">
                        Gross Weight (kg) — Multiplier
                      </label>
                      <input
                        className="apf-input"
                        type="number"
                        step="0.01"
                        value={formData.multiplier}
                        onChange={(e) =>
                          calculatePrices("multiplier", e.target.value)
                        }
                        placeholder="e.g. 150"
                        onWheel={(e) => e.target.blur()}
                      />
                    </div>
                    <div>
                      <label className="apf-label">Divisor</label>
                      <input
                        className="apf-input"
                        type="number"
                        step="0.01"
                        value={formData.divisor}
                        onChange={(e) =>
                          calculatePrices("divisor", e.target.value)
                        }
                        placeholder="e.g. 1"
                        onWheel={(e) => e.target.blur()}
                      />
                    </div>
                  </div>
                  <div className="freight-tiers-panel">
                    <h4>Calculated Freight &amp; CNF — All Tiers</h4>
                    <div className="freight-tiers-grid">
                      {[
                        ["45kg", "freight_cost_45kg", "cnf_45kg"],
                        ["100kg", "freight_cost_100kg", "cnf_100kg"],
                        ["300kg", "freight_cost_300kg", "cnf_300kg"],
                        ["500kg", "freight_cost_500kg", "cnf_500kg"],
                      ].map(([tier, fk, ck]) => (
                        <div className="freight-tier-card" key={tier}>
                          <div className="tier-label">+{tier} Tier</div>
                          <div className="tier-freight">
                            Freight: <strong>${formData[fk] || "0.00"}</strong>
                          </div>
                          <div className="tier-cnf">
                            CNF: <strong>${formData[ck] || "0.00"}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {formData.freight_type === "sea" && (
                <div className="freight-tiers-panel">
                  <h4>Calculated Freight &amp; CNF — Sea Containers</h4>
                  <div className="freight-tiers-grid">
                    {[
                      ["20ft", "freight_cost_20ft", "cnf_20ft"],
                      ["40ft", "freight_cost_40ft", "cnf_40ft"],
                    ].map(([container, fk, ck]) => (
                      <div className="freight-tier-card" key={container}>
                        <div className="tier-label">{container} Container</div>
                        <div className="tier-freight">
                          Freight:{" "}
                          <strong>${formData[fk] || "0.0000"}/kg</strong>
                        </div>
                        <div className="tier-cnf">
                          CNF: <strong>${formData[ck] || "0.00"}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
                <th>Product Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Purchasing Price</th>
                <th>Ex-Factory Price</th>
                <th>FOB (USD)</th>
                <th>Freight</th>
                <th>CNF Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prices.length === 0 && (
                <tr>
                  <td colSpan={9} className="muted">
                    No custom prices set
                  </td>
                </tr>
              )}
              {prices.map((price) => (
                <tr key={price.id}>
                  <td data-label="Product Name">{price.common_name}</td>
                  <td data-label="Category">
                    {formatCategory(price.category)}
                  </td>
                  <td data-label="Size">{price.size_range || "—"}</td>
                  <td data-label="Purchasing Price">
                    <span className="td-price">
                      Rs.{sf(price.purchasing_price).toFixed(2)}
                    </span>
                  </td>
                  <td data-label="Ex-Factory Price">
                    <span className="td-price">
                      Rs.{sf(price.exfactoryprice).toFixed(2)}
                    </span>
                    {currentUsdRate && (
                      <span className="td-usd">
                        ${toUSD(price.exfactoryprice)}
                      </span>
                    )}
                  </td>
                  <td data-label="FOB (USD)">
                    <strong>
                      ${calcLiveFob(price, currentUsdRate).toFixed(2)}
                    </strong>
                  </td>
                  <td data-label="Freight">
                    {price.freight_type === "sea" ? "🚢 Sea" : "✈️ Air"}
                  </td>
                  <td data-label="CNF Details">
                    {(() => {
                      const fobLive = calcLiveFob(price, currentUsdRate);
                      return price.freight_type === "air" ? (
                        <div className="td-cnf-air">
                          <div>
                            +45kg{" "}
                            <strong>
                              $
                              {calcLiveCNF(
                                fobLive,
                                price.freight_cost_45kg,
                              ).toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            +100kg{" "}
                            <strong>
                              $
                              {calcLiveCNF(
                                fobLive,
                                price.freight_cost_100kg,
                              ).toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            +300kg{" "}
                            <strong>
                              $
                              {calcLiveCNF(
                                fobLive,
                                price.freight_cost_300kg,
                              ).toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            +500kg{" "}
                            <strong>
                              $
                              {calcLiveCNF(
                                fobLive,
                                price.freight_cost_500kg,
                              ).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="td-cnf-air">
                          <div>
                            20ft{" "}
                            <strong>
                              $
                              {calcLiveCNF(
                                fobLive,
                                price.freight_cost_20ft,
                              ).toFixed(2)}
                            </strong>
                          </div>
                          <div>
                            40ft{" "}
                            <strong>
                              $
                              {calcLiveCNF(
                                fobLive,
                                price.freight_cost_40ft,
                              ).toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      );
                    })()}
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

export default ExportCustomerDetail;
