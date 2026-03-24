import React, { useEffect, useState } from "react";
import "./Productlist.css";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSrc from "./logo.png";

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
/* ──────────────────────────────────────────────────────────────── */

const Productlist = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState("all");

  /* ── Bulk-add state ──────────────────────────────────────────── */
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [bulkCustomerId, setBulkCustomerId] = useState("");
  const [bulkItems, setBulkItems] = useState([]); // per-variant rows with editable margin
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  /* ──────────────────────────────────────────────────────────────── */

  const sectionCategories = [
    { name: "Oyster", keywords: ["oyster", "depurated oyster"] },
    {
      name: "Clams",
      keywords: [
        "clam",
        "clams",
        "pen clams",
        "short neck clams",
        "blood clams",
        "sea clams",
        "mangrove clams",
      ],
    },
    { name: "Mussel", keywords: ["mussel", "brown mussel", "green mussel"] },
    { name: "Crab", keywords: ["crab", "sea crab", "mud crab", "cut crab"] },
    {
      name: "Prawn",
      keywords: [
        "prawn",
        "flowery prawn",
        "black tiger",
        "white prawn",
        "lobster",
      ],
    },
    { name: "Scampi", keywords: ["scampi"] },
    { name: "Cuttlefish", keywords: ["cuttlefish", "squid"] },
    { name: "Octopus", keywords: ["octopus", "baby octopus"] },
    {
      name: "Fish",
      keywords: [
        "fish",
        "jack",
        "eel",
        "tuna",
        "tilapia",
        "mackerel",
        "rohu",
        "sardine",
        "mullet",
        "barramundi",
        "catla",
        "parrot",
        "red mullet",
        "scad",
        "mahi mahi",
        "anchovy",
        "snapper",
        "grouper",
        "seer",
        "salmon",
      ],
    },
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
    fetch(`${API_URL}/api/productlist`)
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

  // In fetchCustomers, log to confirm the shape:
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customerlist`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      console.log("Customers sample:", data[0]); // ← check field names here
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${productName}"? This will delete all variants as well.`,
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/api/productlist/${productId}`, {
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

  const navigateForm = () => navigate("/productform");
  const navigateEdit = (productId) => navigate(`/productform/${productId}`);

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

  /* ── Bulk-add handlers ───────────────────────────────────────── */
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
    await fetchCustomers();

    // Build bulk items — one row per variant of each selected product
    const rows = [];
    filteredItems.forEach((product) => {
      if (!selectedProductIds.has(product.id)) return;
      const variants = product.variants || [];
      if (variants.length > 0) {
        variants.forEach((variant) => {
          const profit = parseFloat(variant.profit) || 0;
          const purchasingPrice = parseFloat(variant.purchasing_price) || 0;
          const sellingPrice = purchasingPrice + profit;
          const marginPercentage =
            sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
          rows.push({
            key: `${product.id}-${variant.id}`,
            product_id: product.id,
            variant_id: variant.id,
            common_name: product.common_name,
            scientific_name: product.scientific_name || "",
            category: product.category,
            image_url: product.image_url || "",
            size_range: `${variant.size}`,
            purchasing_price: purchasingPrice,
            margin: profit,
            margin_percentage: parseFloat(marginPercentage.toFixed(2)),
            selling_price: parseFloat(sellingPrice.toFixed(2)),
          });
        });
      } else {
        // Product with no variants
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
          margin: 0,
          margin_percentage: 0,
          selling_price: 0,
        });
      }
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
        const pp = parseFloat(updated.purchasing_price) || 0;
        const margin = parseFloat(updated.margin) || 0;
        const marginPct = parseFloat(updated.margin_percentage) || 0;

        if (field === "margin") {
          const sp = pp + margin;
          updated.selling_price = parseFloat(sp.toFixed(2));
          updated.margin_percentage =
            sp > 0 ? parseFloat(((margin / sp) * 100).toFixed(2)) : 0;
        } else if (field === "margin_percentage") {
          const newMargin = (pp * marginPct) / (100 - marginPct);
          const sp = pp + newMargin;
          updated.margin = parseFloat(newMargin.toFixed(2));
          updated.selling_price = parseFloat(sp.toFixed(2));
        } else if (field === "selling_price") {
          const sp = parseFloat(value) || 0;
          const newMargin = sp - pp;
          updated.margin = parseFloat(newMargin.toFixed(2));
          updated.margin_percentage =
            sp > 0 ? parseFloat(((newMargin / sp) * 100).toFixed(2)) : 0;
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
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    try {
      // Fetch existing customer products to avoid duplicates
      const existingRes = await fetch(
        `${API_URL}/api/customer-products/${bulkCustomerId}`,
      );
      const existingData = existingRes.ok ? await existingRes.json() : [];

      // Normalize to string for safe comparison — handle null variant_id
      const existingKeys = new Set(
        existingData.map((e) => `${e.product_id}-${e.variant_id ?? "null"}`),
      );

      console.log("Existing keys:", [...existingKeys]);

      for (const item of bulkItems) {
        const dupKey = `${item.product_id}-${item.variant_id ?? "null"}`;
        console.log(
          "Checking:",
          dupKey,
          "→ duplicate:",
          existingKeys.has(dupKey),
        );

        if (existingKeys.has(dupKey)) {
          skipCount++;
          continue;
        }

        const payload = {
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
        };

        console.log("Posting payload:", payload);

        const res = await fetch(`${API_URL}/api/customer-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          const errData = await res.json();
          console.error("Failed to insert:", errData);
          errorCount++;
        }
      }

      let msg = `✅ Added ${successCount} item(s) successfully.`;
      if (skipCount > 0)
        msg += `\n⚠️ ${skipCount} item(s) skipped (already exist).`;
      if (errorCount > 0)
        msg += `\n❌ ${errorCount} item(s) failed — check console.`;
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
  /* ──────────────────────────────────────────────────────────────── */

  const PRODUCT_ORDER = [
    "white prawn",
    "black tiger frozen",
    "black tiger",
    "flowery prawn",
    "lobster frozen",
    "lobster",
    "sea crab fresh",
    "sea crab frozen",
    "sea crab",
    "cut crab fresh",
    "cut crab frozen",
    "cut crab",
    "scampi headless",
    "scampi claw",
    "scampi",
    "cuttlefish fresh whole",
    "cuttlefish whole cleaned",
    "cuttlefish fresh corn",
    "cuttlefish cleaned corn",
    "squid fresh cleaned",
    "squid",
    "baby octopus frozen",
    "baby octopus",
    "octopus frozen",
    "octopus",
    "yellow fin tuna",
    "seer fish",
    "barramundi",
    "scad",
    "trevally",
    "trevalley",
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
    "parrot fish",
    "premium norweigian salmon fillet",
    "premium norwegion smoke salmon",
    "salmon tail",
    "salmon ground",
    "tuna shashimi loins",
    "tuna loin grade a",
    "tuna loin grade b",
    "tuna shashimi cut",
    "tuna off cut",
    "tuna trimming",
    "tuna belly",
    "tuna",
    "catla",
    "rohu",
    "tilapia",
    "seafood mix",
    "claw meat packet",
    "clean prawns packet",
    "half shell mussel",
    "pen clam",
    "oyster can",
    "sea crab meat",
    "mud crab body",
    "mud crab claw",
    "mud crab lump",
    "mud crab jambo",
    "mud crab",
    "oyster meat",
    "oyster",
    "green mussel",
    "short neck clam",
    "mangrove clam",
    "blood clam",
    "brown mussel",
    "mussel",
  ];

  const getSortIndex = (commonName) => {
    const lower = (commonName || "").toLowerCase();
    const idx = PRODUCT_ORDER.findIndex((key) => lower.includes(key));
    return idx === -1 ? 9999 : idx;
  };

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
        doc.setFontSize(5);
        doc.setTextColor(25, 100, 200);
        doc.setFont(undefined, "normal");
        doc.text("No Image", cx, cy + h * 0.28, { align: "center" });
      };

      const allProductsMap = {};
      filteredItems.forEach((product) => {
        const key = product.common_name;
        if (!allProductsMap[key])
          allProductsMap[key] = { product, variants: [] };
        if (product.variants?.length > 0)
          allProductsMap[key].variants.push(...product.variants);
      });

      const sortedProducts = Object.values(allProductsMap).sort(
        (a, b) =>
          getSortIndex(a.product.common_name) -
          getSortIndex(b.product.common_name),
      );

      const tableBody = [];
      sortedProducts.forEach(({ product, variants }) => {
        if (variants.length > 0) {
          variants.forEach((variant, vIdx) => {
            tableBody.push({
              isFirstOfGroup: vIdx === 0,
              commonName: product.common_name,
              scientificName: product.scientific_name || "—",
              image: product.image_url || null,
              type: formatCategory(variant.category),
              size: variant.size || "—",
            });
          });
        } else {
          tableBody.push({
            isFirstOfGroup: true,
            commonName: product.common_name,
            scientificName: product.scientific_name || "—",
            image: product.image_url || null,
            type: formatCategory(product.category),
            size: "—",
          });
        }
      });

      const bodyRows = tableBody.map((row) => [
        "",
        row.isFirstOfGroup ? row.commonName : "",
        row.isFirstOfGroup ? row.scientificName : "",
        row.isFirstOfGroup ? row.type : "",
        row.size,
      ]);

      autoTable(doc, {
        startY: 62,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: "Picture", styles: { halign: "center" } },
            { content: "Common Name", styles: { halign: "left" } },
            { content: "Scientific Name", styles: { halign: "left" } },
            { content: "Type", styles: { halign: "left" } },
            { content: "Size", styles: { halign: "left" } },
          ],
        ],
        body: bodyRows,
        theme: "grid",
        columnStyles: {
          0: { cellWidth: 28, halign: "center", valign: "middle" },
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
          3: { cellWidth: 35, halign: "left", valign: "middle", fontSize: 10 },
          4: { cellWidth: 55, halign: "left", valign: "middle", fontSize: 10 },
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
          if (!row.isFirstOfGroup && data.column.index <= 3)
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
          "Tropical Shellfish (Pvt) Ltd  |  Prices subject to change without prior notice",
          pageW / 2,
          pageH - 4,
          { align: "center" },
        );
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 4, {
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
      doc.text("Price List - Selling Prices", margin, 50);
      doc.setFont(undefined, "normal");
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        margin + 52,
        50,
      );
      const filterLabel =
        selectedSpeciesType === "all"
          ? "All Species"
          : formatSpeciesType(selectedSpeciesType);
      doc.setFont(undefined, "bold");
      doc.text("Filter:", margin + 130, 50);
      doc.setFont(undefined, "normal");
      doc.text(filterLabel, margin + 142, 50);

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
        doc.setFontSize(5);
        doc.setTextColor(25, 100, 200);
        doc.setFont(undefined, "normal");
        doc.text("No Image", cx, cy + h * 0.28, { align: "center" });
      };

      const groupedByName = {};
      filteredItems.forEach((product) => {
        const key = product.common_name;
        if (!groupedByName[key])
          groupedByName[key] = {
            commonName: product.common_name,
            scientificName: product.scientific_name || "—",
            category: product.category,
            image: product.image_url || null,
            variants: [],
          };
        if (product.variants?.length > 0)
          groupedByName[key].variants.push(...product.variants);
      });

      const sortedProductNames = Object.keys(groupedByName).sort((a, b) => {
        const idxA = getSortIndex(a);
        const idxB = getSortIndex(b);
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b);
      });

      const tableBody = [];
      sortedProductNames.forEach((commonName) => {
        const product = groupedByName[commonName];
        if (product.variants.length > 0) {
          const sortedVariants = [...product.variants].sort(
            (a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0),
          );
          sortedVariants.forEach((variant, index) => {
            tableBody.push({
              isFirstOfGroup: index === 0,
              commonName: product.commonName,
              scientificName: product.scientificName,
              category: product.category,
              image: product.image,
              size: variant.size || "—",
              sellingPrice: variant.selling_price ?? null,
            });
          });
        } else {
          tableBody.push({
            isFirstOfGroup: true,
            commonName: product.commonName,
            scientificName: product.scientificName,
            category: product.category,
            image: product.image,
            size: "—",
            sellingPrice: null,
          });
        }
      });

      const bodyRows = tableBody.map((row) => [
        "",
        row.isFirstOfGroup ? row.commonName : "",
        row.isFirstOfGroup ? row.scientificName : "",
        row.isFirstOfGroup ? formatCategory(row.category) : "",
        row.size,
        row.sellingPrice != null
          ? `Rs. ${parseFloat(row.sellingPrice).toFixed(2)}`
          : "—",
      ]);

      autoTable(doc, {
        startY: 62,
        margin: { left: margin, right: margin },
        head: [
          [
            { content: "Picture", styles: { halign: "center" } },
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
            cellWidth: 28,
            halign: "center",
            valign: "middle",
            minCellHeight: 22,
          },
          1: {
            cellWidth: 60,
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
          3: { cellWidth: 30, halign: "left", valign: "middle", fontSize: 10 },
          4: { cellWidth: 50, halign: "left", valign: "middle", fontSize: 10 },
          5: {
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
          fontSize: 10,
          cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
          minCellHeight: 22,
          textColor: DARK,
          lineColor: GREY_LINE,
          lineWidth: 0.3,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        willDrawCell: (data) => {
          if (data.section !== "body") return;
          const row = tableBody[data.row.index];
          if (!row) return;
          if (!row.isFirstOfGroup && data.column.index <= 3)
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
          "Tropical Shellfish (Pvt) Ltd  |  Prices subject to change without prior notice",
          pageW / 2,
          pageH - 4,
          { align: "center" },
        );
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 4, {
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
  return (
    <div className="pricelist-container">
      <h2>Local Product List</h2>

      <div className="add-section">
        <button className="apf-btn" onClick={navigateForm}>
          + Add Product
        </button>
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
                  <th>Profit</th>
                  <th>Selling Price</th>
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
                            {section === "Oyster" && "🦪"}
                            {section === "Clams" && "🐚"}
                            {section === "Mussel" && "🦪"}
                            {section === "Crab" && "🦀"}
                            {section === "Prawn" && "🦐"}
                            {section === "Scampi" && "🦞"}
                            {section === "Cuttlefish" && "🐙"}
                            {section === "Octopus" && "🐙"}
                            {section === "Fish" && "🐟"}
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
                                    {/* Checkbox — only on first row of group */}
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
                                      Rs.&nbsp;
                                      {parseFloat(
                                        variant.purchasing_price,
                                      ).toFixed(2)}
                                    </td>
                                    <td className="price-cell">
                                      Rs.&nbsp;
                                      {parseFloat(variant.profit).toFixed(2)}
                                    </td>
                                    <td className="price-cell">
                                      Rs.&nbsp;
                                      {parseFloat(
                                        variant.selling_price,
                                      ).toFixed(2)}
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
                                                `/productdetail/${product.id}`,
                                              )
                                            }
                                          >
                                            View
                                          </button>
                                          <button
                                            className="btn-edit"
                                            onClick={() =>
                                              navigateEdit(product.id)
                                            }
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
                                    )}
                                  </tr>
                                );
                              });
                            }

                            // No variants
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
                                        navigate(`/productdetail/${product.id}`)
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

      {/* ── Bulk Add Modal ─────────────────────────────────────────── */}
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
            {/* Modal Header */}
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
                product(s) selected
              </p>
            </div>

            {/* Customer Selector */}
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

            {/* Items Table */}
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
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Size
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Purchase (Rs)
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Margin (Rs)
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Margin %
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        color: "#475569",
                        fontWeight: 600,
                      }}
                    >
                      Selling (Rs)
                    </th>
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
                        {item.purchasing_price.toFixed(2)}
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

            {/* Modal Footer */}
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
                {bulkSubmitting ? "Adding…" : `Add to Customer`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productlist;
