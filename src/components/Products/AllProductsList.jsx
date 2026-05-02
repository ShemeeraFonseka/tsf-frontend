import React, { useEffect, useState, useMemo } from "react";
import "./Productlist.css";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "../../hooks/useAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoSrc from "./logo.png";

const getSpeciesIcon = (s) => {
  if (!s) return "🌊";
  if (s.toLowerCase() === "fish") return "🐟";
  if (s.toLowerCase() === "crustacean") return "🦞";
  if (s.toLowerCase() === "mollusc") return "🐚";
  return "🌊";
};
const fmt = (v) => (!v ? "—" : v.charAt(0).toUpperCase() + v.slice(1));

export default function AllProductslist() {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();
  const adminUser = isAdmin();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("all");
  const [expandedIds, setExpandedIds] = useState(new Set());

  /* ── Fetch all products (master catalogue) ── */
  useEffect(() => {
    fetch(`${API_URL}/api/productlist`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []); // eslint-disable-line

  /* ── Derived filter options ── */
  const allSpecies = useMemo(
    () => [...new Set(items.map((p) => p.species_type).filter(Boolean))],
    [items],
  );

  /* ── Filtered list ── */
  const filtered = useMemo(
    () =>
      items.filter((p) => {
        if (
          filterSpecies !== "all" &&
          p.species_type?.toLowerCase() !== filterSpecies
        )
          return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !p.common_name?.toLowerCase().includes(q) &&
            !p.scientific_name?.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [items, filterSpecies, search],
  );

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: items.length,
      withVariants: items.filter((p) => p.variants?.length > 0).length,
    }),
    [items],
  );

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (productId, productName) => {
    if (
      !window.confirm(
        `Delete "${productName}"? This removes it from the master catalogue and all lists.`,
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/api/productlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setItems((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "/images/placeholder-seafood.png";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  /* ── PDF ── */
  const handleDownloadPDF = async () => {
    if (filtered.length === 0) {
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
      const M = 12;
      const NAVY = [8, 47, 114],
        NAVY2 = [13, 71, 161],
        WHITE = [255, 255, 255];
      const DARK = [15, 23, 42],
        SLATE = [71, 85, 105],
        OFF_W = [248, 250, 255],
        SEP = [203, 213, 225];

      doc.setFillColor(...NAVY);
      doc.rect(0, 0, pageW, 48, "F");
      try {
        doc.addImage(logoSrc, "PNG", M, 8, 34, 26);
      } catch {}
      doc.setTextColor(...WHITE);
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("TROPICAL SHELLFISH", M + 40, 22);
      doc.setFontSize(8.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(160, 200, 255);
      doc.text("PRIVATE LIMITED", M + 40, 28.5);
      doc.setTextColor(200, 220, 255);
      doc.text("Premium Seafood Exporters  ·  Sri Lanka", M + 40, 34.5);

      const titleX = pageW - M - 68;
      doc.setFillColor(255, 255, 255, 18);
      doc.roundedRect(titleX, 9, 68, 30, 3, 3, "F");
      doc.setDrawColor(100, 140, 210);
      doc.setLineWidth(0.5);
      doc.roundedRect(titleX, 9, 68, 30, 3, 3, "S");
      doc.setTextColor(180, 210, 255);
      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("PRODUCT CATALOGUE", titleX + 34, 22, { align: "center" });
      doc.setFontSize(7.5);
      doc.setFont(undefined, "normal");
      doc.setTextColor(200, 220, 255);
      doc.text(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        titleX + 34,
        29,
        { align: "center" },
      );
      doc.text(`${filtered.length} Products`, titleX + 34, 34.5, {
        align: "center",
      });

      const legendY = 48;
      doc.setFillColor(...NAVY2);
      doc.rect(0, legendY, pageW, 14, "F");

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
        [...new Set(filtered.map((p) => p.image_url).filter(Boolean))].map(
          fetchImg,
        ),
      );

      const drawPlaceholder = (x, y, w, h) => {
        doc.setFillColor(220, 230, 248);
        doc.roundedRect(x, y, w, h, 2, 2, "F");
        doc.setDrawColor(160, 185, 230);
        doc.setLineWidth(0.25);
        doc.roundedRect(x, y, w, h, 2, 2, "S");
        doc.setFontSize(11);
        doc.setTextColor(170, 195, 230);
        doc.text("🐟", x + w / 2, y + h / 2 + 2, { align: "center" });
      };

      const tableBody = filtered.map((product) => {
        const variants = product.variants || [];
        const rawSizes = [
          ...new Set(variants.map((v) => v.size).filter(Boolean)),
        ];
        return {
          image: product.image_url || null,
          common_name: product.common_name || "—",
          scientific_name: product.scientific_name || "—",
          sizes: rawSizes.length > 0 ? rawSizes.join(", ") : "—",
          species: fmt(product.species_type),
        };
      });

      autoTable(doc, {
        startY: legendY + 15,
        margin: { left: M, right: M },
        head: [
          [
            { content: "", styles: { halign: "center" } },
            { content: "COMMON NAME", styles: { halign: "left" } },
            { content: "SCIENTIFIC NAME", styles: { halign: "left" } },
            { content: "SIZES", styles: { halign: "left" } },
            { content: "SPECIES", styles: { halign: "center" } },
          ],
        ],
        body: tableBody.map((r) => [
          "",
          r.common_name,
          r.scientific_name,
          r.sizes,
          r.species,
        ]),
        theme: "plain",
        columnStyles: {
          0: { cellWidth: 32, halign: "center", valign: "middle" },
          1: {
            cellWidth: 65,
            halign: "left",
            valign: "middle",
            fontStyle: "bold",
            fontSize: 10,
            textColor: DARK,
          },
          2: {
            cellWidth: 68,
            halign: "left",
            valign: "middle",
            fontStyle: "italic",
            fontSize: 8.5,
            textColor: [60, 90, 160],
          },
          3: {
            cellWidth: "auto",
            halign: "left",
            valign: "middle",
            fontSize: 8.5,
            textColor: SLATE,
          },
          5: {
            cellWidth: 28,
            halign: "center",
            valign: "middle",
            fontSize: 9,
            textColor: SLATE,
          },
        },
        headStyles: {
          fillColor: NAVY2,
          textColor: WHITE,
          fontStyle: "bold",
          fontSize: 7.5,
          cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
          lineWidth: 0,
        },
        bodyStyles: {
          fontSize: 10,
          cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
          minCellHeight: 28,
          textColor: DARK,
          lineWidth: 0,
        },
        willDrawCell: (data) => {
          if (data.section !== "body") return;
          doc.setFillColor(
            ...(data.row.index % 2 === 0 ? OFF_W : [240, 245, 255]),
          );
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F",
          );
          doc.setDrawColor(...SEP);
          doc.setLineWidth(0.2);
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height,
          );
          if (data.column.index === 0) {
            doc.setFillColor(...NAVY2);
            doc.rect(M, data.cell.y, 2, data.cell.height, "F");
          }
        },
        didDrawCell: (data) => {
          if (data.section !== "body" || data.column.index !== 0) return;
          const row = tableBody[data.row.index];
          if (!row) return;
          const pad = 4,
            imgW = data.cell.width - pad * 2,
            imgH = data.cell.height - pad * 2,
            x = data.cell.x + pad,
            y = data.cell.y + pad;
          doc.setFillColor(240, 245, 255);
          doc.roundedRect(x, y, imgW, imgH, 2, 2, "F");
          const src = row.image ? imageCache[row.image] : null;
          if (src) {
            const f = src.includes("image/png") ? "PNG" : "JPEG";
            try {
              doc.addImage(src, f, x, y, imgW, imgH, undefined, "FAST");
            } catch {
              drawPlaceholder(x, y, imgW, imgH);
            }
          } else drawPlaceholder(x, y, imgW, imgH);
          doc.setDrawColor(180, 200, 230);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, y, imgW, imgH, 2, 2, "S");
        },
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        doc.setFillColor(...NAVY);
        doc.rect(0, pageH - 12, pageW, 12, "F");
        doc.setFillColor(...NAVY2);
        doc.rect(0, pageH - 12, pageW, 1.5, "F");
        doc.setTextColor(200, 220, 255);
        doc.setFontSize(6.5);
        doc.setFont(undefined, "normal");
        doc.text(
          "Tropical Shellfish (Pvt) Ltd  ·  Fresh & Frozen Seafood Exporters, Sri Lanka  ·  Prices subject to change without prior notice",
          pageW / 2,
          pageH - 5.5,
          { align: "center" },
        );
        doc.setTextColor(...WHITE);
        doc.setFont(undefined, "bold");
        doc.text(`${pg} / ${totalPages}`, pageW - M, pageH - 5.5, {
          align: "right",
        });
      }
      doc.save(
        `Tropical_Shellfish_Catalogue_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (err) {
      console.error(err);
      alert("Error generating PDF: " + err.message);
    }
  };

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="pricelist-container">
      <h2>All Products — Master Catalogue</h2>

      {/* ── Stats bar ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "Total", value: stats.total, color: "var(--text-primary)" },

          {
            label: "With Sizes",
            value: stats.withVariants,
            color: "var(--text-muted)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              padding: "10px 16px",
              minWidth: "90px",
            }}
          >
            <div
              style={{ fontSize: "22px", fontWeight: "800", color: s.color }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "16px",
          alignItems: "center",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by name…"
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "13px",
            minWidth: "200px",
            flex: "1",
          }}
        />

        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
        >
          <option value="all">All Species</option>
          {allSpecies.map((s) => (
            <option key={s} value={s.toLowerCase()}>
              {fmt(s)}
            </option>
          ))}
        </select>

        {adminUser && (
          <button
            className="apf-btn"
            onClick={() => navigate("/productform")}
            style={{ whiteSpace: "nowrap" }}
          >
            + Add Product
          </button>
        )}
        <button
          className="apf-btn"
          onClick={handleDownloadPDF}
          disabled={filtered.length === 0}
          style={{
            background: "var(--accent-cyan, #0ea5e9)",
            whiteSpace: "nowrap",
          }}
        >
          ⬇ Download PDF
        </button>
      </div>

      <div
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          marginBottom: "12px",
        }}
      >
        Showing{" "}
        <strong style={{ color: "var(--text-primary)" }}>
          {filtered.length}
        </strong>{" "}
        of {items.length} products
      </div>

      {loading && <div className="info">Loading…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="pricelist-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}></th>
                <th>Picture</th>
                <th>Common Name</th>
                <th>Scientific Name</th>
                <th>Species</th>
                <th>Sizes</th>
                <th>Purchasing Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="muted"
                    style={{ textAlign: "center", padding: "3rem" }}
                  >
                    No products found
                  </td>
                </tr>
              )}

              {filtered.map((product) => {
                const isExpanded = expandedIds.has(product.id);
                const variants = product.variants || [];

                return (
                  <React.Fragment key={product.id}>
                    <tr
                      className="product-group-start"
                      style={{
                        cursor: variants.length > 0 ? "pointer" : "default",
                      }}
                      onClick={() =>
                        variants.length > 0 && toggleExpand(product.id)
                      }
                    >
                      {/* Expand toggle */}
                      <td
                        style={{
                          textAlign: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          userSelect: "none",
                        }}
                      >
                        {variants.length > 0 ? (isExpanded ? "▼" : "▶") : ""}
                      </td>

                      {/* Image */}
                      <td className="thumb-cell">
                        <img
                          src={getImageUrl(product.image_url)}
                          alt={product.common_name}
                          className="thumb"
                          onError={(e) => {
                            e.target.src = "/images/placeholder-seafood.png";
                          }}
                        />
                      </td>

                      {/* Common name */}
                      <td
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {product.common_name}
                      </td>

                      {/* Scientific name */}
                      <td className="scientific">
                        {product.scientific_name || "—"}
                      </td>

                      {/* Species */}
                      <td>
                        <span style={{ fontSize: "12px" }}>
                          {getSpeciesIcon(product.species_type)}{" "}
                          {fmt(product.species_type)}
                        </span>
                      </td>

                      {/* Sizes count */}
                      <td>
                        <span
                          style={{
                            fontSize: "12px",
                            color:
                              variants.length > 0
                                ? "var(--accent-cyan)"
                                : "var(--text-muted)",
                            fontWeight: variants.length > 0 ? "700" : "400",
                          }}
                        >
                          {variants.length > 0
                            ? `${variants.length} size${variants.length > 1 ? "s" : ""}`
                            : "None"}
                        </span>
                      </td>

                      {/* Purchasing price range */}
                      <td>
                        {variants.length > 0 ? (
                          (() => {
                            const prices = variants
                              .map((v) => parseFloat(v.purchasing_price))
                              .filter((p) => p > 0);
                            if (prices.length === 0)
                              return <span className="muted">—</span>;
                            const min = Math.min(...prices),
                              max = Math.max(...prices);
                            return (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-primary)",
                                }}
                              >
                                Rs.{" "}
                                {min === max
                                  ? min.toFixed(2)
                                  : `${min.toFixed(2)} – ${max.toFixed(2)}`}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="actions-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="actions-wrapper">
                          {adminUser && (
                            <button
                              className="btn-edit"
                              onClick={() =>
                                navigate(`/productform/${product.id}`)
                              }
                            >
                              Edit
                            </button>
                          )}
                          {adminUser && (
                            <button
                              className="btn-delete"
                              onClick={() =>
                                handleDelete(product.id, product.common_name)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded variant rows ── */}
                    {isExpanded &&
                      variants.map((v, vi) => (
                        <tr
                          key={`${product.id}-v-${v.id || vi}`}
                          style={{
                            background: "var(--bg-deep)",
                            borderTop: "none",
                          }}
                        >
                          <td colSpan={2}></td>
                          <td
                            colSpan={2}
                            style={{
                              paddingLeft: "24px",
                              fontSize: "12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "600",
                                color: "var(--text-primary)",
                              }}
                            >
                              {v.size || "—"}
                            </span>
                            {v.unit && (
                              <span style={{ marginLeft: "4px" }}>
                                {v.unit}
                              </span>
                            )}
                          </td>
                          <td colSpan={5}>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--text-primary)",
                              }}
                            >
                              Rs.{" "}
                              {parseFloat(v.purchasing_price || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
