// pages/InvoicePages.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../Products/Productlist.css";

const API_URL = process.env.REACT_APP_API_URL;

const STATUS_STYLES = {
  draft: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.3)",
    label: "Draft",
  },
  sent: {
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.3)",
    label: "Sent",
  },
  paid: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.1)",
    border: "rgba(74,222,128,0.3)",
    label: "Paid",
  },
  cancelled: {
    color: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.3)",
    label: "Cancelled",
  },
};
const STATUS_ICONS = { draft: "📝", sent: "📤", paid: "✅", cancelled: "❌" };
const UNITS = ["kg", "g", "pcs", "box", "tray", "dozen", "litre", "pack"];

// ─────────────────────────────────────────────────────────────────────────────
// PDF GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
async function downloadInvoicePDF(inv) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 16;

  const NAVY = [13, 71, 161];
  const NAVYD = [8, 47, 114];
  const NAVYL = [224, 232, 247];
  const WHITE = [255, 255, 255];
  const DARK = [20, 20, 40];
  const GREY = [180, 200, 230];

  const items = inv.invoice_items || [];

  /* ── HEADER ── */
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(0, 0, pageW, 44, "F");

  try {
    const logo = await import("./logo.png");
    doc.addImage(logo.default, "PNG", M, 7, 30, 28);
  } catch {
    /* no logo */
  }

  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(16);
  doc.text("Tropical Shellfish (Pvt) Ltd", M + 36, 18);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8.5);
  doc.text("Fresh & Frozen Seafood Exporters  ·  Sri Lanka", M + 36, 25);
  doc.setFontSize(7.5);
  doc.text("info@tropicalshellfish.lk", M + 36, 31);

  // INVOICE badge
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text("INVOICE", pageW - M - 19, 18, { align: "center" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.text(inv.invoice_number, pageW - M - 19, 23, { align: "center" });

  /* ── META STRIP ── */
  doc.setFillColor(NAVYL[0], NAVYL[1], NAVYL[2]);
  doc.rect(0, 44, pageW, 18, "F");
  doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
  doc.setLineWidth(0.3);
  doc.line(0, 44, pageW, 44);
  doc.line(0, 62, pageW, 62);

  const metaItems = [
    ["Invoice No", inv.invoice_number],
    [
      "Invoice Date",
      inv.invoice_date
        ? new Date(inv.invoice_date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "—",
    ],
    [
      "Due Date",
      inv.due_date
        ? new Date(inv.due_date).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "On Receipt",
    ],
    [
      "Status",
      (STATUS_STYLES[inv.status]?.label || inv.status || "Draft").toUpperCase(),
    ],
  ];
  const mColW = (pageW - M * 2) / metaItems.length;
  metaItems.forEach(([label, val], i) => {
    const x = M + i * mColW;
    doc.setTextColor(80, 100, 140);
    doc.setFont(undefined, "bold");
    doc.setFontSize(7.5);
    doc.text(label.toUpperCase(), x, 51);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont(undefined, "bold");
    doc.setFontSize(9);
    doc.text(String(val), x, 58);
  });

  /* ── BILL TO + SUMMARY ── */
  let y = 70;
  const halfW = (pageW - M * 2 - 8) / 2;
  const colR = M + halfW + 8;

  // Bill To
  doc.setTextColor(NAVYD[0], NAVYD[1], NAVYD[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  doc.text("BILL TO", M, y);
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.6);
  doc.line(M, y + 1.5, M + 20, y + 1.5);

  y += 7;
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(11);
  doc.text(inv.customer_name, M, y);
  y += 6;
  doc.setFont(undefined, "normal");
  doc.setFontSize(8.5);

  const custLines = [
    inv.customer_email,
    inv.customer_phone,
    [inv.customer_address, inv.customer_city, inv.customer_country]
      .filter(Boolean)
      .join(", "),
  ].filter(Boolean);
  custLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, halfW);
    doc.text(wrapped, M, y);
    y += wrapped.length * 4.5;
  });
  if (inv.payment_terms) {
    y += 2;
    doc.setFont(undefined, "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 100, 140);
    doc.text("Payment Terms:", M, y);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont(undefined, "normal");
    doc.text(inv.payment_terms, M + 28, y);
    y += 5;
  }
  if (inv.notes) {
    y += 2;
    doc.setFont(undefined, "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 100, 140);
    doc.text("Notes:", M, y);
    y += 4;
    doc.setFont(undefined, "normal");
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    const noteLines = doc.splitTextToSize(inv.notes, halfW);
    doc.text(noteLines, M, y);
    y += noteLines.length * 4.5;
  }

  // Summary box (right)
  const boxTop = 70;
  const boxH = 52;
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(colR, boxTop, halfW, boxH, 3, 3, "F");
  doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(colR, boxTop, halfW, boxH, 3, 3, "S");

  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.roundedRect(colR, boxTop, halfW, 8, 3, 3, "F");
  doc.rect(colR, boxTop + 4, halfW, 4, "F");
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(7.5);
  doc.text("ORDER SUMMARY", colR + halfW / 2, boxTop + 5.5, {
    align: "center",
  });

  const summaryRows = [
    ["Total Lines", `${items.length} item${items.length !== 1 ? "s" : ""}`],
    [
      "Total Quantity",
      `${items.reduce((s, i) => s + (parseFloat(i.quantity) || 0), 0).toFixed(2)} units`,
    ],
    ["Subtotal", `Rs. ${parseFloat(inv.subtotal || 0).toFixed(2)}`],
    ["Delivery", `Rs. ${parseFloat(inv.delivery_charges || 0).toFixed(2)}`],
    ["TOTAL (LKR)", `Rs. ${parseFloat(inv.total_amount || 0).toFixed(2)}`],
  ];
  let sy = boxTop + 13;
  summaryRows.forEach(([label, val], i) => {
    const rowY = sy + i * 8;
    const isFinal = i === summaryRows.length - 1;
    if (isFinal) {
      doc.setFillColor(NAVYD[0], NAVYD[1], NAVYD[2]);
      doc.rect(colR, rowY - 5, halfW, 10, "F");
      doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    } else {
      doc.setTextColor(80, 100, 140);
    }
    doc.setFont(undefined, isFinal ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.text(label, colR + 5, rowY);
    if (isFinal) doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    else doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont(undefined, "bold");
    doc.text(val, colR + halfW - 5, rowY, { align: "right" });
    if (!isFinal) {
      doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
      doc.setLineWidth(0.2);
      doc.line(colR + 4, rowY + 2.5, colR + halfW - 4, rowY + 2.5);
    }
  });

  /* ── ITEMS TABLE ── */
  const tblY = Math.max(y + 10, boxTop + boxH + 10);
  doc.setTextColor(NAVYD[0], NAVYD[1], NAVYD[2]);
  doc.setFont(undefined, "bold");
  doc.setFontSize(8);
  doc.text("ITEMS", M, tblY - 4);
  doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.setLineWidth(0.6);
  doc.line(M, tblY - 2.5, M + 14, tblY - 2.5);

  autoTable(doc, {
    startY: tblY,
    margin: { left: M, right: M },
    head: [
      [
        { content: "#", styles: { halign: "center" } },
        { content: "Description", styles: { halign: "left" } },
        { content: "Size / Grade", styles: { halign: "left" } },
        { content: "Qty", styles: { halign: "center" } },
        { content: "Unit", styles: { halign: "center" } },
        { content: "Unit Price (Rs.)", styles: { halign: "right" } },
        { content: "Amount (Rs.)", styles: { halign: "right" } },
      ],
    ],
    body: items
      .sort((a, b) => (a.line_number || 0) - (b.line_number || 0))
      .map((item, i) => [
        i + 1,
        item.description,
        item.size || "—",
        parseFloat(item.quantity).toFixed(2),
        item.unit || "kg",
        `Rs. ${parseFloat(item.unit_price).toFixed(2)}`,
        `Rs. ${parseFloat(item.total_price).toFixed(2)}`,
      ]),
    theme: "grid",
    columnStyles: {
      0: { cellWidth: 10, halign: "center", valign: "middle", fontSize: 8 },
      1: {
        cellWidth: 62,
        halign: "left",
        valign: "middle",
        fontStyle: "bold",
        fontSize: 9,
      },
      2: { cellWidth: 30, halign: "left", valign: "middle", fontSize: 8.5 },
      3: {
        cellWidth: 16,
        halign: "center",
        valign: "middle",
        fontSize: 9,
        fontStyle: "bold",
      },
      4: { cellWidth: 14, halign: "center", valign: "middle", fontSize: 8 },
      5: { cellWidth: 28, halign: "right", valign: "middle", fontSize: 8.5 },
      6: {
        cellWidth: 28,
        halign: "right",
        valign: "middle",
        fontSize: 9,
        fontStyle: "bold",
        textColor: [13, 71, 161],
      },
    },
    headStyles: {
      fillColor: [NAVYD[0], NAVYD[1], NAVYD[2]],
      textColor: [WHITE[0], WHITE[1], WHITE[2]],
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      textColor: [DARK[0], DARK[1], DARK[2]],
      lineColor: [GREY[0], GREY[1], GREY[2]],
      lineWidth: 0.3,
      minCellHeight: 12,
    },
    alternateRowStyles: { fillColor: [248, 251, 255] },
  });

  const tblEnd = doc.lastAutoTable.finalY;

  /* ── TOTALS BLOCK ── */
  const totW = 90;
  const totX = pageW - M - totW;
  let ty2 = tblEnd + 6;

  doc.setFillColor(245, 248, 255);
  doc.roundedRect(totX, ty2, totW, 38, 3, 3, "F");
  doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(totX, ty2, totW, 38, 3, 3, "S");
  ty2 += 7;

  const drawTotalRow = (label, val, highlight) => {
    doc.setFontSize(8.5);
    if (highlight) {
      doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.rect(totX, ty2 - 5, totW, 10, "F");
      doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
      doc.setFont(undefined, "bold");
    } else {
      doc.setTextColor(80, 100, 140);
      doc.setFont(undefined, "normal");
    }
    doc.text(label, totX + 6, ty2);
    if (!highlight) {
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      doc.setFont(undefined, "bold");
    }
    doc.text(val, totX + totW - 6, ty2, { align: "right" });
    if (!highlight) {
      doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
      doc.setLineWidth(0.2);
      doc.line(totX + 4, ty2 + 3, totX + totW - 4, ty2 + 3);
    }
    ty2 += 10;
  };

  drawTotalRow("Subtotal", `Rs. ${parseFloat(inv.subtotal || 0).toFixed(2)}`);
  drawTotalRow(
    "Delivery Charges",
    `Rs. ${parseFloat(inv.delivery_charges || 0).toFixed(2)}`,
  );
  drawTotalRow(
    "TOTAL AMOUNT",
    `Rs. ${parseFloat(inv.total_amount || 0).toFixed(2)}`,
    true,
  );

  /* ── PAYMENT + TERMS ── */
  const notesY = ty2 + 10;
  if (notesY < pageH - 40) {
    doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
    doc.setLineWidth(0.3);
    doc.line(M, notesY, pageW - M, notesY);
    const bW = (pageW - M * 2 - 8) / 2;

    // Payment box
    doc.setFillColor(248, 251, 255);
    doc.roundedRect(M, notesY + 5, bW, 40, 2, 2, "F");
    doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, notesY + 5, bW, 40, 2, 2, "S");
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.roundedRect(M, notesY + 5, bW, 7, 2, 2, "F");
    doc.rect(M, notesY + 9, bW, 3, "F");
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont(undefined, "bold");
    doc.setFontSize(7.5);
    doc.text("PAYMENT DETAILS", M + bW / 2, notesY + 10, { align: "center" });
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFontSize(8);
    let py = notesY + 19;
    [
      ["Bank", "People's Bank / Commercial Bank"],
      ["Account", "Tropical Shellfish (Pvt) Ltd"],
      ["Branch", "Colombo"],
      ["Payment Terms", inv.payment_terms || "Due on receipt"],
    ].forEach(([k, v]) => {
      doc.setFont(undefined, "bold");
      doc.setTextColor(80, 100, 140);
      doc.text(k + ":", M + 4, py);
      doc.setFont(undefined, "normal");
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      doc.text(v, M + 30, py);
      py += 6;
    });

    // Terms box
    const tX2 = M + bW + 8;
    doc.setFillColor(248, 251, 255);
    doc.roundedRect(tX2, notesY + 5, bW, 40, 2, 2, "F");
    doc.setDrawColor(GREY[0], GREY[1], GREY[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(tX2, notesY + 5, bW, 40, 2, 2, "S");
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.roundedRect(tX2, notesY + 5, bW, 7, 2, 2, "F");
    doc.rect(tX2, notesY + 9, bW, 3, "F");
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont(undefined, "bold");
    doc.setFontSize(7.5);
    doc.text("TERMS & CONDITIONS", tX2 + bW / 2, notesY + 10, {
      align: "center",
    });
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont(undefined, "normal");
    doc.setFontSize(7.5);
    let pty = notesY + 19;
    [
      "· All prices are in Sri Lankan Rupees (LKR).",
      "· Payment due as per agreed terms.",
      "· Goods remain property of Tropical Shellfish",
      "  until full payment is received.",
      "· For queries, quote invoice number.",
    ].forEach((line) => {
      doc.text(line, tX2 + 4, pty);
      pty += 5;
    });
  }

  /* ── FOOTER ── */
  const totalPages = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, pageH - 10, pageW, 10, "F");
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    doc.text(
      "Tropical Shellfish (Pvt) Ltd  ·  Fresh & Frozen Seafood Exporters  ·  Sri Lanka",
      pageW / 2,
      pageH - 4.5,
      { align: "center" },
    );
    doc.text(`Page ${pg} / ${totalPages}`, pageW - M, pageH - 4.5, {
      align: "right",
    });
  }

  doc.save(
    `${inv.invoice_number}_${inv.customer_name?.replace(/\s+/g, "_")}.pdf`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY LINE ITEM
// ─────────────────────────────────────────────────────────────────────────────
const emptyItem = () => ({
  _key: Math.random().toString(36).slice(2),
  product_id: "", // selected product id
  description: "",
  size: "",
  quantity: "",
  unit: "kg",
  unit_price: "",
  total_price: "",
});

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE FORM — create or edit
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceForm({ existing, onSaved, onCancel }) {
  const isEdit = !!existing;
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    customer_name: existing?.customer_name || "",
    customer_email: existing?.customer_email || "",
    customer_phone: existing?.customer_phone || "",
    customer_address: existing?.customer_address || "",
    customer_city: existing?.customer_city || "",
    customer_country: existing?.customer_country || "",
    invoice_date: existing?.invoice_date || today,
    due_date: existing?.due_date || "",
    payment_terms: existing?.payment_terms || "Due on receipt",
    notes: existing?.notes || "",
    delivery_charges: existing?.delivery_charges || "0",
    status: existing?.status || "draft",
  });

  const [items, setItems] = useState(
    existing?.invoice_items?.length
      ? existing.invoice_items.map((i) => ({
          ...i,
          _key: Math.random().toString(36).slice(2),
          product_id: "",
        }))
      : [emptyItem()],
  );

  const [products, setProducts] = useState([]); // [{id, common_name, variants:[{id,size,selling_price,unit}]}]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // fetch product list on mount
  useEffect(() => {
    fetch(`${API_URL}/api/productlist`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const setF = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  // recalculate total when qty or unit_price changes
  const recalc = (updated) => {
    const q = parseFloat(updated.quantity) || 0;
    const p = parseFloat(updated.unit_price) || 0;
    updated.total_price = (q * p).toFixed(2);
    return updated;
  };

  const setItem = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: val };
        if (field === "quantity" || field === "unit_price") recalc(updated);
        return updated;
      }),
    );
  };

  // When admin picks a product from dropdown
  const handleProductSelect = (key, productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        return {
          ...item,
          product_id: productId,
          description: product ? product.common_name : "",
          size: "", // reset — let them pick variant
          unit_price: "",
          total_price: "",
          unit: "kg",
        };
      }),
    );
  };

  // When admin picks a size/variant from dropdown — autofill unit_price
  const handleVariantSelect = (key, variantId) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const product = products.find(
          (p) => String(p.id) === String(item.product_id),
        );
        const variant = product?.variants?.find(
          (v) => String(v.id) === String(variantId),
        );
        if (!variant)
          return { ...item, size: "", unit_price: "", total_price: "" };
        const updated = {
          ...item,
          size: variant.size || "",
          unit_price: parseFloat(variant.selling_price || 0).toFixed(2),
          unit: variant.unit || "kg",
        };
        recalc(updated);
        return updated;
      }),
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (key) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((i) => i._key !== key) : prev,
    );

  const subtotal = items.reduce(
    (s, i) => s + (parseFloat(i.total_price) || 0),
    0,
  );
  const delivery = parseFloat(form.delivery_charges) || 0;
  const total = subtotal + delivery;

  const handleSubmit = async () => {
    if (!form.customer_name.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      setError("All items need a description.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        subtotal: subtotal.toFixed(2),
        delivery_charges: delivery.toFixed(2),
        total_amount: total.toFixed(2),
        items: items.map((i) => ({
          description: i.description,
          size: i.size,
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit,
          unit_price: parseFloat(i.unit_price) || 0,
          total_price: parseFloat(i.total_price) || 0,
        })),
      };
      const url = isEdit
        ? `${API_URL}/api/invoices/${existing.id}`
        : `${API_URL}/api/invoices`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      onSaved(data.invoice);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-sm)",
    color: "var(--text-primary)",
    fontSize: "13px",
    padding: "9px 12px",
    width: "100%",
    outline: "none",
  };
  const lbl = {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    display: "block",
    marginBottom: "5px",
  };
  const dimInp = {
    ...inp,
    background: "var(--bg-deep)",
    color: "var(--text-secondary)",
    cursor: "default",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "960px",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 28px 16px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "var(--text-primary)",
              }}
            >
              {isEdit
                ? `Edit Invoice — ${existing.invoice_number}`
                : "Create New Invoice"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Select products from the dropdown — size and price autofill from
              the product list
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* ── Customer Details ── */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent-cyan)",
                marginBottom: "14px",
                paddingBottom: "6px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              Customer Details
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "14px",
              }}
            >
              <div style={{ gridColumn: "span 2" }}>
                <label style={lbl}>Customer Name *</label>
                <input
                  style={inp}
                  value={form.customer_name}
                  onChange={(e) => setF("customer_name", e.target.value)}
                  placeholder="Full name or company"
                />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input
                  style={inp}
                  value={form.customer_phone}
                  onChange={(e) => setF("customer_phone", e.target.value)}
                  placeholder="+94 xx xxx xxxx"
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={lbl}>Email</label>
                <input
                  style={inp}
                  value={form.customer_email}
                  onChange={(e) => setF("customer_email", e.target.value)}
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <label style={lbl}>Country</label>
                <input
                  style={inp}
                  value={form.customer_country}
                  onChange={(e) => setF("customer_country", e.target.value)}
                  placeholder="Sri Lanka"
                />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={lbl}>Address</label>
                <input
                  style={inp}
                  value={form.customer_address}
                  onChange={(e) => setF("customer_address", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label style={lbl}>City</label>
                <input
                  style={inp}
                  value={form.customer_city}
                  onChange={(e) => setF("customer_city", e.target.value)}
                  placeholder="Colombo"
                />
              </div>
            </div>
          </div>

          {/* ── Invoice Details ── */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent-cyan)",
                marginBottom: "14px",
                paddingBottom: "6px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              Invoice Details
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <label style={lbl}>Invoice Date</label>
                <input
                  style={inp}
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setF("invoice_date", e.target.value)}
                />
              </div>
              <div>
                <label style={lbl}>Due Date</label>
                <input
                  style={inp}
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setF("due_date", e.target.value)}
                />
              </div>
              <div>
                <label style={lbl}>Payment Terms</label>
                <select
                  style={inp}
                  value={form.payment_terms}
                  onChange={(e) => setF("payment_terms", e.target.value)}
                >
                  {[
                    "Due on receipt",
                    "Net 7",
                    "Net 14",
                    "Net 30",
                    "Net 60",
                    "50% upfront",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select
                  style={inp}
                  value={form.status}
                  onChange={(e) => setF("status", e.target.value)}
                >
                  {["draft", "sent", "paid", "cancelled"].map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "span 4" }}>
                <label style={lbl}>Notes (optional)</label>
                <textarea
                  style={{ ...inp, resize: "vertical", minHeight: "52px" }}
                  value={form.notes}
                  onChange={(e) => setF("notes", e.target.value)}
                  placeholder="Any additional notes for the customer…"
                />
              </div>
            </div>
          </div>

          {/* ── Line Items ── */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent-cyan)",
                marginBottom: "14px",
                paddingBottom: "6px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Line Items</span>
              <button
                onClick={addItem}
                style={{
                  padding: "5px 14px",
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--accent-cyan)",
                  fontSize: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                + Add Item
              </button>
            </div>

            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1.8fr 1.2fr 1fr 70px 80px 100px 100px 36px",
                gap: "6px",
                paddingBottom: "7px",
                marginBottom: "6px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {[
                "Product",
                "Size / Grade",
                "Description",
                "Qty",
                "Unit",
                "Unit Price (Rs.)",
                "Total (Rs.)",
                "",
              ].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "9.5px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {items.map((item, idx) => {
              const product = products.find(
                (p) => String(p.id) === String(item.product_id),
              );
              const variants = product?.variants || [];
              const selectedVariant = variants.find(
                (v) => v.size === item.size,
              );

              return (
                <div
                  key={item._key}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.8fr 1.2fr 1fr 70px 80px 100px 100px 36px",
                    gap: "6px",
                    marginBottom: "10px",
                    alignItems: "center",
                  }}
                >
                  {/* Product dropdown */}
                  <select
                    style={{
                      ...inp,
                      color: item.product_id
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                    }}
                    value={item.product_id}
                    onChange={(e) =>
                      handleProductSelect(item._key, e.target.value)
                    }
                  >
                    <option value="">— Select product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.common_name}
                        {p.category
                          ? ` (${p.category.charAt(0).toUpperCase() + p.category.slice(1)})`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* Size / variant dropdown — only shows if product selected */}
                  {item.product_id && variants.length > 0 ? (
                    <select
                      style={{
                        ...inp,
                        color: selectedVariant
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                      }}
                      value={selectedVariant ? String(selectedVariant.id) : ""}
                      onChange={(e) =>
                        handleVariantSelect(item._key, e.target.value)
                      }
                    >
                      <option value="">— Select size —</option>
                      {variants.map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.size}
                          {v.selling_price
                            ? ` — Rs.${parseFloat(v.selling_price).toFixed(2)}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      style={inp}
                      value={item.size}
                      onChange={(e) =>
                        setItem(item._key, "size", e.target.value)
                      }
                      placeholder={item.product_id ? "No sizes" : "—"}
                    />
                  )}

                  {/* Description — autofilled, still editable */}
                  <input
                    style={inp}
                    value={item.description}
                    onChange={(e) =>
                      setItem(item._key, "description", e.target.value)
                    }
                    placeholder={`Item ${idx + 1}`}
                  />

                  {/* Qty */}
                  <input
                    style={{ ...inp, textAlign: "right" }}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      setItem(item._key, "quantity", e.target.value)
                    }
                    placeholder="0"
                  />

                  {/* Unit */}
                  <select
                    style={inp}
                    value={item.unit}
                    onChange={(e) => setItem(item._key, "unit", e.target.value)}
                  >
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>

                  {/* Unit price — autofilled from variant, still editable */}
                  <input
                    style={{
                      ...inp,
                      textAlign: "right",
                      borderColor: selectedVariant
                        ? "rgba(0,212,255,0.35)"
                        : "var(--border-subtle)",
                    }}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) =>
                      setItem(item._key, "unit_price", e.target.value)
                    }
                    placeholder="0.00"
                  />

                  {/* Total — readonly computed */}
                  <div
                    style={{
                      ...inp,
                      textAlign: "right",
                      color: "var(--accent-cyan)",
                      fontWeight: "800",
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border-subtle)",
                      padding: "9px 10px",
                    }}
                  >
                    {parseFloat(item.total_price || 0).toFixed(2)}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item._key)}
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: "var(--radius-sm)",
                      color: "#f87171",
                      width: "36px",
                      height: "36px",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {/* Helper note */}
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
                padding: "8px 12px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-sm)",
                borderLeft: "3px solid rgba(0,212,255,0.3)",
              }}
            >
              💡 Select a product → pick a size → unit price autofills from
              selling price. You can still edit the price manually.
            </div>

            {/* Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  width: "300px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <span
                    style={{ fontSize: "13px", color: "var(--text-muted)" }}
                  >
                    Subtotal
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                    }}
                  >
                    Rs. {subtotal.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    gap: "10px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Delivery Charges
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.delivery_charges}
                    onChange={(e) => setF("delivery_charges", e.target.value)}
                    style={{
                      width: "110px",
                      padding: "5px 8px",
                      textAlign: "right",
                      background: "var(--bg-raised)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "4px",
                      color: "var(--text-primary)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "linear-gradient(135deg,#0d47a1,#1565c0)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    TOTAL AMOUNT
                  </span>
                  <span
                    style={{
                      fontSize: "17px",
                      fontWeight: "800",
                      color: "#fff",
                    }}
                  >
                    Rs. {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "#f87171",
                fontSize: "13px",
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "10px 22px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "10px 28px",
              background: "linear-gradient(135deg,#00c4f4,#0080d4)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "700",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : isEdit ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE VIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceViewModal({ inv, onClose, onEdit, onDownload }) {
  if (!inv) return null;
  const s = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;
  const items = [...(inv.invoice_items || [])].sort(
    (a, b) => (a.line_number || 0) - (b.line_number || 0),
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--radius-lg)",
          width: "100%",
          maxWidth: "720px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 100px rgba(0,0,0,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: "800",
                color: "var(--text-primary)",
              }}
            >
              {inv.invoice_number}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {inv.invoice_date
                ? new Date(inv.invoice_date).toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
              {inv.due_date &&
                ` · Due: ${new Date(inv.due_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "700",
                background: s.bg,
                color: s.color,
                border: `1px solid ${s.border}`,
              }}
            >
              {STATUS_ICONS[inv.status]} {s.label}
            </span>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "20px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Company */}
          <div
            style={{
              background: "linear-gradient(135deg,#0d47a1,#1565c0)",
              borderRadius: "var(--radius-md)",
              padding: "18px 22px",
              marginBottom: "18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{ fontSize: "16px", fontWeight: "800", color: "#fff" }}
              >
                Tropical Shellfish (Pvt) Ltd
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.6)",
                  marginTop: "3px",
                }}
              >
                Fresh &amp; Frozen Seafood Exporters · Sri Lanka
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Invoice
              </div>
              <div
                style={{ fontSize: "18px", fontWeight: "800", color: "#fff" }}
              >
                {inv.invoice_number}
              </div>
            </div>
          </div>

          {/* Two columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                  marginBottom: "10px",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "6px",
                }}
              >
                Customer
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                }}
              >
                {inv.customer_name}
              </div>
              {inv.customer_email && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "3px",
                  }}
                >
                  ✉ {inv.customer_email}
                </div>
              )}
              {inv.customer_phone && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "3px",
                  }}
                >
                  📞 {inv.customer_phone}
                </div>
              )}
              {(inv.customer_address ||
                inv.customer_city ||
                inv.customer_country) && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginTop: "6px",
                    lineHeight: "1.6",
                  }}
                >
                  📍{" "}
                  {[
                    inv.customer_address,
                    inv.customer_city,
                    inv.customer_country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              )}
            </div>
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--accent-cyan)",
                  marginBottom: "10px",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "6px",
                }}
              >
                Invoice Details
              </div>
              {[
                ["Invoice No", inv.invoice_number],
                [
                  "Date",
                  inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—",
                ],
                [
                  "Due Date",
                  inv.due_date
                    ? new Date(inv.due_date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "On Receipt",
                ],
                ["Payment Terms", inv.payment_terms || "—"],
                [
                  "Total (LKR)",
                  `Rs. ${parseFloat(inv.total_amount || 0).toFixed(2)}`,
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>{k}</span>
                  <span
                    style={{
                      fontWeight: "700",
                      color:
                        k === "Total (LKR)"
                          ? "var(--accent-cyan)"
                          : "var(--text-primary)",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                Notes:{" "}
              </span>
              {inv.notes}
            </div>
          )}

          {/* Items */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent-cyan)",
                marginBottom: "10px",
              }}
            >
              Line Items
            </div>
            <div
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "linear-gradient(135deg,#0d2a5a,#0d47a1)",
                    }}
                  >
                    {[
                      "#",
                      "Description",
                      "Size",
                      "Qty",
                      "Unit",
                      "Unit Price",
                      "Amount",
                    ].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 12px",
                          fontSize: "10px",
                          fontWeight: "700",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.8)",
                          textAlign:
                            i === 0 || i === 3 || i === 4
                              ? "center"
                              : i >= 5
                                ? "right"
                                : "left",
                          borderBottom: "2px solid rgba(255,255,255,0.1)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr
                      key={item.id || item._key}
                      style={{
                        background:
                          i % 2 === 0
                            ? "var(--bg-surface)"
                            : "var(--bg-raised)",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontWeight: "600",
                        }}
                      >
                        {item.line_number || i + 1}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.description}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {item.size || "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "var(--text-primary)",
                        }}
                      >
                        {parseFloat(item.quantity).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.unit}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "right",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        Rs. {parseFloat(item.unit_price).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: "800",
                          color: "var(--accent-cyan)",
                        }}
                      >
                        Rs. {parseFloat(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: "250px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Subtotal
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                  }}
                >
                  Rs. {parseFloat(inv.subtotal || 0).toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Delivery Charges
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                  }}
                >
                  Rs. {parseFloat(inv.delivery_charges || 0).toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "linear-gradient(135deg,#0d47a1,#1565c0)",
                }}
              >
                <span
                  style={{ fontSize: "13px", fontWeight: "700", color: "#fff" }}
                >
                  TOTAL AMOUNT
                </span>
                <span
                  style={{ fontSize: "17px", fontWeight: "800", color: "#fff" }}
                >
                  Rs. {parseFloat(inv.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onEdit}
            style={{
              padding: "9px 20px",
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.25)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-cyan)",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            ✏️ Edit Invoice
          </button>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 20px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <button
              onClick={onDownload}
              style={{
                padding: "9px 24px",
                background: "linear-gradient(135deg,#00c4f4,#0080d4)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ⬇ Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INVOICE LIST PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function InvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/invoices`);
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {
      setInvoices([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const deleteInvoice = async (id, num) => {
    if (!window.confirm(`Delete invoice ${num}? This cannot be undone.`))
      return;
    await fetch(`${API_URL}/api/invoices/${id}`, { method: "DELETE" });
    fetchInvoices();
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API_URL}/api/invoices/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchInvoices();
  };

  const displayed = invoices.filter((inv) => {
    const matchFilter = filter === "all" || inv.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      inv.customer_name?.toLowerCase().includes(q) ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.customer_email?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const countFor = (s) =>
    s === "all"
      ? invoices.length
      : invoices.filter((i) => i.status === s).length;
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

  const handleSaved = (inv) => {
    setShowForm(false);
    setEditing(null);
    fetchInvoices();
    setViewing(inv);
  };

  return (
    <div className="pricelist-container">
      <h2>🧾 Invoices</h2>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
          gap: "14px",
          marginBottom: "24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {[
          {
            label: "Total Invoices",
            value: invoices.length,
            color: "var(--accent-cyan)",
            icon: "🧾",
          },
          {
            label: "Draft",
            value: countFor("draft"),
            color: "#94a3b8",
            icon: "📝",
          },
          {
            label: "Sent",
            value: countFor("sent"),
            color: "#60a5fa",
            icon: "📤",
          },
          {
            label: "Paid",
            value: countFor("paid"),
            color: "#4ade80",
            icon: "✅",
          },
          {
            label: "Revenue (Paid)",
            value: `Rs. ${totalRevenue.toFixed(2)}`,
            color: "#c084fc",
            icon: "💰",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-raised)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "6px" }}>
              {s.icon}
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "14px",
          flexWrap: "wrap",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          >
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, invoice no or email…"
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          style={{
            padding: "10px 22px",
            background: "linear-gradient(135deg,#00c4f4,#0080d4)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + New Invoice
        </button>
      </div>

      {/* Filter pills */}
      <div className="species-filter" style={{ marginBottom: "1.5rem" }}>
        {["all", "draft", "sent", "paid", "cancelled"].map((s) => (
          <button
            key={s}
            className={`species-pill ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s !== "all" && <span>{STATUS_ICONS[s]}</span>}
            <span className="species-label">
              {s === "all" ? "All" : STATUS_STYLES[s]?.label}
            </span>
            <span className="species-count">({countFor(s)})</span>
          </button>
        ))}
      </div>

      {loading && <div className="info">Loading invoices…</div>}
      {!loading && displayed.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧾</div>
          <p style={{ fontSize: "15px", marginBottom: "16px" }}>
            {search ? `No invoices matching "${search}"` : "No invoices yet."}
          </p>
          {!search && (
            <button className="apf-btn" onClick={() => setShowForm(true)}>
              Create First Invoice
            </button>
          )}
        </div>
      )}

      {/* Invoice cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {displayed.map((inv) => {
          const s = STATUS_STYLES[inv.status] || STATUS_STYLES.draft;
          return (
            <div
              key={inv.id}
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-glow)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--border-subtle)")
              }
            >
              {/* Main info */}
              <div
                style={{ flex: 1, minWidth: "200px", cursor: "pointer" }}
                onClick={() => setViewing(inv)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "3px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "var(--accent-cyan)",
                      fontFamily: "monospace",
                    }}
                  >
                    {inv.invoice_number}
                  </span>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "700",
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.border}`,
                    }}
                  >
                    {STATUS_ICONS[inv.status]} {s.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                  }}
                >
                  {inv.customer_name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  {inv.customer_email && `${inv.customer_email} · `}
                  {inv.invoice_date
                    ? new Date(inv.invoice_date).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : ""}
                  {inv.due_date &&
                    ` · Due: ${new Date(inv.due_date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}`}
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                  }}
                >
                  Rs. {parseFloat(inv.total_amount || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {(inv.invoice_items || []).length} item
                  {(inv.invoice_items || []).length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Status change */}
              <select
                value={inv.status}
                onChange={(e) => updateStatus(inv.id, e.target.value)}
                style={{
                  padding: "6px 10px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {["draft", "sent", "paid", "cancelled"].map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>

              {/* Actions */}
              <button
                onClick={() => setViewing(inv)}
                style={{
                  padding: "7px 14px",
                  background: "rgba(0,212,255,0.08)",
                  border: "1px solid rgba(0,212,255,0.25)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--accent-cyan)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                👁 View
              </button>
              <button
                onClick={() => {
                  setEditing(inv);
                  setShowForm(true);
                }}
                style={{
                  padding: "7px 12px",
                  background: "rgba(0,212,255,0.06)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--accent-cyan)",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => downloadInvoicePDF(inv)}
                style={{
                  padding: "7px 12px",
                  background: "rgba(74,222,128,0.06)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "#4ade80",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                ⬇
              </button>
              <button
                onClick={() => deleteInvoice(inv.id, inv.invoice_number)}
                style={{
                  padding: "7px 12px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "#f87171",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
                }
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showForm && (
        <InvoiceForm
          existing={editing}
          onSaved={handleSaved}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {viewing && (
        <InvoiceViewModal
          inv={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
            setShowForm(true);
          }}
          onDownload={() => downloadInvoicePDF(viewing)}
        />
      )}
    </div>
  );
}
