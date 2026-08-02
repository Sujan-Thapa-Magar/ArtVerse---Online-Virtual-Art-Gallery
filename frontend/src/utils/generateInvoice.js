import { jsPDF } from "jspdf";

// ArtVerse brand red — matches the bg-red-600 accent used across the UI.
const RED = [220, 38, 38];
const RED_TINT = [254, 242, 242];
const DARK = [28, 27, 25];
const GREY = [120, 113, 108];
const LINE = [231, 229, 228];
const PANEL = [250, 246, 240];

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatNpr(amount) {
  return `NPR ${Number(amount || 0).toLocaleString("en-IN")}`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Cached per URL so re-downloading the same invoice (or the logo, reused
// across every invoice) doesn't refetch the image every time.
const imageDataUrlCache = new Map();
function loadImageDataUrl(url) {
  if (!url) return Promise.resolve(null);
  if (!imageDataUrlCache.has(url)) {
    imageDataUrlCache.set(
      url,
      fetch(url)
        .then((res) => res.blob())
        .then(blobToDataUrl)
        .catch(() => null) // fall back gracefully — invoice still renders without the logo
    );
  }
  return imageDataUrlCache.get(url);
}

// jsPDF needs to know the source format; sniff it from the data URL's mime type.
function jsPdfImageFormat(dataUrl) {
  const match = /^data:image\/([a-zA-Z0-9.+-]+);base64,/.exec(dataUrl || "");
  const type = (match ? match[1] : "").toLowerCase();
  if (type === "jpeg" || type === "jpg") return "JPEG";
  if (type === "webp") return "WEBP";
  return "PNG";
}

/**
 * Builds and downloads a one-page PDF invoice for a completed order.
 *
 * @param {object} order - Order returned by the backend (buyNow / payment verify).
 *   Expected shape: { id, buyer, artwork, pricePaid, status, createdAt }
 * @param {string} [paymentMethod] - "eSewa" | "Khalti" | "Direct" — best-effort label only.
 */
export async function downloadInvoice(order, paymentMethod = "Direct") {
  if (!order) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 40;

  // ── Header ──
  const logoDataUrl = await loadImageDataUrl("/logo-dark.png");
  const logoSize = 46;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, jsPdfImageFormat(logoDataUrl), margin, y - 28, logoSize, logoSize);
  }
  const taglineX = logoDataUrl ? margin + logoSize + 12 : margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("Nepal's Virtual Art Gallery", taglineX, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...RED);
  doc.text("INVOICE", pageWidth - margin, y - 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`#ORD-${order.id}`, pageWidth - margin, y + 6, { align: "right" });
  doc.text(formatDate(order.createdAt), pageWidth - margin, y + 20, { align: "right" });

  y += 50;
  doc.setDrawColor(...RED);
  doc.setLineWidth(2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 32;

  // ── Billed to / Payment info ──
  const buyerName = order.buyer?.name || order.buyer?.email || "Guest";
  const buyerEmail = order.buyer?.email || "";
  const statusLabel = String(order.status || "PENDING").replace("_", " ");

  const colWidth = (pageWidth - margin * 2) / 3;
  const col1X = margin;
  const col2X = margin + colWidth;
  const col3X = margin + colWidth * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...RED);
  doc.text("BILLED TO", col1X, y);
  doc.text("PAYMENT METHOD", col2X, y);
  doc.text("ORDER STATUS", col3X, y);

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...DARK);
  doc.text(buyerName, col1X, y);
  doc.text(paymentMethod, col2X, y);
  doc.text(statusLabel, col3X, y);

  if (buyerEmail) {
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GREY);
    doc.text(buyerEmail, col1X, y);
  }

  y += 34;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  // ── Artwork / line item ──
  const artwork = order.artwork || {};
  const artistName = artwork.artist?.name || artwork.artist?.email || "Unknown Artist";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...GREY);
  doc.text("ITEM", margin, y);
  doc.text("PRICE", pageWidth - margin, y, { align: "right" });
  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Panel background for the single line item — a clean card instead of a photo.
  const metaParts = [
    artwork.category && artwork.category,
    artwork.medium && artwork.medium,
    artwork.dimensions && artwork.dimensions,
  ].filter(Boolean);

  const titleH = 20;
  const artistH = 16;
  const metaH = metaParts.length ? 16 : 0;
  const panelPadY = 18;
  const panelHeight = panelPadY * 2 + titleH + artistH + metaH;
  const panelTop = y;

  doc.setFillColor(...PANEL);
  doc.roundedRect(margin, panelTop, pageWidth - margin * 2, panelHeight, 6, 6, "F");
  // Accent bar on the left edge of the panel.
  doc.setFillColor(...RED);
  doc.roundedRect(margin, panelTop, 4, panelHeight, 2, 2, "F");

  let ty = panelTop + panelPadY + 12;
  const textX = margin + 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...DARK);
  doc.text(artwork.title || "Untitled artwork", textX, ty);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...RED);
  doc.text(formatNpr(artwork.price ?? order.pricePaid), pageWidth - margin - 16, ty, { align: "right" });

  ty += artistH;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`By ${artistName}`, textX, ty);

  if (metaParts.length) {
    ty += metaH;
    doc.setFontSize(9);
    doc.setTextColor(...GREY);
    doc.text(metaParts.join("   ·   "), textX, ty);
  }

  y = panelTop + panelHeight + 34;

  // ── Total ──
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const totalBoxWidth = 220;
  const totalBoxHeight = 46;
  const totalBoxX = pageWidth - margin - totalBoxWidth;
  doc.setFillColor(...RED_TINT);
  doc.roundedRect(totalBoxX, y, totalBoxWidth, totalBoxHeight, 6, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text("TOTAL PAID", totalBoxX + 16, y + 28);
  doc.setFontSize(18);
  doc.setTextColor(...RED);
  doc.text(formatNpr(order.pricePaid), totalBoxX + totalBoxWidth - 16, y + 30, { align: "right" });

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 64;
  doc.setDrawColor(...LINE);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("Thank you for collecting with ArtVerse.", margin, footerY + 20);
  doc.text("ArtVerse  ·  Kathmandu, Nepal", margin, footerY + 34);

  doc.save(`ArtVerse-Invoice-ORD-${order.id}.pdf`);
}
