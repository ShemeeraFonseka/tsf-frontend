import React, { useEffect, useState } from "react";
import "./Productlist.css";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSrc from "./logo.png";
import { isAdmin } from "../../hooks/useAuth";

const sf = (v, d = 0) => (isFinite(parseFloat(v)) ? parseFloat(v) : d);

/* ── Badge helpers ─────────────────────────────────────────────── */
const getCategoryBadgeClass = (c) => {
  if (!c) return "badge-default-cat";
  const v = c.toLowerCase();
  if (v === "live") return "badge-live";
  if (v === "fresh") return "badge-fresh";
  if (v === "frozen") return "badge-frozen";
  return "badge-default-cat";
};
const getCategoryBadgeIcon = (c) => {
  if (!c) return "";
  const v = c.toLowerCase();
  if (v === "live") return "🟢";
  if (v === "fresh") return "💧";
  if (v === "frozen") return "❄️";
  return "";
};
const getSpeciesBadgeClass = (s) => {
  if (!s) return "badge-default";
  const v = s.toLowerCase();
  if (v === "fish") return "badge-fish";
  if (v === "crustacean") return "badge-crustacean";
  return "badge-default";
};
const getSpeciesBadgeIcon = (s) => {
  if (!s) return "🌊";
  const v = s.toLowerCase();
  if (v === "fish") return "🐟";
  if (v === "crustacean") return "🦞";
  return "🌊";
};
const fmt = (v) => (!v ? "-" : v.charAt(0).toUpperCase() + v.slice(1));

const sectionCategories = [
  // ── Shellfish ──
  { name: "Oyster", keywords: ["oyster", "depurated oyster"] },
  {
    name: "Clams",
    keywords: [
      "clam",
      "clams",
      "pen clam",
      "short neck clam",
      "blood clam",
      "sea clam",
      "mangrove clam",
      "nylon shell",
      "scallop",
      "razor clam",
      "aballone",
    ],
  },
  {
    name: "Mussel",
    keywords: ["mussel", "brown mussel", "green mussel", "half shell"],
  },
  // ── Crustacean ──
  {
    name: "Crab",
    keywords: [
      "mud crab",
      "sea crab",
      "cut crab",
      "blue swimming crab",
      "lagoon crab",
    ],
  },
  {
    name: "Prawn",
    keywords: [
      "white prawn",
      "black tiger",
      "flowery prawn",
      "sea prawns",
      "prawn",
      "shrimp",
      "vannamei",
      "pacific white",
    ],
  },
  { name: "Lobster", keywords: ["lobster"] },
  { name: "Scampi", keywords: ["scampi"] },
  // ── Cephalopoda ──
  {
    name: "Cuttlefish & Squid",
    keywords: ["cuttlefish", "squid", "cuttlefish broken rings"],
  },
  { name: "Octopus", keywords: ["octopus", "baby octopus"] },
  // ── Fish ──
  {
    name: "Marine Fish",
    keywords: [
      "yellow fin tuna",
      "seer fish",
      "barramundi",
      "scad",
      "trevally",
      "indian mackerel",
      "tenched sardine",
      "anchovy",
      "jack trevally",
      "red mullet",
      "grey mullet",
      "tiger grouper",
      "red grouper",
      "red snapper",
      "mahi mahi",
      "salmon",
      "parrot fish",
      "tuna",
      "king fish",
      "sword fish",
      "barracuda",
      "bonito",
      "cobia",
      "thread fin",
      "sea bass",
      "rabbit fish",
      "sole fish",
      "emperor",
      "grouper",
      "pomfret",
      "marlin",
      "pinjalo",
      "job fish",
    ],
  },
  {
    name: "Fresh Water",
    keywords: ["eel", "catla", "rohu", "tilapia", "freshwater", "river"],
  },
  // ── Processed ──
  {
    name: "Processed Products",
    keywords: [
      "processed",
      "claw meat",
      "seafood mix",
      "half shell",
      "oyster can",
      "crab meat",
      "lump meat",
      "jambo",
      "glazing",
    ],
  },
];

const speciesTypes = [
  { value: "all", label: "All Products", icon: "🌊" },
  { value: "crustacean", label: "Crustacean", icon: "🦞" },
  { value: "fish", label: "Fish", icon: "🐟" },
];

const PRODUCT_ORDER = [
  // Oyster
  "depurated oyster",
  // Clams
  "short neck clam",
  "sea clam",
  "pen clam",
  "blood clam",
  "mangrove clam",
  "nylon shell",
  "scallop",
  "razor clam",
  "aballone",
  // Mussel
  "green mussel",
  "half shell green mussel",
  "half shell brown mussel",
  "brown mussel",
  // Crab
  "mud crab",
  "sea crab fresh",
  "sea crab frozen",
  "sea crab",
  "cut crab",
  // Prawn
  "white prawn",
  "black tiger frozen",
  "black tiger",
  "flowery prawn",
  "sea prawns",
  "vannamei",
  "pacific white",
  // Lobster
  "lobster",
  // Scampi
  "scampi headless",
  "scampi claw",
  "scampi",
  // Cuttlefish & Squid
  "cuttlefish fresh whole",
  "cuttlefish whole cleaned",
  "cuttlefish fresh corn",
  "cuttlefish cleaned corn",
  "squid fresh cleaned",
  "cuttlefish broken rings",
  "squid",
  // Octopus
  "baby octopus frozen",
  "baby octopus",
  "octopus frozen",
  "octopus",
  // Marine Fish
  "yellow fin tuna",
  "seer fish",
  "barramundi",
  "scad",
  "trevally",
  "indian mackerel",
  "tenched sardine",
  "anchovy",
  "jack trevally",
  "red mullet",
  "grey mullet",
  "tiger grouper",
  "red grouper",
  "red snapper",
  "mahi mahi",
  "salmon fish",
  "salmon fillet",
  "salmon tail",
  "salmon ground",
  "salmon",
  "parrot fish",
  "tuna shashimi loins",
  "tuna loin grade a",
  "tuna loin grade b",
  "tuna shashimi cut",
  "tuna off cut",
  "tuna trimming",
  "tuna belly",
  "tuna",
  // Fresh Water
  "eel",
  "catla",
  "rohu",
  "tilapia",
  // Processed
  "sea crab meat",
  "mud crab body",
  "mud crab claw meat",
  "mud crab lump",
  "mud crab jambo",
  "oyster meat",
  "oyster can",
  "seafood mix",
  "green mussel half shell",
  "claw meat",
  "clean prawns",
  "half shell mussel",
  "pen clam meat",
];

const getSortIndex = (name) => {
  const lower = (name || "").toLowerCase();
  const idx = PRODUCT_ORDER.findIndex((k) => lower.includes(k));
  return idx === -1 ? 9999 : idx;
};

// ── Calc helpers for pricing modal ───────────────────────────────
function calcFromProfit(pp, profit) {
  const sp = pp + profit;
  const pmp = sp > 0 ? (profit / sp) * 100 : 0;
  return {
    profit,
    selling_price: parseFloat(sp.toFixed(2)),
    profit_margin_percentage: parseFloat(pmp.toFixed(2)),
  };
}
function calcFromSelling(pp, sp) {
  const profit = sp - pp;
  const pmp = sp > 0 ? (profit / sp) * 100 : 0;
  return {
    profit: parseFloat(profit.toFixed(2)),
    selling_price: sp,
    profit_margin_percentage: parseFloat(pmp.toFixed(2)),
  };
}
function calcFromMarginPct(pp, pmp) {
  const profit = pmp < 100 ? (pmp / (100 - pmp)) * pp : 0;
  const sp = pp + profit;
  return {
    profit: parseFloat(profit.toFixed(2)),
    selling_price: parseFloat(sp.toFixed(2)),
    profit_margin_percentage: pmp,
  };
}

/* ══════════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════════ */
const Productlist = () => {
  const adminUser = isAdmin();
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState("all");

  /* ── "Add from Catalogue" modal state ─────────────────────────── */
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const [catalogue, setCatalogue] = useState([]); // all master products
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [selectedCatProduct, setSelectedCatProduct] = useState(null); // product chosen from catalogue
  const [pricingRows, setPricingRows] = useState([]); // variant pricing being set
  const [savingPricing, setSavingPricing] = useState(false);
  const [selectedPricingCategories, setSelectedPricingCategories] = useState([
    "fresh",
  ]);

  /* ── "Add to Customer" bulk modal state (unchanged) ───────────── */
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [bulkCustomerId, setBulkCustomerId] = useState("");
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  /* ── Fetch local product list ─────────────────────────────────── */
  const fetchProducts = () => {
    setLoading(true);
    fetch(`${API_URL}/api/local-product-prices/full-list`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setItems(data);
        setFilteredItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (selectedSpeciesType === "all") setFilteredItems(items);
    else
      setFilteredItems(
        items.filter(
          (p) => p.species_type?.toLowerCase() === selectedSpeciesType,
        ),
      );
  }, [selectedSpeciesType, items]);

  /* ── Catalogue modal ─────────────────────────────────────────── */
  const openCatalogueModal = async () => {
    setShowCatalogueModal(true);
    setSelectedCatProduct(null);
    setPricingRows([]);
    setCatalogueSearch("");
    setCatalogueLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/productlist`);
      const data = await res.json();
      setCatalogue(data);
    } catch {
      setCatalogue([]);
    } finally {
      setCatalogueLoading(false);
    }
  };

  const selectCatalogueProduct = (product) => {
    setSelectedCatProduct(product);
    // Pre-fill pricing rows — if product already in local list, use existing prices
    const existing = items.find((p) => p.id === product.id);
    // Pre-fill categories from existing or product default
    const existingCats = existing
      ? existing.categories || (existing.category ? [existing.category] : [])
      : product.categories ||
        (product.category ? [product.category] : ["fresh"]);
    setSelectedPricingCategories(existingCats);

    const rows = (product.variants || []).map((v) => {
      const ex = existing?.variants?.find(
        (ev) => String(ev.id) === String(v.id),
      );
      const pp = sf(v.purchasing_price);
      return {
        variant_id: v.id,
        size: v.size,
        unit: v.unit,
        purchasing_price: pp,
        profit: ex ? sf(ex.profit) : 0,
        selling_price: ex ? sf(ex.selling_price) : pp,
        profit_margin_percentage: ex ? sf(ex.profit_margin_percentage) : 0,
        local_price_id: ex?.local_price_id || null,
      };
    });
    setPricingRows(rows);
  };

  const updatePricingRow = (idx, field, val) => {
    setPricingRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const pp = sf(row.purchasing_price);
        const v = sf(val);
        if (field === "profit")
          return { ...row, ...calcFromProfit(pp, v), profit: v };
        if (field === "selling_price")
          return { ...row, ...calcFromSelling(pp, v), selling_price: v };
        if (field === "profit_margin_percentage")
          return {
            ...row,
            ...calcFromMarginPct(pp, v),
            profit_margin_percentage: v,
          };
        return { ...row, [field]: val };
      }),
    );
  };

  // Apply same profit to all rows at once
  const applyProfitToAll = (profit) => {
    setPricingRows((prev) =>
      prev.map((row) => ({
        ...row,
        ...calcFromProfit(sf(row.purchasing_price), sf(profit)),
      })),
    );
  };

  const savePricing = async () => {
    if (!selectedCatProduct) return;
    setSavingPricing(true);
    try {
      const res = await fetch(`${API_URL}/api/local-product-prices/bulk`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedCatProduct.id,
          categories: selectedPricingCategories,
          variants: pricingRows.map((r) => ({
            variant_id: r.variant_id,
            profit: sf(r.profit),
            selling_price: sf(r.selling_price),
            profit_margin_percentage: sf(r.profit_margin_percentage),
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert(`✅ Pricing saved for ${selectedCatProduct.common_name}`);
      setShowCatalogueModal(false);
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingPricing(false);
    }
  };

  /* ── Remove from local list ───────────────────────────────────── */
  const handleRemoveFromLocal = async (productId, productName) => {
    if (
      !window.confirm(
        `Remove "${productName}" from the local list? This will delete its local pricing only — the product stays in the master catalogue.`,
      )
    )
      return;
    try {
      // Delete all local_product_prices rows for this product
      const res = await fetch(
        `${API_URL}/api/local-product-prices/product/${productId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to remove");
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ── Bulk-add to customer (unchanged) ───────────────────────────── */
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customerlist`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBulkMode = () => {
    setBulkMode((p) => !p);
    setSelectedProductIds(new Set());
  };
  const toggleProductSelection = (id) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openBulkModal = async () => {
    if (selectedProductIds.size === 0) {
      alert("Please select at least one product.");
      return;
    }
    await fetchCustomers();
    const rows = [];
    filteredItems.forEach((product) => {
      if (!selectedProductIds.has(product.id)) return;
      (product.variants || []).forEach((v) => {
        rows.push({
          key: `${product.id}-${v.id}`,
          product_id: product.id,
          variant_id: v.id,
          common_name: product.common_name,
          scientific_name: product.scientific_name || "",
          category: product.category,
          image_url: product.image_url || "",
          size_range: v.size || "",
          purchasing_price: sf(v.purchasing_price),
          margin: sf(v.profit),
          margin_percentage: sf(v.profit_margin_percentage),
          selling_price: sf(v.selling_price),
        });
      });
    });
    setBulkItems(rows);
    setBulkCustomerId("");
    setShowBulkModal(true);
  };

  const updateBulkItem = (key, field, value) => {
    setBulkItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };
        const pp = sf(updated.purchasing_price);
        if (field === "margin") {
          const sp = pp + sf(value);
          updated.selling_price = parseFloat(sp.toFixed(2));
          updated.margin_percentage =
            sp > 0 ? parseFloat(((sf(value) / sp) * 100).toFixed(2)) : 0;
        } else if (field === "margin_percentage") {
          const m = (pp * sf(value)) / (100 - sf(value));
          updated.margin = parseFloat(m.toFixed(2));
          updated.selling_price = parseFloat((pp + m).toFixed(2));
        } else if (field === "selling_price") {
          const m = sf(value) - pp;
          updated.margin = parseFloat(m.toFixed(2));
          updated.margin_percentage =
            sf(value) > 0 ? parseFloat(((m / sf(value)) * 100).toFixed(2)) : 0;
        }
        return updated;
      }),
    );
  };

  const handleBulkSubmit = async () => {
    if (!bulkCustomerId) {
      alert("Please select a customer.");
      return;
    }
    setBulkSubmitting(true);
    let success = 0,
      skip = 0,
      fail = 0;
    try {
      const existingRes = await fetch(
        `${API_URL}/api/customer-products/${bulkCustomerId}`,
      );
      const existingData = existingRes.ok ? await existingRes.json() : [];
      const existingKeys = new Set(
        existingData.map((e) => `${e.product_id}-${e.variant_id ?? "null"}`),
      );

      for (const item of bulkItems) {
        const dupKey = `${item.product_id}-${item.variant_id ?? "null"}`;
        if (existingKeys.has(dupKey)) {
          skip++;
          continue;
        }
        const res = await fetch(`${API_URL}/api/customer-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cus_id: parseInt(bulkCustomerId),
            product_id: item.product_id,
            variant_id: item.variant_id ?? null,
            common_name: item.common_name,
            scientific_name: item.scientific_name || null,
            category: item.category,
            image_url: item.image_url || null,
            size_range: item.size_range,
            purchasing_price: item.purchasing_price,
            margin: item.margin,
            margin_percentage: item.margin_percentage,
            selling_price: item.selling_price,
          }),
        });
        res.ok ? success++ : fail++;
      }
      let msg = `✅ Added ${success} item(s).`;
      if (skip) msg += `\n⚠️ ${skip} skipped (already exist).`;
      if (fail) msg += `\n❌ ${fail} failed.`;
      alert(msg);
      setShowBulkModal(false);
      setBulkMode(false);
      setSelectedProductIds(new Set());
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  /* ── Grouping ─────────────────────────────────────────────────── */
  const getSection = (product) => {
    const name = product.common_name?.toLowerCase() || "";
    for (const s of sectionCategories) {
      if (s.keywords.some((k) => name.includes(k))) return s.name;
    }
    return "Other";
  };

  const groupedBySection = (() => {
    const grouped = {};
    sectionCategories.forEach((s) => {
      grouped[s.name] = {};
    });
    grouped["Other"] = {};
    filteredItems.forEach((product) => {
      const section = getSection(product);
      const key = `${product.common_name}||${product.category || ""}`;
      if (!grouped[section][key]) grouped[section][key] = [];
      grouped[section][key].push(product);
    });
    return grouped;
  })();

  const sectionHasProducts = (section) =>
    Object.keys(groupedBySection[section] || {}).length > 0;
  const getTotalRows = (products) =>
    products.reduce(
      (sum, p) => sum + Math.max((p.variants || []).length, 1),
      0,
    );

  const getImageUrl = (url) => {
    if (!url) return "/images/placeholder-seafood.png";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  const getSpeciesCount = (val) =>
    val === "all"
      ? items.length
      : items.filter((p) => p.species_type?.toLowerCase() === val).length;

  /* ── Catalogue filter ─────────────────────────────────────────── */
  const filteredCatalogue = catalogue.filter((p) => {
    if (!catalogueSearch) return true;
    const q = catalogueSearch.toLowerCase();
    return (
      p.common_name?.toLowerCase().includes(q) ||
      p.scientific_name?.toLowerCase().includes(q)
    );
  });

  /* ── PDF functions (kept from original, now reads selling_price from variant) ── */
  const handleDownloadPDF = async () => {
    if (filteredItems.length === 0) {
      alert("No products to download");
      return;
    }
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth(),
        pageH = doc.internal.pageSize.getHeight(),
        margin = 12;
      const NAVY = [13, 71, 161],
        NAVY_DARK = [8, 47, 114],
        NAVY_LIGHT = [224, 232, 247],
        WHITE = [255, 255, 255],
        DARK = [20, 20, 40],
        GREY = [180, 200, 230];

      // Header
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 28, "F");
      try {
        doc.addImage(logoSrc, "PNG", margin, 4, 22, 20);
      } catch {}
      doc.setTextColor(...WHITE);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Tropical Shellfish (Pvt) Ltd", margin + 26, 13);
      doc.setFontSize(7);
      doc.setFont(undefined, "normal");
      doc.text(
        "Fresh & Frozen Seafood Exporters  |  Quality You Can Trust",
        margin + 26,
        19,
      );

      // Sub-header
      doc.setFillColor(...NAVY_LIGHT);
      doc.rect(0, 28, pageW, 9, "F");
      doc.setTextColor(...DARK);
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.text("Generated:", margin, 33.5);
      doc.setFont(undefined, "normal");
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        margin + 18,
        33.5,
      );

      // Image cache
      const imageCache = {};
      const fetchImg = async (p) => {
        if (!p || imageCache[p] !== undefined) return;
        try {
          const url = p.startsWith("http") ? p : `${API_URL}${p}`;
          const blob = await (await fetch(url)).blob();
          imageCache[p] = await new Promise((res) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result);
            r.readAsDataURL(blob);
          });
        } catch {
          imageCache[p] = null;
        }
      };
      await Promise.all(
        [...new Set(filteredItems.map((p) => p.image_url).filter(Boolean))].map(
          fetchImg,
        ),
      );

      const drawPlaceholder = (x, y, w, h) => {
        doc.setFillColor(232, 238, 252);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, "F");
        doc.setDrawColor(...GREY);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, "S");
        doc.setFontSize(4.5);
        doc.setTextColor(25, 100, 200);
        doc.text("No Image", x + w / 2, y + h / 2 + 1.5, { align: "center" });
      };

      const map = {};
      filteredItems.forEach((p) => {
        if (!map[p.common_name])
          map[p.common_name] = {
            product: p,
            variants: [],
            category: p.category,
          };
        if (p.variants?.length) map[p.common_name].variants.push(...p.variants);
      });
      const sorted = Object.values(map).sort(
        (a, b) =>
          getSortIndex(a.product.common_name) -
          getSortIndex(b.product.common_name),
      );
      const tableBody = [];
      sorted.forEach(({ product, variants, category }) => {
        if (variants.length) {
          variants.forEach((v, i) =>
            tableBody.push({
              isFirst: i === 0,
              commonName: product.common_name,
              scientificName: product.scientific_name || "—",
              image: product.image_url || null,
              type: fmt(category),
              size: v.size || "—",
            }),
          );
        } else {
          tableBody.push({
            isFirst: true,
            commonName: product.common_name,
            scientificName: product.scientific_name || "—",
            image: product.image_url || null,
            type: fmt(category),
            size: "—",
          });
        }
      });

      autoTable(doc, {
        startY: 40,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: "Picture", styles: { halign: "center" } },
            { content: "Common Name", styles: { halign: "left" } },
            { content: "Scientific Name", styles: { halign: "left" } },
            { content: "Type", styles: { halign: "left" } },
            { content: "Size / Range", styles: { halign: "left" } },
          ],
        ],
        body: tableBody.map((r) => [
          "",
          r.isFirst ? r.commonName : "",
          r.isFirst ? r.scientificName : "",
          r.isFirst ? r.type : "",
          r.size,
        ]),
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 14, halign: "center", valign: "middle" },
          1: {
            cellWidth: 55,
            halign: "left",
            valign: "middle",
            fontStyle: "bold",
            fontSize: 7.5,
          },
          2: {
            cellWidth: 50,
            halign: "left",
            valign: "middle",
            fontStyle: "italic",
            fontSize: 7,
            textColor: [50, 80, 150],
          },
          3: { cellWidth: 20, halign: "left", valign: "middle", fontSize: 7 },
          4: {
            cellWidth: "auto",
            halign: "left",
            valign: "middle",
            fontSize: 7,
          },
        },
        headStyles: {
          fillColor: NAVY_DARK,
          textColor: WHITE,
          fontStyle: "bold",
          fontSize: 7.5,
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
          minCellHeight: 12,
          textColor: DARK,
          lineColor: GREY,
          lineWidth: 0.2,
        },
        willDrawCell: (data) => {
          if (data.section !== "body") return;
          const r = tableBody[data.row.index];
          if (r && !r.isFirst && data.column.index <= 3)
            data.cell.styles.lineWidth = {
              top: 0,
              bottom: 0.2,
              left: 0.2,
              right: 0.2,
            };
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.index !== 0) return;
          const r = tableBody[data.row.index];
          if (!r || !r.isFirst) return;
          const imgW = 10,
            imgH = 10;
          const x = data.cell.x + (data.cell.width - imgW) / 2;
          const y = data.cell.y + (data.cell.height - imgH) / 2;
          const src = r.image ? imageCache[r.image] : null;
          if (src) {
            const f = src.includes("image/png") ? "PNG" : "JPEG";
            try {
              doc.addImage(src, f, x, y, imgW, imgH, undefined, "FAST");
            } catch {
              drawPlaceholder(x, y, imgW, imgH);
            }
          } else drawPlaceholder(x, y, imgW, imgH);
        },
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...NAVY);
        doc.rect(0, pageH - 8, pageW, 8, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(6);
        doc.setFont(undefined, "normal");
        doc.text(
          "Tropical Shellfish (Pvt) Ltd  |  Prices subject to change without prior notice",
          pageW / 2,
          pageH - 3,
          { align: "center" },
        );
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 3, {
          align: "right",
        });
      }
      doc.save(
        `Local_Product_List_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error(err);
      alert("Error generating PDF.");
    }
  };

  const handleDownloadPriceListPDF = async () => {
    if (filteredItems.length === 0) {
      alert("No products to download");
      return;
    }
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth(),
        pageH = doc.internal.pageSize.getHeight(),
        margin = 12;
      const NAVY = [13, 71, 161],
        NAVY_DARK = [8, 47, 114],
        NAVY_LIGHT = [224, 232, 247],
        WHITE = [255, 255, 255],
        DARK = [20, 20, 40],
        GREY = [180, 200, 230];

      // Header
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 28, "F");
      try {
        doc.addImage(logoSrc, "PNG", margin, 4, 22, 20);
      } catch {}
      doc.setTextColor(...WHITE);
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Tropical Shellfish (Pvt) Ltd", margin + 26, 13);
      doc.setFontSize(7);
      doc.setFont(undefined, "normal");
      doc.text(
        "Fresh & Frozen Seafood Exporters  |  Quality You Can Trust",
        margin + 26,
        19,
      );

      // Sub-header
      doc.setFillColor(...NAVY_LIGHT);
      doc.rect(0, 28, pageW, 9, "F");
      doc.setTextColor(...DARK);
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.text("Price List — Selling Prices", margin, 33.5);
      doc.setFont(undefined, "normal");
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        margin + 38,
        33.5,
      );

      // Image cache
      const imageCache = {};
      const fetchImg = async (p) => {
        if (!p || imageCache[p] !== undefined) return;
        try {
          const blob = await (
            await fetch(p.startsWith("http") ? p : `${API_URL}${p}`)
          ).blob();
          imageCache[p] = await new Promise((res) => {
            const r = new FileReader();
            r.onloadend = () => res(r.result);
            r.readAsDataURL(blob);
          });
        } catch {
          imageCache[p] = null;
        }
      };
      await Promise.all(
        [...new Set(filteredItems.map((p) => p.image_url).filter(Boolean))].map(
          fetchImg,
        ),
      );

      const drawPlaceholder = (x, y, w, h) => {
        doc.setFillColor(232, 238, 252);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, "F");
        doc.setDrawColor(...GREY);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, w, h, 1.5, 1.5, "S");
        doc.setFontSize(4.5);
        doc.setTextColor(25, 100, 200);
        doc.text("No Image", x + w / 2, y + h / 2 + 1.5, { align: "center" });
      };

      const map = {};
      filteredItems.forEach((p) => {
        if (!map[p.common_name])
          map[p.common_name] = {
            commonName: p.common_name,
            scientificName: p.scientific_name || "—",
            image: p.image_url || null,
            variants: [],
          };
        if (p.variants?.length) map[p.common_name].variants.push(...p.variants);
      });
      const sorted = Object.keys(map).sort(
        (a, b) => getSortIndex(a) - getSortIndex(b),
      );
      const tableBody = [];
      sorted.forEach((name) => {
        const p = map[name];
        const vars = [...p.variants].sort(
          (a, b) => (sf(a.size) || 0) - (sf(b.size) || 0),
        );
        if (vars.length)
          vars.forEach((v, i) =>
            tableBody.push({
              isFirst: i === 0,
              commonName: p.commonName,
              scientificName: p.scientificName,
              image: p.image,
              size: v.size || "—",
              sellingPrice: v.selling_price ?? null,
            }),
          );
        else
          tableBody.push({
            isFirst: true,
            commonName: p.commonName,
            scientificName: p.scientificName,
            image: p.image,
            size: "—",
            sellingPrice: null,
          });
      });

      autoTable(doc, {
        startY: 40,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: "Picture", styles: { halign: "center" } },
            { content: "Common Name", styles: { halign: "left" } },
            { content: "Scientific Name", styles: { halign: "left" } },
            { content: "Size / Range", styles: { halign: "left" } },
            { content: "Selling Price (Rs)", styles: { halign: "right" } },
          ],
        ],
        body: tableBody.map((r) => [
          "",
          r.isFirst ? r.commonName : "",
          r.isFirst ? r.scientificName : "",
          r.size,
          r.sellingPrice != null
            ? `Rs. ${parseFloat(r.sellingPrice).toFixed(2)}`
            : "—",
        ]),
        theme: "grid",
        columnStyles: {
          0: {
            cellWidth: 14,
            halign: "center",
            valign: "middle",
            minCellHeight: 12,
          },
          1: {
            cellWidth: 55,
            halign: "left",
            valign: "middle",
            fontStyle: "bold",
            fontSize: 7.5,
          },
          2: {
            cellWidth: 50,
            halign: "left",
            valign: "middle",
            fontStyle: "italic",
            fontSize: 7,
            textColor: [50, 80, 150],
          },
          3: {
            cellWidth: "auto",
            halign: "left",
            valign: "middle",
            fontSize: 7,
          },
          4: {
            cellWidth: 30,
            halign: "right",
            valign: "middle",
            fontSize: 7.5,
            fontStyle: "bold",
            textColor: [0, 120, 0],
          },
        },
        headStyles: {
          fillColor: NAVY_DARK,
          textColor: WHITE,
          fontStyle: "bold",
          fontSize: 7.5,
          cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
          minCellHeight: 12,
          textColor: DARK,
          lineColor: GREY,
          lineWidth: 0.2,
        },
        willDrawCell: (data) => {
          if (data.section !== "body") return;
          const r = tableBody[data.row.index];
          if (r && !r.isFirst && data.column.index <= 2)
            data.cell.styles.lineWidth = {
              top: 0,
              bottom: 0.2,
              left: 0.2,
              right: 0.2,
            };
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.index !== 0) return;
          const r = tableBody[data.row.index];
          if (!r || !r.isFirst) return;
          const imgW = 10,
            imgH = 10;
          const x = data.cell.x + (data.cell.width - imgW) / 2;
          const y = data.cell.y + (data.cell.height - imgH) / 2;
          const src = r.image ? imageCache[r.image] : null;
          if (src) {
            const f = src.includes("image/png") ? "PNG" : "JPEG";
            try {
              doc.addImage(src, f, x, y, imgW, imgH, undefined, "FAST");
            } catch {
              drawPlaceholder(x, y, imgW, imgH);
            }
          } else drawPlaceholder(x, y, imgW, imgH);
        },
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...NAVY);
        doc.rect(0, pageH - 8, pageW, 8, "F");
        doc.setTextColor(...WHITE);
        doc.setFontSize(6);
        doc.setFont(undefined, "normal");
        doc.text(
          "Tropical Shellfish (Pvt) Ltd  |  Prices subject to change without prior notice",
          pageW / 2,
          pageH - 3,
          { align: "center" },
        );
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 3, {
          align: "right",
        });
      }
      doc.save(`Price_List_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating price list PDF.");
    }
  };

  /* ══════════════════════════ RENDER ══════════════════════════════ */
  const sectionIcon = {
    Oyster: "🦪",
    Clams: "🐚",
    Mussel: "🦪",
    Crab: "🦀",
    Prawn: "🦐",
    Lobster: "🦞",
    Scampi: "🦞",
    "Cuttlefish & Squid": "🦑",
    Octopus: "🐙",
    "Marine Fish": "🐟",
    "Fresh Water": "🐠",
    "Processed Products": "📦",
    Other: "📦",
  };

  return (
    <div className="pricelist-container">
      <h2>Local Product List</h2>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="add-section">
        {adminUser && (
          <button className="apf-btn" onClick={openCatalogueModal}>
            + Add from Catalogue
          </button>
        )}
        <button
          className="apf-btn"
          onClick={handleDownloadPDF}
          style={{
            marginLeft: "10px",
            background: "var(--accent-cyan, #0ea5e9)",
          }}
        >
          ⬇ Download Full PDF
        </button>
        <button
          className="apf-btn"
          onClick={handleDownloadPriceListPDF}
          style={{
            marginLeft: "10px",
            background: "var(--accent-green, #10b981)",
          }}
        >
          💰 Download Price List
        </button>
        {adminUser && (
          <button
            className="apf-btn"
            onClick={bulkMode ? openBulkModal : toggleBulkMode}
            style={{
              marginLeft: "10px",
              background: bulkMode ? "#f59e0b" : "#6366f1",
            }}
          >
            {bulkMode
              ? selectedProductIds.size > 0
                ? `➕ Add ${selectedProductIds.size} to Customer`
                : "✕ Cancel"
              : "👥 Add to Customer"}
          </button>
        )}
        {bulkMode && selectedProductIds.size === 0 && (
          <button
            className="cancel-btn"
            onClick={toggleBulkMode}
            style={{ marginLeft: "8px" }}
          >
            Cancel
          </button>
        )}
      </div>

      {bulkMode && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            padding: "10px 16px",
            marginBottom: "12px",
            fontSize: "14px",
            color: "#92400e",
          }}
        >
          ☑️ Select products to add to a customer.{" "}
          {selectedProductIds.size > 0 ? (
            <strong>{selectedProductIds.size} selected.</strong>
          ) : (
            "No products selected yet."
          )}
        </div>
      )}

      {/* Species Filter Pills */}
      <div className="species-filter">
        {speciesTypes.map((type) => (
          <button
            key={type.value}
            className={`species-pill ${selectedSpeciesType === type.value ? "active" : ""}`}
            onClick={() => setSelectedSpeciesType(type.value)}
            disabled={getSpeciesCount(type.value) === 0 && type.value !== "all"}
          >
            <span className="species-icon">{type.icon}</span>
            <span className="species-label">{type.label}</span>
            <span className="species-count">
              ({getSpeciesCount(type.value)})
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="info">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="filter-info">
            Showing <strong>{filteredItems.length}</strong>{" "}
            {selectedSpeciesType === "all"
              ? "products"
              : fmt(selectedSpeciesType)}
          </div>

          <div className="table-wrap">
            <table className="pricelist-table">
              <thead>
                <tr>
                  {bulkMode && <th style={{ width: "40px" }}>Select</th>}
                  <th>Picture</th>
                  <th>Common Name</th>
                  <th>Scientific Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Purchase Price</th>
                  <th>Profit</th>
                  <th>Selling Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...sectionCategories.map((s) => s.name), "Other"].map(
                  (section) => {
                    if (!sectionHasProducts(section)) return null;
                    return (
                      <React.Fragment key={section}>
                        <tr className="section-header">
                          <td
                            colSpan={bulkMode ? 11 : 10}
                            className="section-title"
                          >
                            <span className="section-icon">
                              {sectionIcon[section] || "📦"}
                            </span>
                            {section}
                          </td>
                        </tr>

                        {Object.entries(groupedBySection[section]).map(
                          ([groupKey, products]) => {
                            const commonName =
                              products[0]?.common_name ||
                              groupKey.split("||")[0];
                            const groupRowSpan = getTotalRows(products);
                            const firstProduct = products[0];
                            const imgSrc = getImageUrl(firstProduct.image_url);
                            const isSelected = selectedProductIds.has(
                              firstProduct.id,
                            );
                            let isFirstOfGroup = true;

                            return products.map((product) => {
                              const variants = product.variants || [];

                              if (variants.length > 0) {
                                return variants.map((variant, vi) => {
                                  const isVeryFirst =
                                    isFirstOfGroup && vi === 0;
                                  const isFirstOfProd = vi === 0;
                                  if (isVeryFirst) isFirstOfGroup = false;

                                  return (
                                    <tr
                                      key={`${product.id}-${vi}-${variant.id || vi}`}
                                      className={
                                        isVeryFirst ? "product-group-start" : ""
                                      }
                                    >
                                      {bulkMode && isVeryFirst && (
                                        <td
                                          rowSpan={groupRowSpan}
                                          style={{
                                            textAlign: "center",
                                            verticalAlign: "middle",
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() =>
                                              toggleProductSelection(
                                                firstProduct.id,
                                              )
                                            }
                                            style={{
                                              width: "18px",
                                              height: "18px",
                                              cursor: "pointer",
                                            }}
                                          />
                                        </td>
                                      )}
                                      {isVeryFirst && (
                                        <>
                                          <td
                                            className="thumb-cell"
                                            rowSpan={groupRowSpan}
                                          >
                                            <img
                                              src={imgSrc}
                                              alt={commonName}
                                              className="thumb"
                                            />
                                          </td>
                                          <td
                                            rowSpan={groupRowSpan}
                                            style={{ fontWeight: 600 }}
                                          >
                                            {commonName}
                                          </td>
                                          <td
                                            className="scientific"
                                            rowSpan={groupRowSpan}
                                          >
                                            {firstProduct.scientific_name ||
                                              "—"}
                                          </td>
                                        </>
                                      )}
                                      {isFirstOfProd && (
                                        <td rowSpan={variants.length}>
                                          <span
                                            className={`category-badge ${getCategoryBadgeClass(product.category)}`}
                                          >
                                            {getCategoryBadgeIcon(
                                              product.category,
                                            )}{" "}
                                            {fmt(product.category)}
                                          </span>
                                        </td>
                                      )}
                                      <td>{variant.size || "—"}</td>
                                      <td className="price-cell">
                                        Rs.&nbsp;
                                        {sf(variant.purchasing_price).toFixed(
                                          2,
                                        )}
                                      </td>
                                      <td className="price-cell">
                                        Rs.&nbsp;{sf(variant.profit).toFixed(2)}
                                      </td>
                                      <td className="price-cell">
                                        Rs.&nbsp;
                                        {sf(variant.selling_price).toFixed(2)}
                                      </td>
                                      {isFirstOfProd && (
                                        <td
                                          className="actions-cell"
                                          rowSpan={variants.length}
                                        >
                                          <div className="actions-wrapper">
                                            <button
                                              className="btn-view"
                                              onClick={() =>
                                                navigate(
                                                  `/productdetail/${product.id}`,
                                                )
                                              }
                                            >
                                              View
                                            </button>
                                            {adminUser && (
                                              <button
                                                className="btn-edit"
                                                onClick={() => {
                                                  setShowCatalogueModal(true);
                                                  setCatalogueLoading(false);
                                                  setCatalogue([product]);
                                                  selectCatalogueProduct(
                                                    product,
                                                  );
                                                }}
                                              >
                                                Price
                                              </button>
                                            )}
                                            {adminUser && (
                                              <button
                                                className="btn-delete"
                                                onClick={() =>
                                                  handleRemoveFromLocal(
                                                    product.id,
                                                    product.common_name,
                                                  )
                                                }
                                              >
                                                Remove
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                });
                              }

                              // No variants row
                              const isVeryFirst = isFirstOfGroup;
                              if (isVeryFirst) isFirstOfGroup = false;
                              return (
                                <tr
                                  key={product.id}
                                  className={
                                    isVeryFirst ? "product-group-start" : ""
                                  }
                                >
                                  {bulkMode && isVeryFirst && (
                                    <td
                                      rowSpan={groupRowSpan}
                                      style={{
                                        textAlign: "center",
                                        verticalAlign: "middle",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                          toggleProductSelection(
                                            firstProduct.id,
                                          )
                                        }
                                        style={{
                                          width: "18px",
                                          height: "18px",
                                          cursor: "pointer",
                                        }}
                                      />
                                    </td>
                                  )}
                                  {isVeryFirst && (
                                    <>
                                      <td
                                        className="thumb-cell"
                                        rowSpan={groupRowSpan}
                                      >
                                        <img
                                          src={imgSrc}
                                          alt={commonName}
                                          className="thumb"
                                        />
                                      </td>
                                      <td
                                        rowSpan={groupRowSpan}
                                        style={{ fontWeight: 600 }}
                                      >
                                        {commonName}
                                      </td>
                                      <td
                                        className="scientific"
                                        rowSpan={groupRowSpan}
                                      >
                                        {firstProduct.scientific_name || "—"}
                                      </td>
                                      <td rowSpan={groupRowSpan}>
                                        <span
                                          className={`species-badge ${getSpeciesBadgeClass(firstProduct.species_type)}`}
                                        >
                                          {getSpeciesBadgeIcon(
                                            firstProduct.species_type,
                                          )}{" "}
                                          {fmt(firstProduct.species_type)}
                                        </span>
                                      </td>
                                    </>
                                  )}
                                  <td>
                                    <span
                                      className={`category-badge ${getCategoryBadgeClass(product.category)}`}
                                    >
                                      {getCategoryBadgeIcon(product.category)}{" "}
                                      {fmt(product.category)}
                                    </span>
                                  </td>
                                  <td className="muted">—</td>
                                  <td className="muted">—</td>
                                  <td className="muted">—</td>
                                  <td className="muted">—</td>
                                  <td className="actions-cell">
                                    <div className="actions-wrapper">
                                      <button
                                        className="btn-view"
                                        onClick={() =>
                                          navigate(
                                            `/productdetail/${product.id}`,
                                          )
                                        }
                                      >
                                        View
                                      </button>
                                      {adminUser && (
                                        <button
                                          className="btn-delete"
                                          onClick={() =>
                                            handleRemoveFromLocal(
                                              product.id,
                                              product.common_name,
                                            )
                                          }
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          },
                        )}
                      </React.Fragment>
                    );
                  },
                )}

                {!sectionCategories
                  .concat([{ name: "Other" }])
                  .some((s) => sectionHasProducts(s.name)) && (
                  <tr>
                    <td
                      colSpan={bulkMode ? 11 : 10}
                      className="muted"
                      style={{ textAlign: "center", padding: "3rem" }}
                    >
                      No products in the local list yet. Click "+ Add from
                      Catalogue" to add products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          ADD FROM CATALOGUE MODAL
      ══════════════════════════════════════════════════════════════ */}
      {showCatalogueModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#1e3a5f" }}>
                  {selectedCatProduct
                    ? `📋 Set Local Pricing — ${selectedCatProduct.common_name}`
                    : "🗂️ Add from Catalogue"}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  {selectedCatProduct
                    ? "Set profit and selling price per size. These prices will appear in the local list."
                    : "Select a product from the master catalogue to add to the local list."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCatalogueModal(false);
                  setSelectedCatProduct(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                ✕
              </button>
            </div>

            {!selectedCatProduct ? (
              /* ── Step 1: Pick a product ── */
              <>
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <input
                    value={catalogueSearch}
                    onChange={(e) => setCatalogueSearch(e.target.value)}
                    placeholder="🔍 Search by name…"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                  {catalogueLoading && (
                    <div
                      style={{
                        padding: "24px",
                        textAlign: "center",
                        color: "#6b7280",
                      }}
                    >
                      Loading catalogue…
                    </div>
                  )}
                  {!catalogueLoading &&
                    filteredCatalogue.map((product) => {
                      const inLocalList = items.some(
                        (p) => p.id === product.id,
                      );
                      return (
                        <div
                          key={product.id}
                          onClick={() => selectCatalogueProduct(product)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "12px 24px",
                            cursor: "pointer",
                            borderBottom: "1px solid #f1f5f9",
                            background: inLocalList ? "#f0fdf4" : "#fff",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = inLocalList
                              ? "#dcfce7"
                              : "#f8faff")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = inLocalList
                              ? "#f0fdf4"
                              : "#fff")
                          }
                        >
                          <img
                            src={
                              product.image_url
                                ? product.image_url.startsWith("http")
                                  ? product.image_url
                                  : `${API_URL}${product.image_url}`
                                : "/images/placeholder-seafood.png"
                            }
                            alt={product.common_name}
                            style={{
                              width: "44px",
                              height: "44px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              border: "1px solid #e5e7eb",
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "#1e3a5f",
                                fontSize: "14px",
                              }}
                            >
                              {product.common_name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                fontStyle: "italic",
                              }}
                            >
                              {product.scientific_name || "—"}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                marginTop: "2px",
                              }}
                            >
                              {(product.variants || []).length} size
                              {(product.variants || []).length !== 1
                                ? "s"
                                : ""}{" "}
                              · {fmt(product.category)}
                            </div>
                          </div>
                          {inLocalList && (
                            <span
                              style={{
                                fontSize: "11px",
                                background: "#dcfce7",
                                color: "#166534",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontWeight: 600,
                              }}
                            >
                              ✓ In list
                            </span>
                          )}
                          <span style={{ color: "#94a3b8", fontSize: "18px" }}>
                            ›
                          </span>
                        </div>
                      );
                    })}
                  {!catalogueLoading && filteredCatalogue.length === 0 && (
                    <div
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#9ca3af",
                      }}
                    >
                      No products found
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── Step 2: Set pricing ── */
              <>
                {/* Quick fill bar */}
                <div
                  style={{
                    padding: "12px 24px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f8faff",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#475569",
                      fontWeight: 600,
                    }}
                  >
                    Apply profit to all:
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150"
                    style={{
                      width: "110px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyProfitToAll(e.target.value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value) applyProfitToAll(e.target.value);
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Press Enter or blur to apply
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      marginLeft: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Category:
                    </span>
                    {[
                      { key: "fresh", label: "💧 Fresh", color: "#38bdf8" },
                      { key: "frozen", label: "❄️ Frozen", color: "#818cf8" },
                      { key: "live", label: "🟢 Live", color: "#34d399" },
                    ].map((cat) => {
                      const on = selectedPricingCategories.includes(cat.key);
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() =>
                            setSelectedPricingCategories((prev) => {
                              const has = prev.includes(cat.key);
                              const next = has
                                ? prev.filter((c) => c !== cat.key)
                                : [...prev, cat.key];
                              return next.length ? next : [cat.key];
                            })
                          }
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            border: `2px solid ${on ? cat.color : "#e2e8f0"}`,
                            background: on ? `${cat.color}20` : "#fff",
                            color: on ? cat.color : "#94a3b8",
                            fontWeight: "700",
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {on ? "✓ " : ""}
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setSelectedCatProduct(null)}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "1px solid #d1d5db",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    ← Back to catalogue
                  </button>
                </div>

                <div
                  style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}
                >
                  {pricingRows.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        padding: "32px",
                      }}
                    >
                      This product has no sizes yet. Add sizes from the master
                      catalogue first.
                    </div>
                  )}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                    }}
                  >
                    {pricingRows.length > 0 && (
                      <thead>
                        <tr style={{ background: "#f1f5f9" }}>
                          {[
                            "Size",
                            "Unit",
                            "Purchase (Rs.)",
                            "Profit (Rs.)",
                            "Margin %",
                            "Selling (Rs.)",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "8px 10px",
                                color: "#475569",
                                fontWeight: 600,
                                textAlign:
                                  h === "Size" || h === "Unit"
                                    ? "left"
                                    : "right",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {pricingRows.map((row, i) => (
                        <tr
                          key={`${row.variant_id}-${i}`}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <td
                            style={{
                              padding: "8px 10px",
                              fontWeight: 600,
                              color: "#1e3a5f",
                            }}
                          >
                            {row.size || "—"}
                          </td>
                          <td style={{ padding: "8px 10px", color: "#6b7280" }}>
                            {row.unit}
                          </td>
                          <td
                            style={{
                              padding: "8px 10px",
                              textAlign: "right",
                              color: "#374151",
                            }}
                          >
                            Rs. {sf(row.purchasing_price).toFixed(2)}
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            <input
                              type="number"
                              step="0.01"
                              value={row.profit}
                              onChange={(e) =>
                                updatePricingRow(i, "profit", e.target.value)
                              }
                              style={{
                                width: "90px",
                                padding: "5px 8px",
                                textAlign: "right",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "13px",
                              }}
                            />
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            <input
                              type="number"
                              step="0.01"
                              value={row.profit_margin_percentage}
                              onChange={(e) =>
                                updatePricingRow(
                                  i,
                                  "profit_margin_percentage",
                                  e.target.value,
                                )
                              }
                              style={{
                                width: "70px",
                                padding: "5px 8px",
                                textAlign: "right",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "13px",
                              }}
                            />
                          </td>
                          <td style={{ padding: "4px 6px" }}>
                            <input
                              type="number"
                              step="0.01"
                              value={row.selling_price}
                              onChange={(e) =>
                                updatePricingRow(
                                  i,
                                  "selling_price",
                                  e.target.value,
                                )
                              }
                              style={{
                                width: "100px",
                                padding: "5px 8px",
                                textAlign: "right",
                                borderRadius: "6px",
                                border: "1px solid #0d47a1",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#0d47a1",
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                  }}
                >
                  <button
                    onClick={() => {
                      setShowCatalogueModal(false);
                      setSelectedCatProduct(null);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={savePricing}
                    disabled={savingPricing || pricingRows.length === 0}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        savingPricing || pricingRows.length === 0
                          ? "#9ca3af"
                          : "#0d47a1",
                      color: "#fff",
                      cursor:
                        savingPricing || pricingRows.length === 0
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {savingPricing ? "Saving…" : "Save to Local List"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bulk Add to Customer Modal (unchanged) ─────────────────── */}
      {showBulkModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "780px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", color: "#1e3a5f" }}>
                👥 Add Products to Customer
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {bulkItems.length} variant(s) from {selectedProductIds.size}{" "}
                product(s)
              </p>
            </div>
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#374151",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Select Customer *
              </label>
              <select
                value={bulkCustomerId}
                onChange={(e) => setBulkCustomerId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              >
                <option value="">— Choose a customer —</option>
                {customers.map((c) => (
                  <option key={c.cus_id ?? c.id} value={c.cus_id ?? c.id}>
                    {c.cus_name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    {[
                      "Product",
                      "Size",
                      "Purchase (Rs)",
                      "Margin (Rs)",
                      "Margin %",
                      "Selling (Rs)",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 10px",
                          textAlign:
                            h === "Product" || h === "Size" ? "left" : "right",
                          color: "#475569",
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulkItems.map((item) => (
                    <tr
                      key={item.key}
                      style={{ borderBottom: "1px solid #e5e7eb" }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          fontWeight: 500,
                          color: "#1e3a5f",
                        }}
                      >
                        {item.common_name}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#6b7280" }}>
                        {item.size_range || "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          color: "#374151",
                        }}
                      >
                        {sf(item.purchasing_price).toFixed(2)}
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.margin}
                          onChange={(e) =>
                            updateBulkItem(item.key, "margin", e.target.value)
                          }
                          style={{
                            width: "80px",
                            padding: "4px 6px",
                            textAlign: "right",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "13px",
                          }}
                        />
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.margin_percentage}
                          onChange={(e) =>
                            updateBulkItem(
                              item.key,
                              "margin_percentage",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "70px",
                            padding: "4px 6px",
                            textAlign: "right",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            fontSize: "13px",
                          }}
                        />
                      </td>
                      <td style={{ padding: "4px 6px" }}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.selling_price}
                          onChange={(e) =>
                            updateBulkItem(
                              item.key,
                              "selling_price",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "90px",
                            padding: "4px 6px",
                            textAlign: "right",
                            borderRadius: "6px",
                            border: "1px solid #0d47a1",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#0d47a1",
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowBulkModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={bulkSubmitting || !bulkCustomerId}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    bulkSubmitting || !bulkCustomerId ? "#9ca3af" : "#0d47a1",
                  color: "#fff",
                  cursor:
                    bulkSubmitting || !bulkCustomerId
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {bulkSubmitting ? "Adding…" : "Add to Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productlist;
