import React, { useEffect, useState } from "react";
import "./Productlist.css";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSrc from "./logo.png";
import { isAdmin } from "../../hooks/useAuth";

const sf = (v, d = 0) => (isFinite(parseFloat(v)) ? parseFloat(v) : d);
const fmt = (v) => (!v ? "—" : v.charAt(0).toUpperCase() + v.slice(1));

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
      "king fish",
      "sword fish",
      "silver pomfret",
      "barramundi",
      "barracuda",
      "black spotted snapper",
      "blubber",
      "yellowtail fusilier",
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
  {
    name: "Mussels",
    keywords: ["mussle", "mussel", "brown mussle", "green mussle"],
  },
  { name: "Giant Freshwater Prawn", keywords: ["giant freshwater prawn"] },
];

const SECTION_ICONS = {
  Fish: "🐟",
  Crab: "🦀",
  Prawn: "🦐",
  "Scampi/Lobster": "🦞",
  Octopus: "🐙",
  Clams: "🐚",
  Oysters: "🦪",
  Mussels: "🐚",
  "Giant Freshwater Prawn": "🦐",
  Other: "📦",
};

const PRODUCT_ORDER = [
  "freshwater scampi",
  "mud crab",
  "flowery",
  "vannamei",
  "white prawn",
  "tilapia",
  "oyster",
  "green mussel",
  "short neck clam",
  "mangrove clam",
  "tuna h&g",
  "tuna loin aaa",
  "tuna loin aa",
  "tuna loin a",
  "tuna loin b+",
  "sword halfmoon",
  "sword fish",
  "sword qm",
  "barracuda",
  "barramundi",
  "bonito",
  "cobia",
  "indian mackerel",
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
  "spotted grouper",
  "blubber",
  "yellowtail fusilier",
  "emperor",
  "red mullet",
  "mahi mahi",
  "indian salmon",
  "pinjalo",
  "job fish",
  "marlin loin",
  "silver pomfret",
  "chinese pomfret",
  "grouper",
];

const getSortIndex = (name) => {
  const lower = (name || "").toLowerCase();
  const idx = PRODUCT_ORDER.findIndex((k) => lower.includes(k));
  return idx === -1 ? 9999 : idx;
};

const speciesTypes = [
  { value: "all", label: "All Products", icon: "🌊" },
  { value: "crustacean", label: "Crustacean", icon: "🦞" },
  { value: "fish", label: "Fish", icon: "🐟" },
];

// Sea FOB = exfactoryprice / usdrate (purchase price model)
// or jc_fob + profit + packing + labour (JC FOB model)
const calcFobUSD = (variant, usdRate) => {
  const rate = sf(usdRate || variant.usdrate, 1);
  if (sf(variant.jc_fob) > 0) {
    return (
      sf(variant.jc_fob) +
      sf(variant.profit) +
      sf(variant.packing_cost) +
      sf(variant.labour_overhead)
    );
  }
  return sf(variant.exfactoryprice) / rate;
};

export default function ExportProductlist() {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const adminUser = isAdmin();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpeciesType, setSelectedSpeciesType] = useState("all");
  const [currentUsdRate, setCurrentUsdRate] = useState(304);

  /* ── Add from Catalogue ── */
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [selectedCatProduct, setSelectedCatProduct] = useState(null);
  const [exportPricingRows, setExportPricingRows] = useState([]);
  const [usdRate, setUsdRate] = useState("304");
  const [savingExport, setSavingExport] = useState(false);

  /* ── Bulk add ── */
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [bulkCustomerId, setBulkCustomerId] = useState("");
  const [bulkItems, setBulkItems] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/exportproductlist`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data);
      setFilteredItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetch(`${API_URL}/api/usd-rate`)
      .then((r) => r.json())
      .then((d) => {
        if (d.rate) {
          setCurrentUsdRate(d.rate);
          setUsdRate(String(d.rate));
        }
      })
      .catch(() => {});
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

  /* ── Grouping ── */
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

  const sectionHasProducts = (s) =>
    Object.keys(groupedBySection[s] || {}).length > 0;
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
  const formatSpeciesType = (s) => {
    if (!s) return "-";
    const t = speciesTypes.find((x) => x.value === s.toLowerCase());
    return t ? t.label : fmt(s);
  };

  /* ── Add from Catalogue ── */
  const openCatalogueModal = async () => {
    setShowCatalogueModal(true);
    setSelectedCatProduct(null);
    setExportPricingRows([]);
    setCatalogueSearch("");
    setCatalogueLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/productlist`);
      setCatalogue(await res.json());
    } catch {
      setCatalogue([]);
    } finally {
      setCatalogueLoading(false);
    }
  };

  const blankSeaRow = (v) => ({
    variant_id: v.id,
    size: v.size,
    unit: v.unit,
    purchasing_price: sf(v.purchasing_price),
    model: "purchase",
    jc_fob: "",
    usdrate: usdRate,
    labour_overhead: "",
    packing_cost: "",
    profit: "",
    exfactoryprice: "",
    profit_margin: "",
    multiplier: "",
    divisor: "1",
  });

  const calcSeaRow = (row) => {
    const rate = sf(row.usdrate, 304);
    const profit = sf(row.profit);
    const labour = sf(row.labour_overhead);
    const packing = sf(row.packing_cost);
    let exFactory = 0,
      fobUSD = 0,
      pm = 0;
    if (row.model === "purchase" && sf(row.purchasing_price) > 0) {
      exFactory = sf(row.purchasing_price) + (labour + packing + profit) * rate;
      fobUSD = rate > 0 ? exFactory / rate : 0;
      pm = fobUSD > 0 ? (profit / fobUSD) * 100 : 0;
    } else if (row.model === "jc_fob" && sf(row.jc_fob) > 0) {
      const total = sf(row.jc_fob) + profit + packing + labour;
      exFactory = total * rate;
      fobUSD = total;
      pm = fobUSD > 0 ? (profit / fobUSD) * 100 : 0;
    }
    return {
      ...row,
      exfactoryprice: parseFloat(exFactory.toFixed(2)),
      profit_margin: parseFloat(pm.toFixed(4)),
    };
  };

  const selectCatalogueProduct = (product) => {
    setSelectedCatProduct(product);
    const existing = items.find(
      (p) =>
        p.common_name?.toLowerCase() === product.common_name?.toLowerCase(),
    );
    const rows = (product.variants || []).map((v) => {
      const ev = existing?.variants?.find(
        (ev) => String(ev.id) === String(v.id),
      );
      if (ev)
        return {
          variant_id: v.id,
          size: v.size,
          unit: v.unit,
          purchasing_price: sf(v.purchasing_price),
          model: sf(ev.jc_fob) > 0 ? "jc_fob" : "purchase",
          jc_fob: ev.jc_fob ?? "",
          usdrate: ev.usdrate ?? usdRate,
          labour_overhead: ev.labour_overhead ?? "",
          packing_cost: ev.packing_cost ?? "",
          profit: ev.profit ?? "",
          exfactoryprice: ev.exfactoryprice ?? "",
          profit_margin: ev.profit_margin ?? "",
          multiplier: ev.multiplier ?? "",
          divisor: ev.divisor ?? "1",
        };
      return blankSeaRow(v);
    });
    setExportPricingRows(rows);
  };

  const updateSeaRow = (idx, field, val) => {
    setExportPricingRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const rate = sf(field === "usdrate" ? val : row.usdrate, 304);
        let updated = { ...row, [field]: val };
        if (field === "usdrate" && updated.profit)
          updated.profit = updated.profit; // keep profit as-is in sea (stored in USD)
        return calcSeaRow(updated);
      }),
    );
  };

  const applyUsdRateToAll = (rate) =>
    setExportPricingRows((prev) =>
      prev.map((row) => calcSeaRow({ ...row, usdrate: rate })),
    );

  const saveSeaPricing = async () => {
    if (!selectedCatProduct) return;
    setSavingExport(true);
    try {
      const variants = exportPricingRows.map((r) => ({
        id: r.variant_id,
        size: r.size,
        unit: r.unit,
        purchasing_price: sf(r.purchasing_price),
        jc_fob: sf(r.jc_fob),
        usdrate: sf(r.usdrate, 304),
        labour_overhead: sf(r.labour_overhead),
        packing_cost: sf(r.packing_cost),
        profit: sf(r.profit),
        profit_margin: sf(r.profit_margin),
        exfactoryprice: sf(r.exfactoryprice),
        multiplier: sf(r.multiplier),
        divisor: sf(r.divisor, 1),
      }));

      const fd = new FormData();
      fd.append("common_name", selectedCatProduct.common_name);
      fd.append("scientific_name", selectedCatProduct.scientific_name || "");
      fd.append("description", selectedCatProduct.description || "");
      fd.append("species_type", selectedCatProduct.species_type || "");
      fd.append("existing_image_url", selectedCatProduct.image_url || "");
      fd.append("product_id", selectedCatProduct.id);
      if (selectedCatProduct.image_url)
        fd.append("image_url_direct", selectedCatProduct.image_url);
      fd.append("variants", JSON.stringify(variants));

      const existing = items.find(
        (p) =>
          p.common_name?.toLowerCase() ===
          selectedCatProduct.common_name?.toLowerCase(),
      );
      const res = existing
        ? await fetch(
            `${API_URL}/api/exportproductlist/upload/${existing.id}`,
            { method: "PUT", body: fd },
          )
        : await fetch(`${API_URL}/api/exportproductlist/upload`, {
            method: "POST",
            body: fd,
          });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to save");
      }
      alert(`✅ Export pricing saved for ${selectedCatProduct.common_name}`);
      setShowCatalogueModal(false);
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSavingExport(false);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Remove "${productName}" from the sea export list?`))
      return;
    try {
      const res = await fetch(`${API_URL}/api/exportproductlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* ── Bulk add ── */
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
      alert("Select at least one product.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/exportcustomerlist`);
      if (res.ok) setCustomers(await res.json());
    } catch {}
    const rows = [];
    filteredItems.forEach((product) => {
      if (!selectedProductIds.has(product.id)) return;
      (product.variants || []).forEach((variant) => {
        const fobUSD = calcFobUSD(variant, currentUsdRate);
        rows.push({
          key: `${product.id}-${variant.id}`,
          product_id: product.product_id || product.id,
          variant_id: variant.id ? Math.floor(parseFloat(variant.id)) : null,
          common_name: product.common_name,
          scientific_name: product.scientific_name || "",
          category: product.category,
          image_url: product.image_url || "",
          size_range: variant.size || "",
          purchasing_price: sf(variant.purchasing_price),
          exfactoryprice: sf(variant.exfactoryprice),
          usdrate: sf(variant.usdrate || currentUsdRate),
          jc_fob: sf(variant.jc_fob),
          profit: sf(variant.profit),
          packing_cost: sf(variant.packing_cost),
          labour_overhead: sf(variant.labour_overhead),
          fob_usd_display: parseFloat(fobUSD.toFixed(4)),
          fob_price: parseFloat(fobUSD.toFixed(4)),
          multiplier: sf(variant.multiplier),
          divisor: sf(variant.divisor, 1),
        });
      });
    });
    setBulkItems(rows);
    setBulkCustomerId("");
    setShowBulkModal(true);
  };

  const handleBulkSubmit = async () => {
    if (!bulkCustomerId) {
      alert("Select a customer.");
      return;
    }
    setBulkSubmitting(true);
    let success = 0,
      skip = 0,
      fail = 0;
    try {
      const existingRes = await fetch(
        `${API_URL}/api/exportcustomer-products/${bulkCustomerId}`,
      );
      const existingData = existingRes.ok ? await existingRes.json() : [];
      const existingKeys = new Set(
        existingData.map((e) => `${e.product_id}-${e.variant_id ?? "null"}`),
      );

      // Fetch sea freight rates for customer
      const custRes = await fetch(
        `${API_URL}/api/exportcustomerlist/${bulkCustomerId}`,
      );
      const custData = custRes.ok ? await custRes.json() : null;
      let seaRate = null;
      if (custData?.country) {
        const sfRes = await fetch(`${API_URL}/api/sea-freight-rates`);
        if (sfRes.ok) {
          const allRates = await sfRes.json();
          const matches = allRates.filter(
            (r) => r.country?.toLowerCase() === custData.country.toLowerCase(),
          );
          const sorted = custData.port_code
            ? matches
                .filter(
                  (r) =>
                    r.port_code?.toUpperCase() ===
                    custData.port_code.toUpperCase(),
                )
                .concat(matches)
            : matches;
          seaRate =
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date))[0] ||
            null;
        }
      }

      for (const item of bulkItems) {
        const dupKey = `${item.product_id}-${item.variant_id ?? "null"}`;
        if (existingKeys.has(dupKey)) {
          skip++;
          continue;
        }

        const fobUSD =
          item.jc_fob > 0
            ? item.jc_fob +
              item.profit +
              item.packing_cost +
              item.labour_overhead
            : item.usdrate > 0
              ? item.exfactoryprice / item.usdrate
              : 0;

        let fc20 = 0,
          fc40 = 0,
          cnf20 = 0,
          cnf40 = 0;
        if (seaRate) {
          fc20 = sf(seaRate.freight_per_kilo_20ft);
          fc40 = sf(seaRate.freight_per_kilo_40ft);
          cnf20 = parseFloat((fobUSD + fc20).toFixed(4));
          cnf40 = parseFloat((fobUSD + fc40).toFixed(4));
        }

        const res = await fetch(`${API_URL}/api/exportcustomer-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cus_id: parseInt(bulkCustomerId),
            product_id: item.product_id,
            variant_id: item.variant_id ?? null,
            common_name: item.common_name,
            scientific_name: item.scientific_name || null,
            category: item.category || null,
            image_url: item.image_url || null,
            size_range: item.size_range || "",
            purchasing_price: item.purchasing_price || 0,
            exfactoryprice: item.exfactoryprice || 0,
            export_doc: 0,
            transport_cost: 0,
            loading_cost: 0,
            airway_cost: 0,
            forwardHandling_cost: 0,
            freight_type: "sea",
            fob_price: parseFloat(fobUSD.toFixed(4)),
            multiplier: item.multiplier || 0,
            divisor: item.divisor || 1,
            freight_cost_45kg: 0,
            freight_cost_100kg: 0,
            freight_cost_300kg: 0,
            freight_cost_500kg: 0,
            cnf_45kg: 0,
            cnf_100kg: 0,
            cnf_300kg: 0,
            cnf_500kg: 0,
            freight_cost_20ft: fc20,
            cnf_20ft: cnf20,
            freight_cost_40ft: fc40,
            cnf_40ft: cnf40,
          }),
        });
        res.ok ? success++ : fail++;
      }
      let msg = `✅ Added ${success} item(s).`;
      if (skip) msg += `\n⚠️ ${skip} skipped.`;
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

  /* ── PDF ── */
  const handleDownloadPDF = async () => {
    if (filteredItems.length === 0) {
      alert("No products to download");
      return;
    }
    try {
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
      doc.setFillColor(...NAVY_LIGHT);
      doc.rect(0, 40, pageW, 16, "F");
      doc.setDrawColor(...GREY);
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
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        doc.setFontSize(5);
        doc.setTextColor(25, 100, 200);
        doc.text("No Image", x + w / 2, y + h / 2 + h * 0.28, {
          align: "center",
        });
      };

      const map = {};
      filteredItems.forEach((p) => {
        if (!map[p.common_name])
          map[p.common_name] = { product: p, variants: [] };
        if (p.variants?.length) map[p.common_name].variants.push(...p.variants);
      });
      const sorted = Object.entries(map).sort(
        ([a], [b]) => getSortIndex(a) - getSortIndex(b),
      );
      const tableBody = [];
      sorted.forEach(([commonName, { product, variants }]) => {
        if (variants.length)
          variants.forEach((v, i) =>
            tableBody.push({
              isFirst: i === 0,
              commonName,
              scientificName: product.scientific_name || "—",
              image: product.image_url || null,
              size: v.size || "—",
              fobUSD: `$${calcFobUSD(v, currentUsdRate).toFixed(2)}`,
            }),
          );
        else
          tableBody.push({
            isFirst: true,
            commonName,
            scientificName: product.scientific_name || "—",
            image: product.image_url || null,
            size: "—",
            fobUSD: "—",
          });
      });

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
        body: tableBody.map((r) => [
          "",
          r.isFirst ? r.commonName : "",
          r.isFirst ? r.scientificName : "",
          r.size,
          r.fobUSD,
        ]),
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
          lineColor: GREY,
          lineWidth: 0.3,
        },
        willDrawCell: (data) => {
          if (data.section !== "body") return;
          const r = tableBody[data.row.index];
          if (r && !r.isFirst && data.column.index <= 2)
            data.cell.styles.lineWidth = {
              top: 0,
              bottom: 0.3,
              left: 0.3,
              right: 0.3,
            };
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.index !== 0) return;
          const r = tableBody[data.row.index];
          if (!r || !r.isFirst) return;
          const imgW = 18,
            imgH = 18,
            x = data.cell.x + (data.cell.width - imgW) / 2,
            y = data.cell.y + (data.cell.height - imgH) / 2;
          const src = r.image ? imageCache[r.image] : null;
          if (src) {
            try {
              doc.addImage(
                src,
                src.includes("png") ? "PNG" : "JPEG",
                x,
                y,
                imgW,
                imgH,
                undefined,
                "FAST",
              );
            } catch {
              drawPlaceholder(x, y, imgW, imgH);
            }
          } else drawPlaceholder(x, y, imgW, imgH);
        },
      });

      const total = doc.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
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
        doc.text(`Page ${i} of ${total}`, pageW - margin, pageH - 4, {
          align: "right",
        });
      }
      doc.save(
        `Export_Product_List_Sea_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error(err);
      alert("Error generating PDF.");
    }
  };

  const filteredCatalogue = catalogue.filter((p) => {
    if (!catalogueSearch) return true;
    const q = catalogueSearch.toLowerCase();
    return (
      p.common_name?.toLowerCase().includes(q) ||
      p.scientific_name?.toLowerCase().includes(q)
    );
  });

  /* ══ RENDER ══ */
  return (
    <div className="pricelist-container">
      <h2>Export Product List — Sea 🚢</h2>

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
            background: "var(--accent-cyan,#0ea5e9)",
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
                  <th>Size</th>
                  <th>Purchase Price</th>
                  <th>JC FOB</th>
                  <th>FOB (USD)</th>
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
                            colSpan={bulkMode ? 10 : 9}
                            className="section-title"
                          >
                            <span className="section-icon">
                              {SECTION_ICONS[section] || "📦"}
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
                                  const fobUSD = calcFobUSD(
                                    variant,
                                    currentUsdRate,
                                  );
                                  return (
                                    <tr
                                      key={`${product.id}-${variant.id || vi}`}
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
                                      <td>{variant.size || "—"}</td>
                                      <td className="price-cell">
                                        {sf(variant.purchasing_price) > 0
                                          ? `Rs. ${sf(variant.purchasing_price).toFixed(2)}`
                                          : "—"}
                                      </td>
                                      <td className="price-cell">
                                        {sf(variant.jc_fob) > 0
                                          ? `$${sf(variant.jc_fob).toFixed(2)}`
                                          : "—"}
                                      </td>
                                      <td className="price-cell">
                                        {fobUSD > 0
                                          ? `$${fobUSD.toFixed(2)}`
                                          : "—"}
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
                                                  `/exportproductdetail/${product.id}`,
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
                                                  handleDelete(
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
                                    </>
                                  )}
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
                {![...sectionCategories.map((s) => s.name), "Other"].some((s) =>
                  sectionHasProducts(s),
                ) && (
                  <tr>
                    <td
                      colSpan={bulkMode ? 10 : 9}
                      className="muted"
                      style={{ textAlign: "center", padding: "3rem" }}
                    >
                      No products yet. Click "+ Add from Catalogue" to add
                      products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Add from Catalogue Modal ── */}
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
              maxWidth: "960px",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
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
                    ? `🚢 Set Export Pricing — ${selectedCatProduct.common_name}`
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
                    ? "Set export pricing per size for sea freight."
                    : "Select a product from the master catalogue."}
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
                      const inList = items.some(
                        (p) =>
                          p.common_name?.toLowerCase() ===
                          product.common_name?.toLowerCase(),
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
                            background: inList ? "#f0fdf4" : "#fff",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = inList
                              ? "#dcfce7"
                              : "#f8faff")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = inList
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
                              {(product.variants || []).length !== 1 ? "s" : ""}
                            </div>
                          </div>
                          {inList && (
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
              <>
                <div
                  style={{
                    padding: "12px 24px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f8faff",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
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
                    USD Rate (Rs.):
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={usdRate}
                    onChange={(e) => {
                      setUsdRate(e.target.value);
                      applyUsdRateToAll(e.target.value);
                    }}
                    style={{
                      width: "100px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                    }}
                  />
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
                  {exportPricingRows.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "#9ca3af",
                        padding: "32px",
                      }}
                    >
                      No sizes on this product. Add sizes from the master
                      catalogue first.
                    </div>
                  )}
                  {exportPricingRows.map((row, i) => (
                    <div
                      key={row.variant_id}
                      style={{
                        background: "#f8faff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "16px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#1e3a5f",
                          marginBottom: "12px",
                          fontSize: "14px",
                        }}
                      >
                        📦 {row.size} {row.unit}
                        {sf(row.exfactoryprice) > 0 && (
                          <span
                            style={{
                              marginLeft: "12px",
                              fontSize: "12px",
                              color: "#34d399",
                              fontWeight: 400,
                            }}
                          >
                            Ex-Factory: Rs.{sf(row.exfactoryprice).toFixed(2)}
                            {sf(row.usdrate) > 0 &&
                              ` | FOB: $${(sf(row.exfactoryprice) / sf(row.usdrate)).toFixed(2)}`}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        {[
                          ["purchase", "💰 Purchase Price"],
                          ["jc_fob", "📋 JC FOB"],
                        ].map(([m, label]) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => updateSeaRow(i, "model", m)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "6px",
                              border: `1.5px solid ${row.model === m ? "#10b981" : "#e2e8f0"}`,
                              background:
                                row.model === m
                                  ? "rgba(16,185,129,0.1)"
                                  : "#fff",
                              color: row.model === m ? "#10b981" : "#94a3b8",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4,1fr)",
                          gap: "10px",
                        }}
                      >
                        {row.model === "purchase" ? (
                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#475569",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              Purchase Price (Rs.)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={row.purchasing_price}
                              readOnly
                              style={{
                                width: "100%",
                                padding: "7px 10px",
                                borderRadius: "6px",
                                border: "1px solid #e2e8f0",
                                fontSize: "13px",
                                background: "#f1f5f9",
                                color: "#10b981",
                                fontWeight: 700,
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                        ) : (
                          <div>
                            <label
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#475569",
                                display: "block",
                                marginBottom: "4px",
                              }}
                            >
                              JC FOB (USD)
                            </label>
                            <input
                              type="number"
                              step="0.0001"
                              value={row.jc_fob}
                              onChange={(e) =>
                                updateSeaRow(i, "jc_fob", e.target.value)
                              }
                              style={{
                                width: "100%",
                                padding: "7px 10px",
                                borderRadius: "6px",
                                border: "1px solid #d1d5db",
                                fontSize: "13px",
                                boxSizing: "border-box",
                              }}
                              placeholder="0.0000"
                            />
                          </div>
                        )}
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Labour Overhead (USD)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.labour_overhead}
                            onChange={(e) =>
                              updateSeaRow(i, "labour_overhead", e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                            placeholder="0.0000"
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Packing Cost (USD)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.packing_cost}
                            onChange={(e) =>
                              updateSeaRow(i, "packing_cost", e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                            placeholder="0.0000"
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Profit (USD)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={row.profit}
                            onChange={(e) =>
                              updateSeaRow(i, "profit", e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                            placeholder="0.0000"
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Multiplier
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={row.multiplier}
                            onChange={(e) =>
                              updateSeaRow(i, "multiplier", e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#475569",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Divisor
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={row.divisor}
                            onChange={(e) =>
                              updateSeaRow(i, "divisor", e.target.value)
                            }
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #d1d5db",
                              fontSize: "13px",
                              boxSizing: "border-box",
                            }}
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#94a3b8",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Profit Margin %
                          </label>
                          <input
                            readOnly
                            value={
                              sf(row.profit_margin) > 0
                                ? `${sf(row.profit_margin).toFixed(2)}%`
                                : "—"
                            }
                            style={{
                              width: "100%",
                              padding: "7px 10px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              fontSize: "13px",
                              background: "#f1f5f9",
                              color: "#64748b",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                    onClick={saveSeaPricing}
                    disabled={savingExport || exportPricingRows.length === 0}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        savingExport || exportPricingRows.length === 0
                          ? "#9ca3af"
                          : "#0d47a1",
                      color: "#fff",
                      cursor:
                        savingExport || exportPricingRows.length === 0
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    {savingExport ? "Saving…" : "Save to Sea List"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Bulk Modal ── */}
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
                {bulkItems.length} variant(s) — sea freight costs calculated
                from customer's freight rates
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
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        {item.purchasing_price > 0
                          ? `Rs. ${item.purchasing_price.toFixed(2)}`
                          : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
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
                          ? `$${item.fob_usd_display.toFixed(2)}`
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
}
