import { jsPDF } from "jspdf";

// ArtVerse brand red — matches the bg-red-600 accent used across the UI.
const RED = [220, 38, 38];
const DARK = [28, 27, 25];
const GREY = [120, 113, 108];
const LINE = [231, 229, 228];

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
        .catch(() => null) // fall back gracefully — invoice still renders without the image
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

function getImageNaturalSize(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

// Same convention used across the app (Gallery, ArtworkDetail, etc.) —
// artwork images are stored as a relative /uploads/... path.
function resolveArtworkImageUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `http://localhost:8080${url}`;
}

function fitContain(natW, natH, boxW, boxH) {
  const scale = Math.min(boxW / natW, boxH / natH);
  return { w: natW * scale, h: natH * scale };
}

/**
 * Builds and downloads a one-page PDF invoice for a completed order,
 * including the full details of the artwork that was purchased.
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
  doc.text("Nepal's First Virtual Art Gallery", taglineX, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);
  doc.text("INVOICE", pageWidth - margin, y - 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`Invoice #ORD-${order.id}`, pageWidth - margin, y + 4, { align: "right" });
  doc.text(formatDate(order.createdAt), pageWidth - margin, y + 18, { align: "right" });

  y += 46;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 28;

  // ── Billed to / Payment info ──
  const buyerName = order.buyer?.name || order.buyer?.email || "Guest";
  const buyerEmail = order.buyer?.email || "";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  doc.text("BILLED TO", margin, y);
  doc.text("PAYMENT METHOD", pageWidth / 2, y);
  doc.text("ORDER STATUS", pageWidth - margin, y, { align: "right" });

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(buyerName, margin, y);
  doc.text(paymentMethod, pageWidth / 2, y);
  doc.text(String(order.status || "PENDING").replace("_", " "), pageWidth - margin, y, { align: "right" });

  if (buyerEmail) {
    y += 14;
    doc.setFontSize(10);
    doc.setTextColor(...GREY);
    doc.text(buyerEmail, margin, y);
  }

  y += 30;

  // ── Artwork details ──
  const artwork = order.artwork || {};
  const artistName = artwork.artist?.name || artwork.artist?.email || "Unknown Artist";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  doc.text("ARTWORK DETAILS", margin, y);
  y += 12;

  const boxTop = y;
  const boxInnerPad = 14;
  const thumbSize = 100;
  const hasImage = !!artwork.imageUrl;
  const textX = margin + boxInnerPad + (hasImage ? thumbSize + 16 : 0);
  const textWidth = pageWidth - margin - boxInnerPad - textX;

  // Details shown as "Label: Value" pairs, only for fields that exist.
  const metaParts = [
    artwork.category && `Category: ${artwork.category}`,
    artwork.medium && `Medium: ${artwork.medium}`,
    artwork.dimensions && `Dimensions: ${artwork.dimensions}`,
  ].filter(Boolean);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const descriptionLines = artwork.description
    ? doc.splitTextToSize(artwork.description, textWidth).slice(0, 4)
    : [];

  // Work out the box height from its tallest column (image vs. text) before drawing.
  const titleH = 18;
  const artistH = 14;
  const metaH = metaParts.length ? 14 : 0;
  const descGapH = descriptionLines.length ? 10 : 0;
  const descH = descriptionLines.length * 12;
  const refH = 14;
  const textBlockHeight = titleH + artistH + metaH + descGapH + descH + refH;
  const boxHeight = Math.max(hasImage ? thumbSize : 0, textBlockHeight) + boxInnerPad * 2;

  doc.setDrawColor(...LINE);
  doc.rect(margin, boxTop, pageWidth - margin * 2, boxHeight);

  // Thumbnail, aspect-fit within its square slot.
  if (hasImage) {
    const artworkImgUrl = resolveArtworkImageUrl(artwork.imageUrl);
    const artworkDataUrl = await loadImageDataUrl(artworkImgUrl);
    if (artworkDataUrl) {
      try {
        const { w: natW, h: natH } = await getImageNaturalSize(artworkDataUrl);
        const { w: drawW, h: drawH } = fitContain(natW, natH, thumbSize, thumbSize);
        const imgX = margin + boxInnerPad + (thumbSize - drawW) / 2;
        const imgY = boxTop + boxInnerPad + (thumbSize - drawH) / 2;
        doc.addImage(artworkDataUrl, jsPdfImageFormat(artworkDataUrl), imgX, imgY, drawW, drawH);
      } catch {
        // Corrupt/unsupported image format — skip it, the text details still render.
      }
    }
  }

  // Text column.
  let ty = boxTop + boxInnerPad + 11;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text(artwork.title || "Untitled artwork", textX, ty);
  ty += artistH;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GREY);
  doc.text(`By ${artistName}`, textX, ty);
  ty += metaH || 4;

  if (metaParts.length) {
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(metaParts.join("   ·   "), textX, ty);
    ty += descGapH || 14;
  }

  if (descriptionLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...GREY);
    doc.text(descriptionLines, textX, ty);
    ty += descH;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...RED);
  doc.text(`Artwork Ref: #${artwork.id ?? "—"}   ·   Price: ${formatNpr(artwork.price ?? order.pricePaid)}`, textX, ty + 8);

  y = boxTop + boxHeight + 28;

  // ── Total ──
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GREY);
  doc.text("TOTAL PAID", margin, y);
  doc.setFontSize(16);
  doc.setTextColor(...RED);
  doc.text(formatNpr(order.pricePaid), pageWidth - margin, y, { align: "right" });

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 64;
  doc.setDrawColor(...LINE);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("Thank you for collecting with ArtVerse.", margin, footerY + 20);
  doc.text("hello@artverse.com  ·  Kathmandu, Nepal", margin, footerY + 34);

  doc.save(`ArtVerse-Invoice-ORD-${order.id}.pdf`);
}
