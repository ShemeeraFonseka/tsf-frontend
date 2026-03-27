import React, { useEffect, useState } from "react";
import "./Productlist.css";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSrc from "./logo.png";

import { isAdmin } from "../../hooks/useAuth";

/* ── Badge helpers ─────────────────────────────────────────────── */
const getSpeciesBadgeClass = (speciesType) => {
  if (!speciesType) return "badge-default";
  const val = speciesType.toLowerCase();
  if (val === "fish") return "badge-fish";
  if (val === "crustacean") return "badge-crustacean";
  return "badge-default";
};
const getSpeciesBadgeIcon = (speciesType) => {
  if (!speciesType) return "🌊";
  const val = speciesType.toLowerCase();
  if (val === "fish") return "🐟";
  if (val === "crustacean") return "🦞";
  return "🌊";
};
const getCategoryBadgeClass = (category) => {
  if (!category) return "badge-default-cat";
  const val = category.toLowerCase();
  if (val === "live") return "badge-live";
  if (val === "fresh") return "badge-fresh";
  if (val === "frozen") return "badge-frozen";
  return "badge-default-cat";
};
const getCategoryBadgeIcon = (category) => {
  if (!category) return "";
  const val = category.toLowerCase();
  if (val === "live") return "🟢";
  if (val === "fresh") return "💧";
  if (val === "frozen") return "❄️";
  return "";
};

/* ── Shared FOB calculator ── */
const calcFobUSD = (variant, usdRate) => {
  const rate = usdRate || parseFloat(variant.usdrate) || 1;
  if (parseFloat(variant.jc_fob) > 0) {
    // JC FOB model: FOB = jc_fob + profit + packing + labour
    return (
      (parseFloat(variant.jc_fob) || 0) +
      (parseFloat(variant.profit) || 0) +
      (parseFloat(variant.packing_cost) || 0) +
      (parseFloat(variant.labour_overhead) || 0)
    );
  } else {
    // Purchase price model: FOB = exfactoryprice / usdrate
    return parseFloat(variant.exfactoryprice || 0) / rate;
  }
};

const ExportProductlist = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState("all");
  const [currentUsdRate, setCurrentUsdRate] = useState(null);

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkItems, setBulkItems] = useState([]);
  const bulkFreightType = "sea";
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [bulkCustomerId, setBulkCustomerId] = useState("");

  const sectionCategories = [
    {
      name: "Fish",
      keywords: [
        "fish",
        "tilapia",
        "pearl spot",
        "job fish",
        "rabbit fish",
        "sole fish",
        "red mullet",
        "sea bass",
        "tuna",
        "parrot fish",
        "grey mullet",
        "red snapper",
        "emperor fish",
        "grouper",
        "brown grouper",
        "gray grouper",
        "red grouper",
        "red spot grouper",
        "king fish",
        "sword fish",
        "silver pomfret",
        "barramundi",
        "barracuda",
        "black spotted snapper",
        "blubber",
        "yellowtail fusilier",
        "blue spotted large eye bream",
        "pinjalo",
        "indian salmon",
        "mahi mahi",
        "marlin loin",
        "bonito",
        "cobia",
        "indian mackerel",
        "indian mackeral",
        "emperor",
        "sea bream",
        "travelly whole",
        "threadfin bream",
        "sword",
      ],
    },
    { name: "Crab", keywords: ["crab", "blue swimming crab", "lagoon crab"] },
    {
      name: "Prawn",
      keywords: [
        "prawn",
        "tiger prawn",
        "green tiger prawn",
        "white prawn",
        "pacific white shrimp",
        "shrimp",
        "flowery",
        "vannamei",
      ],
    },
    {
      name: "Scampi/Lobster",
      keywords: ["lobster", "bamboo lobster", "tiger lobster", "scampi"],
    },
    { name: "Octopus", keywords: ["octopus"] },
    { name: "Clams", keywords: ["clam", "clams"] },
    { name: "Oysters", keywords: ["oyster", "depurated oyster"] },
    { name: "Mussles", keywords: ["mussle", "brown mussle", "green mussle"] },
    { name: "Giant Freshwater Prawn", keywords: ["giant freshwater prawn"] },
  ];

  const speciesTypes = [
    { value: "all", label: "All Products", icon: "🌊" },
    { value: "crustacean", label: "Crustacean", icon: "🦞" },
    { value: "fish", label: "Fish", icon: "🐟" },
  ];

  useEffect(() => {
    fetchProducts();
  }, []); // eslint-disable-line

  useEffect(() => {
    fetch(`${API_URL}/api/usd-rate`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) setCurrentUsdRate(data.rate);
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (selectedSpeciesType === "all") setFilteredItems(items);
    else
      setFilteredItems(
        items.filter(
          (item) =>
            item.species_type?.toLowerCase() ===
            selectedSpeciesType.toLowerCase(),
        ),
      );
  }, [selectedSpeciesType, items]);

  const fetchProducts = () => {
    fetch(`${API_URL}/api/exportproductlist`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
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

  const handleDelete = async (productId, productName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}"? This will delete all variants as well.`,
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/api/exportproductlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchProducts();
    } catch (err) {
      alert("Error deleting product: " + err.message);
    }
  };

  const formatCategory = (c) =>
    !c ? "-" : c.charAt(0).toUpperCase() + c.slice(1);
  const formatSpeciesType = (s) => {
    if (!s) return "-";
    const t = speciesTypes.find((x) => x.value === s.toLowerCase());
    return t ? t.label : s.charAt(0).toUpperCase() + s.slice(1);
  };

  const navigateForm = () => navigate("/exportproductform");
  const navigateEdit = (productId) =>
    navigate(`/exportproductform/${productId}`);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "/images/placeholder-seafood.png";
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://"))
      return imageUrl;
    return `${API_URL}${imageUrl}`;
  };

  const getSpeciesTypeCount = (typeValue) => {
    if (typeValue === "all") return items.length;
    return items.filter(
      (item) => item.species_type?.toLowerCase() === typeValue,
    ).length;
  };

  const getProductSection = (product) => {
    const commonName = product.common_name?.toLowerCase() || "";
    for (const section of sectionCategories) {
      if (section.keywords.some((keyword) => commonName.includes(keyword)))
        return section.name;
    }
    return "Other";
  };

  const groupProductsBySection = (products) => {
    const grouped = {};
    sectionCategories.forEach((section) => {
      grouped[section.name] = [];
    });
    grouped["Other"] = [];
    products.forEach((product) => {
      grouped[getProductSection(product)].push(product);
    });
    return grouped;
  };

  const groupedBySection = groupProductsBySection(filteredItems);
  const groupedProductsBySection = {};
  Object.keys(groupedBySection).forEach((section) => {
    groupedProductsBySection[section] = groupedBySection[section].reduce(
      (acc, product) => {
        const key = product.common_name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
      },
      {},
    );
  });

  const getTotalRowsForGroup = (products) =>
    products.reduce((sum, product) => {
      const variants = product.variants || [];
      return sum + (variants.length > 0 ? variants.length : 1);
    }, 0);

  const sectionHasProducts = (section) =>
    Object.keys(groupedProductsBySection[section] || {}).length > 0;

  /* ── Bulk-add handlers ── */
  const toggleBulkMode = () => {
    setBulkMode((prev) => !prev);
    setSelectedProductIds(new Set());
  };

  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const openBulkModal = async () => {
    if (selectedProductIds.size === 0) {
      alert("Please select at least one product.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/exportcustomerlist`);
      if (res.ok) setCustomers(await res.json());
    } catch (err) {
      console.error(err);
    }

    const usdRate = parseFloat(currentUsdRate) || 304;
    const rows = [];

    filteredItems.forEach((product) => {
      if (!selectedProductIds.has(product.id)) return;
      const variants = product.variants || [];
      if (variants.length > 0) {
        variants.forEach((variant) => {
          const exf = parseFloat(variant.exfactoryprice) || 0;
          const variantUsdRate = parseFloat(variant.usdrate) || usdRate;
          // Use shared FOB calculator — handles both JC FOB and purchase price models
          const fobInUSD = calcFobUSD(variant, variantUsdRate);

          rows.push({
            key: `${product.id}-${variant.id}`,
            product_id: product.id,
            variant_id: variant.id,
            common_name: product.common_name,
            scientific_name: product.scientific_name || "",
            category: product.category,
            image_url: product.image_url || "",
            size_range: `${variant.size}`,
            purchasing_price: parseFloat(variant.purchasing_price) || 0,
            exfactoryprice: exf,
            usdrate: variantUsdRate,
            // Store pricing fields needed for handleBulkSubmit
            jc_fob: parseFloat(variant.jc_fob) || 0,
            profit: parseFloat(variant.profit) || 0,
            packing_cost: parseFloat(variant.packing_cost) || 0,
            labour_overhead: parseFloat(variant.labour_overhead) || 0,
            fob_usd_display: parseFloat(fobInUSD.toFixed(4)),
            fob_price: parseFloat(fobInUSD.toFixed(4)), // stored as USD
            multiplier: parseFloat(variant.multiplier) || 0,
            divisor: parseFloat(variant.divisor) || 1,
          });
        });
      } else {
        rows.push({
          key: `${product.id}-none`,
          product_id: product.id,
          variant_id: null,
          common_name: product.common_name,
          scientific_name: product.scientific_name || "",
          category: product.category,
          image_url: product.image_url || "",
          size_range: "",
          purchasing_price: 0,
          exfactoryprice: 0,
          usdrate: usdRate,
          jc_fob: 0,
          profit: 0,
          packing_cost: 0,
          labour_overhead: 0,
          fob_usd_display: 0,
          fob_price: 0,
          multiplier: 0,
          divisor: 1,
        });
      }
    });

    setBulkItems(rows);
    setBulkCustomerId("");
    setShowBulkModal(true);
  };

  const handleBulkSubmit = async () => {
    if (!bulkCustomerId) {
      alert("Please select a customer.");
      return;
    }
    if (bulkItems.length === 0) return;
    setBulkSubmitting(true);
    let successCount = 0,
      skipCount = 0,
      errorCount = 0;

    try {
      const existingRes = await fetch(
        `${API_URL}/api/exportcustomer-products/${bulkCustomerId}`,
      );
      const existingData = existingRes.ok ? await existingRes.json() : [];
      const existingKeys = new Set(
        existingData.map((e) => `${e.product_id}-${e.variant_id ?? "null"}`),
      );

      const customerRes = await fetch(
        `${API_URL}/api/exportcustomerlist/${bulkCustomerId}`,
      );
      const customerData = customerRes.ok ? await customerRes.json() : null;

      let seaRateData = null;
      if (customerData?.country) {
        const sfRes = await fetch(`${API_URL}/api/sea-freight-rates`);
        if (sfRes.ok) {
          const allSeaRates = await sfRes.json();
          const matches = allSeaRates.filter(
            (r) =>
              r.country.toLowerCase() === customerData.country.toLowerCase(),
          );
          if (customerData.port_code) {
            const exact = matches.filter(
              (r) =>
                r.port_code?.toUpperCase() ===
                customerData.port_code.toUpperCase(),
            );
            seaRateData = exact.length
              ? exact.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
              : matches.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          } else {
            seaRateData = matches.sort(
              (a, b) => new Date(b.date) - new Date(a.date),
            )[0];
          }
        }
      }

      for (const item of bulkItems) {
        const dupKey = `${item.product_id}-${item.variant_id ?? "null"}`;
        if (existingKeys.has(dupKey)) {
          skipCount++;
          continue;
        }

        // Recalculate FOB using the same model-aware logic
        const fobInUSD =
          parseFloat(item.jc_fob) > 0
            ? item.jc_fob +
              item.profit +
              item.packing_cost +
              item.labour_overhead
            : item.usdrate > 0
              ? item.exfactoryprice / item.usdrate
              : 0;

        let freightData = {
          freight_cost_45kg: 0,
          freight_cost_100kg: 0,
          freight_cost_300kg: 0,
          freight_cost_500kg: 0,
          cnf_45kg: 0,
          cnf_100kg: 0,
          cnf_300kg: 0,
          cnf_500kg: 0,
          freight_cost_20ft: 0,
          cnf_20ft: 0,
          freight_cost_40ft: 0,
          cnf_40ft: 0,
          multiplier: item.multiplier || 0,
          divisor: item.divisor || 1,
        };

        if (bulkFreightType === "sea" && seaRateData) {
          const perKilo20 = parseFloat(seaRateData.freight_per_kilo_20ft) || 0;
          const perKilo40 = parseFloat(seaRateData.freight_per_kilo_40ft) || 0;
          freightData = {
            ...freightData,
            freight_cost_20ft: parseFloat(perKilo20.toFixed(4)),
            cnf_20ft: parseFloat((fobInUSD + perKilo20).toFixed(2)), // pure addition
            freight_cost_40ft: parseFloat(perKilo40.toFixed(4)),
            cnf_40ft: parseFloat((fobInUSD + perKilo40).toFixed(2)),
          };
        }

        const payload = {
          cus_id: parseInt(bulkCustomerId),
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          common_name: item.common_name,
          scientific_name: item.scientific_name || null,
          image_url: item.image_url || null,
          category: item.category,
          size_range: item.size_range,
          purchasing_price: item.purchasing_price,
          exfactoryprice: item.exfactoryprice,
          export_doc: 0,
          transport_cost: 0,
          loading_cost: 0,
          airway_cost: 0,
          forwardHandling_cost: 0,
          freight_type: bulkFreightType,
          fob_price: parseFloat(fobInUSD.toFixed(4)), // stored as USD
          multiplier: freightData.multiplier,
          divisor: freightData.divisor,
          freight_cost_45kg: freightData.freight_cost_45kg,
          freight_cost_100kg: freightData.freight_cost_100kg,
          freight_cost_300kg: freightData.freight_cost_300kg,
          freight_cost_500kg: freightData.freight_cost_500kg,
          cnf_45kg: freightData.cnf_45kg,
          cnf_100kg: freightData.cnf_100kg,
          cnf_300kg: freightData.cnf_300kg,
          cnf_500kg: freightData.cnf_500kg,
          freight_cost_20ft: freightData.freight_cost_20ft,
          cnf_20ft: freightData.cnf_20ft,
          freight_cost_40ft: freightData.freight_cost_40ft,
          cnf_40ft: freightData.cnf_40ft,
        };

        const res = await fetch(`${API_URL}/api/exportcustomer-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) successCount++;
        else {
          const errData = await res.json();
          console.error("Failed:", errData);
          errorCount++;
        }
      }

      setShowBulkModal(false);
      setBulkMode(false);
      setSelectedProductIds(new Set());

      let msg = `✅ Added ${successCount} item(s) successfully.`;
      if (skipCount > 0)
        msg += `\n⚠️ ${skipCount} item(s) skipped (already exist).`;
      if (errorCount > 0) msg += `\n❌ ${errorCount} item(s) failed.`;
      alert(msg);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBulkSubmitting(false);
    }
  };

  /* ── PDF Download ── */
  const handleDownloadPDF = async () => {
    if (filteredItems.length === 0) {
      alert("No products to download");
      return;
    }
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const NAVY = [13, 71, 161];
      const NAVY_DARK = [8, 47, 114];
      const NAVY_LIGHT = [224, 232, 247];
      const WHITE = [255, 255, 255];
      const DARK = [20, 20, 40];
      const GREY_LINE = [180, 200, 230];

      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 40, "F");
      try {
        doc.addImage(logoSrc, "PNG", margin, 6, 36, 28);
      } catch {
        /* no logo */
      }
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

      doc.setFillColor(...NAVY_LIGHT);
      doc.rect(0, 40, pageW, 16, "F");
      doc.setDrawColor(...GREY_LINE);
      doc.setLineWidth(0.3);
      doc.line(0, 40, pageW, 40);
      doc.line(0, 56, pageW, 56);
      doc.setTextColor(...DARK);
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      doc.text("Generated:", margin, 50);
      doc.setFont(undefined, "normal");
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        margin + 22,
        50,
      );
      const filterLabel =
        selectedSpeciesType === "all"
          ? "All Species"
          : formatSpeciesType(selectedSpeciesType);
      doc.setFont(undefined, "bold");
      doc.text("Filter:", margin + 90, 50);
      doc.setFont(undefined, "normal");
      doc.text(filterLabel, margin + 102, 50);

      const imageCache = {};
      const fetchImageAsBase64 = async (imagePath) => {
        if (!imagePath) return null;
        if (imageCache[imagePath]) return imageCache[imagePath];
        try {
          const url = imagePath.startsWith("http")
            ? imagePath
            : `${API_URL}${imagePath}`;
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              imageCache[imagePath] = reader.result;
              resolve(reader.result);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };
      const allImagePaths = [
        ...new Set(filteredItems.map((p) => p.image_url).filter(Boolean)),
      ];
      await Promise.all(allImagePaths.map((img) => fetchImageAsBase64(img)));

      const drawImgPlaceholder = (x, y, w, h) => {
        doc.setFillColor(232, 238, 252);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        doc.setDrawColor(...GREY_LINE);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, w, h, 2, 2, "S");
        const cx = x + w / 2,
          cy = y + h / 2;
        doc.setDrawColor(25, 100, 200);
        doc.setLineWidth(0.5);
        doc.circle(cx, cy - 1, Math.min(w, h) * 0.2, "S");
        doc.setLineWidth(0.3);
        doc.rect(cx - w * 0.2, cy - h * 0.22, w * 0.4, h * 0.35, "S");
        doc.setFontSize(5);
        doc.setTextColor(25, 100, 200);
        doc.setFont(undefined, "normal");
        doc.text("No Image", cx, cy + h * 0.28, { align: "center" });
      };

      const PRODUCT_ORDER = [
        "freshwater scampi",
        "mud crab",
        "flowery",
        "vannamei",
        "vannami",
        "white prawn",
        "thilapia",
        "tilapia",
        "oyster",
        "green mussel",
        "green mussle",
        "short neck clam",
        "mangrove clam",
        "tuna h&g as",
        "tuna h&g",
        "tuna loin aaa skin on",
        "tuna loin aaa skin off",
        "tuna loin aa skin on",
        "tuna loin aa skin off",
        "tuna aa steak",
        "tuna loin a skin on",
        "tuna loin a skin off",
        "tuna a steak",
        "tuna loin b+ skin on",
        "tuna loin b+ skin off",
        "sword halfmoon skin on",
        "sword fish halfmoon skin off",
        "sword qm skin on",
        "barracuda",
        "barramundi",
        "bonito",
        "cobia",
        "indian mackerel",
        "indian maceral",
        "king fish",
        "red snapper",
        "black spotted snapper",
        "pearl spot",
        "ribbon fish",
        "sole fish",
        "threadfin bream",
        "travelly whole",
        "parrot",
        "sea bream",
        "sea bram",
        "spotted grouper",
        "blubber",
        "yellowtail fusilier",
        "emporer",
        "emperor",
        "red spot emporer",
        "red mullet",
        "mahi mahi",
        "indian salmon",
        "blue spotted",
        "pinjalo",
        "job fish",
        "red snapper skin on fillet",
        "grouper skin on fillet",
        "barramundi skin on fillet",
        "mahi mahi skin on fillet",
        "marlin loin",
      ];

      const getSortIndex = (commonName) => {
        const lower = (commonName || "").toLowerCase();
        const idx = PRODUCT_ORDER.findIndex((key) => lower.includes(key));
        return idx === -1 ? 9999 : idx;
      };

      const tableBody = [];
      const allProductsMap = {};
      filteredItems.forEach((product) => {
        const key = product.common_name;
        if (!allProductsMap[key])
          allProductsMap[key] = { product, variants: [] };
        if (product.variants?.length > 0)
          allProductsMap[key].variants.push(...product.variants);
      });

      const sortedProducts = Object.entries(allProductsMap).sort(
        ([nameA], [nameB]) => getSortIndex(nameA) - getSortIndex(nameB),
      );

      sortedProducts.forEach(([commonName, { product, variants }]) => {
        if (variants.length > 0) {
          variants.forEach((variant, vIdx) => {
            const fob = calcFobUSD(variant, currentUsdRate);
            tableBody.push({
              isFirstOfGroup: vIdx === 0,
              commonName,
              scientificName: product.scientific_name || "—",
              image: product.image_url || null,
              size: variant.size || "—",
              fobUSD: fob >= 0.01 ? `$${fob.toFixed(2)}` : "—",
            });
          });
        } else {
          tableBody.push({
            isFirstOfGroup: true,
            commonName,
            scientificName: product.scientific_name || "—",
            image: product.image_url || null,
            size: "—",
            fobUSD: "—",
          });
        }
      });

      const bodyRows = tableBody.map((row) => [
        "",
        row.isFirstOfGroup ? row.commonName : "",
        row.isFirstOfGroup ? row.scientificName : "",
        row.size,
        row.fobUSD,
      ]);

      autoTable(doc, {
        startY: 62,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: "Picture", styles: { halign: "center" } },
            { content: "Common Name", styles: { halign: "left" } },
            { content: "Scientific Name", styles: { halign: "left" } },
            { content: "Size", styles: { halign: "left" } },
            { content: "FOB (USD)", styles: { halign: "right" } },
          ],
        ],
        body: bodyRows,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 32, halign: "center", valign: "middle" },
          1: {
            cellWidth: 80,
            halign: "left",
            valign: "middle",
            fontStyle: "bold",
            fontSize: 10,
          },
          2: {
            cellWidth: 65,
            halign: "left",
            valign: "middle",
            fontStyle: "italic",
            fontSize: 9,
            textColor: [50, 80, 150],
          },
          3: { cellWidth: 45, halign: "left", valign: "middle", fontSize: 10 },
          4: { cellWidth: 40, halign: "right", valign: "middle" },
        },
        headStyles: {
          fillColor: NAVY_DARK,
          textColor: WHITE,
          fontStyle: "bold",
          fontSize: 10,
          cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
          minCellHeight: 20,
          textColor: DARK,
          lineColor: GREY_LINE,
          lineWidth: 0.3,
        },
        willDrawCell: (data) => {
          if (data.section !== "body") return;
          const row = tableBody[data.row.index];
          if (!row) return;
          if (!row.isFirstOfGroup && data.column.index <= 2)
            data.cell.styles.lineWidth = {
              top: 0,
              bottom: 0.3,
              left: 0.3,
              right: 0.3,
            };
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.index !== 0) return;
          const row = tableBody[data.row.index];
          if (!row || !row.isFirstOfGroup) return;
          const imgW = 18,
            imgH = 18;
          const x = data.cell.x + (data.cell.width - imgW) / 2;
          const y = data.cell.y + (data.cell.height - imgH) / 2;
          const imgSrc = row.image ? imageCache[row.image] : null;
          if (imgSrc) {
            const fmt = imgSrc.includes("image/png") ? "PNG" : "JPEG";
            try {
              doc.addImage(imgSrc, fmt, x, y, imgW, imgH, undefined, "FAST");
            } catch {
              drawImgPlaceholder(x, y, imgW, imgH);
            }
          } else drawImgPlaceholder(x, y, imgW, imgH);
        },
      });

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
      doc.save(
        `Export_Product_List_Sea_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error(err);
      alert(
        "Error generating PDF. Ensure jspdf and jspdf-autotable are installed.",
      );
    }
  };

  const adminUser = isAdmin();

  return (
    <div className="pricelist-container">
      <h2>Export Product List - Sea</h2>

      <div className="add-section">
        {adminUser && (
          <button className="apf-btn" onClick={navigateForm}>
            + Add Product
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
          ⬇ Download PDF
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

      <div className="species-filter">
        {speciesTypes.map((type) => {
          const count = getSpeciesTypeCount(type.value);
          return (
            <button
              key={type.value}
              className={`species-pill ${selectedSpeciesType === type.value ? "active" : ""}`}
              onClick={() => setSelectedSpeciesType(type.value)}
              disabled={count === 0 && type.value !== "all"}
            >
              <span className="species-icon">{type.icon}</span>
              <span className="species-label">{type.label}</span>
              <span className="species-count">({count})</span>
            </button>
          );
        })}
      </div>

      {loading && <div className="info">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="filter-info">
            Showing <strong>{filteredItems.length}</strong>{" "}
            {selectedSpeciesType === "all"
              ? "products"
              : formatSpeciesType(selectedSpeciesType)}
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
                  <th>JC FOB Price</th>
                  <th>FOB (USD)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedProductsBySection).map((section) => {
                  if (!sectionHasProducts(section)) return null;
                  const sectionProducts = groupedProductsBySection[section];
                  return (
                    <React.Fragment key={section}>
                      <tr className="section-header">
                        <td
                          colSpan={bulkMode ? 11 : 10}
                          className="section-title"
                        >
                          <span className="section-icon">
                            {section === "Fish" && "🐟"}
                            {section === "Crab" && "🦀"}
                            {section === "Prawn" && "🦐"}
                            {section === "Scampi/Lobster" && "🦞"}
                            {section === "Octopus" && "🐙"}
                            {section === "Clams" && "🐚"}
                            {section === "Oysters" && "🦪"}
                            {section === "Mussels" && "🐚"}
                            {section === "Giant Freshwater Prawn" && "🦐"}
                            {section === "Other" && "📦"}
                          </span>
                          {section}
                        </td>
                      </tr>

                      {Object.entries(sectionProducts).map(
                        ([commonName, products]) => {
                          const groupRowSpan = getTotalRowsForGroup(products);
                          const firstProduct = products[0];
                          const imgSrc = getImageUrl(firstProduct.image_url);
                          const isSelected = selectedProductIds.has(
                            firstProduct.id,
                          );
                          let isFirstRowOfGroup = true;

                          return products.map((product) => {
                            const variants = product.variants || [];

                            if (variants.length > 0) {
                              return variants.map((variant, variantIndex) => {
                                const isVeryFirstRow =
                                  isFirstRowOfGroup && variantIndex === 0;
                                const isFirstOfProduct = variantIndex === 0;
                                if (isVeryFirstRow) isFirstRowOfGroup = false;

                                return (
                                  <tr
                                    key={`${product.id}-${variant.id || variantIndex}`}
                                    className={
                                      isVeryFirstRow
                                        ? "product-group-start"
                                        : ""
                                    }
                                  >
                                    {bulkMode && isVeryFirstRow && (
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
                                    {isVeryFirstRow && (
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
                                      </>
                                    )}
                                    {isFirstOfProduct && (
                                      <td rowSpan={variants.length}>
                                        <span
                                          className={`category-badge ${getCategoryBadgeClass(product.category)}`}
                                        >
                                          {getCategoryBadgeIcon(
                                            product.category,
                                          )}{" "}
                                          {formatCategory(product.category)}
                                        </span>
                                      </td>
                                    )}
                                    <td>{variant.size || "—"}</td>
                                    <td className="price-cell">
                                      {parseFloat(variant.purchasing_price) > 0
                                        ? `Rs. ${parseFloat(variant.purchasing_price).toFixed(2)}`
                                        : "—"}
                                    </td>
                                    <td className="price-cell">
                                      {parseFloat(variant.jc_fob) > 0
                                        ? `$${parseFloat(variant.jc_fob).toFixed(2)}`
                                        : "—"}
                                    </td>
                                    {/* ── FOB column — model-aware ── */}
                                    <td className="price-cell">
                                      {(() => {
                                        const fob = calcFobUSD(
                                          variant,
                                          currentUsdRate,
                                        );
                                        return fob >= 0.01
                                          ? `$${fob.toFixed(2)}`
                                          : "—";
                                      })()}
                                    </td>
                                    {isFirstOfProduct && (
                                      <td
                                        className="actions-cell"
                                        rowSpan={variants.length}
                                      >
                                        <div className="actions-wrapper">
                                          <button
                                            className="btn-view"
                                            onClick={() =>
                                              navigate(
                                                `/exportproductdetail/${product.id}`,
                                              )
                                            }
                                          >
                                            View
                                          </button>
                                          {adminUser && (
                                            <button
                                              className="btn-edit"
                                              onClick={() =>
                                                navigateEdit(product.id)
                                              }
                                            >
                                              Edit
                                            </button>
                                          )}
                                          {adminUser && (
                                            <button
                                              className="btn-delete"
                                              onClick={() =>
                                                handleDelete(
                                                  product.id,
                                                  product.common_name,
                                                )
                                              }
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                );
                              });
                            }

                            const isVeryFirstRow = isFirstRowOfGroup;
                            if (isVeryFirstRow) isFirstRowOfGroup = false;
                            return (
                              <tr
                                key={product.id}
                                className={
                                  isVeryFirstRow ? "product-group-start" : ""
                                }
                              >
                                {bulkMode && isVeryFirstRow && (
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
                                        toggleProductSelection(firstProduct.id)
                                      }
                                      style={{
                                        width: "18px",
                                        height: "18px",
                                        cursor: "pointer",
                                      }}
                                    />
                                  </td>
                                )}
                                {isVeryFirstRow && (
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
                                        {formatSpeciesType(
                                          firstProduct.species_type,
                                        )}
                                      </span>
                                    </td>
                                  </>
                                )}
                                <td>
                                  <span
                                    className={`category-badge ${getCategoryBadgeClass(product.category)}`}
                                  >
                                    {getCategoryBadgeIcon(product.category)}{" "}
                                    {formatCategory(product.category)}
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
                                          `/exportproductdetail/${product.id}`,
                                        )
                                      }
                                    >
                                      View
                                    </button>
                                    <button
                                      className="btn-edit"
                                      onClick={() => navigateEdit(product.id)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="btn-delete"
                                      onClick={() =>
                                        handleDelete(
                                          product.id,
                                          product.common_name,
                                        )
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        },
                      )}
                    </React.Fragment>
                  );
                })}

                {Object.keys(groupedProductsBySection).filter((s) =>
                  sectionHasProducts(s),
                ).length === 0 && (
                  <tr>
                    <td
                      colSpan={bulkMode ? 11 : 10}
                      className="muted"
                      style={{ textAlign: "center", padding: "3rem" }}
                    >
                      {selectedSpeciesType === "all"
                        ? "No items found"
                        : `No ${formatSpeciesType(selectedSpeciesType)} found`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Bulk Add Modal ── */}
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
                🚢 Add Export Products to Customer
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                {bulkItems.length} variant(s) from {selectedProductIds.size}{" "}
                product(s) — freight costs calculated from customer's sea
                freight rates
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
                  <option key={c.cus_id} value={c.cus_id}>
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
                      "Ex-Factory (Rs)",
                      "FOB (USD)",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 10px",
                          textAlign: h.includes("(") ? "right" : "left",
                          color: "#475569",
                          fontWeight: 600,
                          borderBottom: "1px solid #e2e8f0",
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
                        {item.purchasing_price > 0
                          ? `Rs. ${item.purchasing_price.toFixed(2)}`
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          color: "#374151",
                        }}
                      >
                        {item.exfactoryprice > 0
                          ? `Rs. ${item.exfactoryprice.toFixed(2)}`
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: "#0d47a1",
                        }}
                      >
                        {item.fob_usd_display > 0
                          ? `$${item.fob_usd_display.toFixed(4)}`
                          : "—"}
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

export default ExportProductlist;
