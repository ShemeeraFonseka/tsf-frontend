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

const ExportProductlist = () => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState("all");
  const [currentUsdRate, setCurrentUsdRate] = useState(null);

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`${API_URL}/api/usd-rate`)
      .then((res) => res.json())
      .then((data) => {
        if (data.rate) setCurrentUsdRate(data.rate);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSpeciesType === "all") {
      setFilteredItems(items);
    } else {
      setFilteredItems(
        items.filter(
          (item) =>
            item.species_type?.toLowerCase() ===
            selectedSpeciesType.toLowerCase(),
        ),
      );
    }
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

  const navigate = useNavigate();
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
      if (section.keywords.some((keyword) => commonName.includes(keyword))) {
        return section.name;
      }
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
      const section = getProductSection(product);
      grouped[section].push(product);
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

      // Header band
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

      // Sub-header strip
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

      // Image cache
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

      // Build table data (flat, sorted by PRODUCT_ORDER)
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

      // Flatten ALL products, group by common_name
      const allProductsMap = {};
      filteredItems.forEach((product) => {
        const key = product.common_name;
        if (!allProductsMap[key]) {
          allProductsMap[key] = { product, variants: [] };
        }
        if (product.variants?.length > 0) {
          allProductsMap[key].variants.push(...product.variants);
        }
      });

      // Sort by PRODUCT_ORDER
      const sortedProducts = Object.entries(allProductsMap).sort(
        ([nameA], [nameB]) => getSortIndex(nameA) - getSortIndex(nameB),
      );

      sortedProducts.forEach(([commonName, { product, variants }]) => {
        if (variants.length > 0) {
          variants.forEach((variant, vIdx) => {
            const rate = currentUsdRate || parseFloat(variant.usdrate) || 1;
            const base =
              parseFloat(variant.purchasing_price) > 0
                ? parseFloat(variant.purchasing_price)
                : (parseFloat(variant.jc_fob) || 0) * rate;
            const exFactory =
              base +
              ((parseFloat(variant.packing_cost) || 0) +
                (parseFloat(variant.labour_overhead) || 0) +
                (parseFloat(variant.profit) || 0)) *
                rate;
            const fob = exFactory / rate;

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
        "", // col 0: Picture
        row.isFirstOfGroup ? row.commonName : "", // col 1: Common Name
        row.isFirstOfGroup ? row.scientificName : "", // col 2: Scientific Name
        row.size, // col 3: Size
        row.fobUSD, // col 4: FOB (USD)
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
          if (!row.isFirstOfGroup && data.column.index <= 2) {
            data.cell.styles.lineWidth = {
              top: 0,
              bottom: 0.3,
              left: 0.3,
              right: 0.3,
            };
          }
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
          } else {
            drawImgPlaceholder(x, y, imgW, imgH);
          }
        },
      });

      // Footer on every page
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

  return (
    <div className="pricelist-container">
      <h2>Export Product List - Sea</h2>

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
          ⬇ Download PDF
        </button>
      </div>

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
                        <td colSpan={11} className="section-title">
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
                          let isFirstRowOfGroup = true;

                          return products.map((product) => {
                            const variants = product.variants || [];

                            // ── Product HAS variants ──
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

                                    {/* Purchase Price */}
                                    <td className="price-cell">
                                      {parseFloat(variant.purchasing_price) > 0
                                        ? `Rs. ${parseFloat(variant.purchasing_price).toFixed(2)}`
                                        : "—"}
                                    </td>

                                    {/* JC FOB Price */}
                                    <td className="price-cell">
                                      {parseFloat(variant.jc_fob) > 0
                                        ? `$${parseFloat(variant.jc_fob).toFixed(2)}`
                                        : "—"}
                                    </td>

                                    {/* FOB (USD) — live calculated */}
                                    <td className="price-cell">
                                      {(() => {
                                        const rate =
                                          currentUsdRate ||
                                          parseFloat(variant.usdrate) ||
                                          1;
                                        const base =
                                          parseFloat(variant.purchasing_price) >
                                          0
                                            ? parseFloat(
                                                variant.purchasing_price,
                                              )
                                            : (parseFloat(variant.jc_fob) ||
                                                0) * rate;
                                        const exFactory =
                                          base +
                                          ((parseFloat(variant.packing_cost) ||
                                            0) +
                                            (parseFloat(
                                              variant.labour_overhead,
                                            ) || 0) +
                                            (parseFloat(variant.profit) || 0)) *
                                            rate;
                                        const fob = exFactory / rate;
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

                            // ── Product has NO variants ──
                            const isVeryFirstRow = isFirstRowOfGroup;
                            if (isVeryFirstRow) isFirstRowOfGroup = false;

                            return (
                              <tr
                                key={product.id}
                                className={
                                  isVeryFirstRow ? "product-group-start" : ""
                                }
                              >
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
                                <td className="muted">—</td> {/* size */}
                                <td className="muted">—</td> {/* purchase */}
                                <td className="muted">—</td> {/* jc_fob */}
                                <td className="muted">—</td> {/* exfactory */}
                                <td className="muted">—</td> {/* fob usd */}
                                <td className="actions-cell">
                                  <div className="actions-wrapper">
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
                      colSpan={11}
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
    </div>
  );
};

export default ExportProductlist;
