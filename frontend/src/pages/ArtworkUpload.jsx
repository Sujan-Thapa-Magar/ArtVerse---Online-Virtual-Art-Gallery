import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const CATEGORIES = [
  "Painting", "Drawing", "Sculpture", "Photography",
  "Digital Art", "Printmaking", "Textile", "Ceramics",
  "Mixed Media", "Other",
];

export default function ArtworkUpload() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "", description: "", category: "",
    price: "", dimensions: "", medium: "", isForSale: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB."); return; }
    setImageFile(file);
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => processImageFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processImageFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.category) return setError("Please select a category.");
    if (!imageFile) return setError("Please upload an image.");
    if (form.isForSale && (!form.price || isNaN(form.price) || Number(form.price) <= 0))
      return setError("Enter a valid price for artworks listed for sale.");

    const token = localStorage.getItem("token");
    if (!token) { setError("You must be logged in to upload artwork."); return; }

    const data = new FormData();
    data.append("image", imageFile);
    data.append("title", form.title.trim());
    data.append("description", form.description.trim());
    data.append("category", form.category);
    data.append("price", form.isForSale ? Number(form.price) : 0);
    data.append("dimensions", form.dimensions.trim());
    data.append("medium", form.medium.trim());
    data.append("isForSale", form.isForSale);

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/api/artworks/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error((await res.text()) || `Upload failed (${res.status})`);
      setSuccess(true);
      setTimeout(() => navigate("/gallery"), 1800);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Gallery Visual Color System Tokens
  const C = {
    pageBg:      "#faf6f0",   
    cardBg:      "#ffffff",
    border:      "#e7e5e4",   
    borderLight: "#f5f5f4",
    text:        "#1c1917",   
    textMid:     "#44403c",   
    textLight:   "#78716c",   
    accent:      "#dc2626",   
    accentHover: "#b91c1c",   
    accentBg:    "#fef2f2",   
  };

  return (
    <div className="min-h-screen bg-cream" style={{ color: C.text }}>
      <Navbar />
      <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 16px 80px",
    }}>
      <style>{`
        .av-input {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid #e7e5e4;
          border-radius: 10px;
          padding: 11px 16px;
          color: #1c1917;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .av-input::placeholder { color: #a8a29e; }
        .av-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.08);
        }
        select.av-input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2378716c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px; }
        select.av-input option { background: #fff; color: #1c1917; }
        textarea.av-input { resize: vertical; min-height: 100px; }
        input[type=number].av-input::-webkit-inner-spin-button { opacity: 0.3; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ width: "100%", maxWidth: 560, marginBottom: 32 }}>
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.textLight, fontSize: 11, letterSpacing: "2px",
          textTransform: "uppercase", marginBottom: 32,
          display: "flex", alignItems: "center", gap: 6,
          transition: "color 0.2s",
          fontWeight: 700
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.accent}
          onMouseLeave={e => e.currentTarget.style.color = C.textLight}
        >
          ← Back
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: "4px",
            color: C.accent, textTransform: "uppercase", margin: "0 0 10px",
          }}>Artist Studio</p>
          <h1 style={{
            fontSize: "clamp(2rem, 6vw, 2.8rem)",
            fontWeight: 700, color: C.text, margin: "0 0 10px", lineHeight: 1.2,
          }}>Upload Artwork</h1>
          <p style={{ fontSize: 13, color: C.textLight, margin: 0, fontWeight: 500 }}>
            Share your creation with the ArtVerse community
          </p>
        </div>
      </div>

      {/* ── Card Container ── */}
      <div style={{
        width: "100%", maxWidth: 560,
        background: C.cardBg,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 16px 40px rgba(0,0,0,0.04)",
      }}>
        {/* Accent Brand Line Top */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${C.accent}, #ef4444, ${C.accent})` }} />

        <div style={{ padding: "32px 32px 36px" }}>

          {/* Alerts */}
          {success && (
            <div style={{
              background: "#f0faf4", border: "1px solid #86efac",
              borderRadius: 10, padding: "12px 16px", marginBottom: 24,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ color: "#16a34a", fontSize: 16 }}>✓</span>
              <p style={{ color: "#16a34a", fontSize: 13, margin: 0, fontWeight: 600 }}>
                Artwork uploaded! Redirecting to gallery…
              </p>
            </div>
          )}
          {error && (
            <div style={{
              background: "#fff5f5", border: "1px solid #fca5a5",
              borderRadius: 10, padding: "12px 16px", marginBottom: 24,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <span style={{ color: "#dc2626", fontSize: 14, marginTop: 1 }}>⚠</span>
              <p style={{ color: "#dc2626", fontSize: 13, margin: 0, lineHeight: 1.5, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Image Dropzone Area ── */}
            <SectionLabel color={C.accent}>Artwork Image</SectionLabel>
            <div
              onClick={() => document.getElementById("av-img-input").click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? C.accent : "#cbd5e1"}`,
                borderRadius: 12,
                background: dragOver ? C.accentBg : "#fafafa",
                cursor: "pointer",
                overflow: "hidden",
                transition: "border-color 0.2s, background 0.2s",
                marginBottom: 8,
              }}
            >
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  <img src={imagePreview} alt="Preview"
                    style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }} />
                  <div
                    style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifycontent: "center",
                      opacity: 0, transition: "opacity 0.2s",
                      justifyContent: "center"
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    <span style={{
                      color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "2px",
                      textTransform: "uppercase", background: "rgba(0,0,0,0.75)",
                      padding: "8px 20px", borderRadius: 999,
                    }}>Change Image</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: "48px 24px", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 14, fontSize: 26,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#f1f5f9", border: `1.5px solid ${C.border}`,
                    marginBottom: 16,
                  }}>🖼</div>
                  <p style={{ fontSize: 14, color: C.textMid, fontWeight: 600, margin: "0 0 6px" }}>
                    {dragOver ? "Drop image here" : "Click or drag to upload"}
                  </p>
                  <p style={{ fontSize: 11, color: C.textLight, letterSpacing: "1px", margin: 0, fontWeight: 500 }}>
                    JPG · PNG · WEBP — max 10MB
                  </p>
                </div>
              )}
              <input id="av-img-input" type="file" accept="image/*"
                onChange={handleImageChange} style={{ display: "none" }} />
            </div>
            {imageFile && (
              <p style={{ fontSize: 12, color: C.textMid, margin: "4px 0 20px", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
                <span style={{ color: "#16a34a", fontWeight: "bold" }}>✓</span> {imageFile.name}
              </p>
            )}

            <Divider border={C.borderLight} />

            {/* ── Metadata Inputs ── */}
            <SectionLabel color={C.accent}>Artwork Details</SectionLabel>

            <Field label="Title *" color={C.textLight}>
              <input className="av-input" type="text" name="title"
                value={form.title} onChange={handleChange}
                placeholder="e.g. Sunset Over Patan" maxLength={120} />
            </Field>

            <Field label="Description" color={C.textLight}>
              <textarea className="av-input" name="description"
                value={form.description} onChange={handleChange}
                placeholder="Tell the story behind this piece…" maxLength={1000} />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Category *" color={C.textLight}>
                <select className="av-input" name="category"
                  value={form.category} onChange={handleChange}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Medium" color={C.textLight}>
                <input className="av-input" type="text" name="medium"
                  value={form.medium} onChange={handleChange}
                  placeholder="e.g. Oil on canvas" />
              </Field>
            </div>

            <Field label="Dimensions" color={C.textLight}>
              <input className="av-input" type="text" name="dimensions"
                value={form.dimensions} onChange={handleChange}
                placeholder="e.g. 60 × 40 cm" />
            </Field>

            <Divider border={C.borderLight} />

            {/* ── Pricing Toggle Layout ── */}
            <SectionLabel color={C.accent}>Pricing</SectionLabel>

            <div
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, cursor: "pointer" }}
              onClick={() => setForm(p => ({ ...p, isForSale: !p.isForSale }))}
            >
              <div style={{ position: "relative", width: 44, height: 24, flexShrink: 0 }}>
                <div style={{
                  width: 44, height: 24, borderRadius: 999, transition: "background 0.2s",
                  background: form.isForSale ? C.accent : "#e2e8f0",
                }} />
                <div style={{
                  position: "absolute", top: 3,
                  left: form.isForSale ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%",
                  background: "#ffffff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: 14, color: C.textMid, userSelect: "none", fontWeight: 600 }}>
                This artwork is for sale
              </span>
            </div>

            {form.isForSale && (
              <Field label="Price (NPR) *" color={C.textLight}>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                    fontSize: 12, fontWeight: 700, color: C.textLight, pointerEvents: "none",
                    letterSpacing: "1px",
                  }}>NPR</span>
                  <input className="av-input" type="number" name="price"
                    value={form.price} onChange={handleChange}
                    placeholder="e.g. 15000" min="1"
                    style={{ paddingLeft: 52 }} />
                </div>
              </Field>
            )}

            {/* ── Brand Button Actions ── */}
            <button
              type="submit"
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 12,
                border: "none",
                cursor: loading || success ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginTop: 8,
                transition: "all 0.2s",
                background: loading || success
                  ? "#cbd5e1"
                  : `linear-gradient(135deg, ${C.accent} 0%, #ef4444 100%)`,
                color: loading || success ? "#94a3b8" : "#ffffff",
                boxShadow: loading || success ? "none" : "0 8px 24px rgba(220, 38, 38, 0.15)",
              }}
              onMouseEnter={e => { if(!loading && !success) e.currentTarget.style.background = C.accentHover; }}
              onMouseLeave={e => { if(!loading && !success) e.currentTarget.style.background = `linear-gradient(135deg, ${C.accent} 0%, #ef4444 100%)`; }}
            >
              {success ? "✓  Uploaded!" : loading ? "Uploading…" : "Upload Artwork"}
            </button>

          </form>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 20, letterSpacing: "0.5px", fontWeight: 500 }}>
        By uploading, you confirm this is your original work.
      </p>
      </div>
    </div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <p style={{
      fontSize: 18, color: color, fontWeight: 700,
      letterSpacing: "0.3px", margin: "0 0 16px",
    }}>{children}</p>
  );
}

function Field({ label, children, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 18 }}>
      <label style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "2px",
        textTransform: "uppercase", color: color,
      }}>{label}</label>
      {children}
    </div>
  );
}

function Divider({ border }) {
  return <div style={{ borderTop: `1px solid ${border}`, margin: "24px 0" }} />;
}