import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ArtworkUpload() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    statement: "",
    category: "",
    tags: "",
    isForSale: true,
    price: "0.00",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    // TODO: connect to backend API later
    setTimeout(() => {
      setMessage("✅ Artwork published successfully!");
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f8f8", fontFamily: "Inter, sans-serif", paddingBottom: "80px" }}>

      {/* Top Bar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", backgroundColor: "#fff",
        borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 50
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#555" }}
        >
          ←
        </button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: "700", letterSpacing: "2px" }}>
          Upload Artwork
        </span>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ background: "none", border: "none", fontSize: "11px", color: "#aaa", cursor: "pointer", letterSpacing: "1px", fontWeight: "600" }}
        >
          SAVE DRAFT
        </button>
      </nav>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Image Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            width: "100%", height: "220px", borderRadius: "16px",
            border: "2px dashed #ddd", backgroundColor: "#fff",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", cursor: "pointer", overflow: "hidden",
            marginBottom: "24px", position: "relative"
          }}
          onClick={() => document.getElementById("artwork-image").click()}
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <>
              <div style={{ fontSize: "32px", marginBottom: "12px", color: "#ccc" }}>🖼️</div>
              <p style={{ fontSize: "13px", color: "#aaa", margin: 0, fontWeight: "600" }}>
                Drag your masterpiece here
              </p>
              <p style={{ fontSize: "11px", color: "#ccc", margin: "4px 0 0" }}>
                PNG, JPG up to 10MB
              </p>
            </>
          )}
          {imagePreview && (
            <button
              onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
              style={{
                position: "absolute", top: "10px", right: "10px",
                background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                width: "28px", height: "28px", color: "#fff", cursor: "pointer", fontSize: "14px"
              }}
            >
              ✕
            </button>
          )}
        </div>
        <input id="artwork-image" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Artwork Title */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "#888", marginBottom: "8px" }}>
              ARTWORK TITLE
            </label>
            <input
              type="text"
              name="title"
              placeholder="eg. Whispers of the Obsidian Cavern"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: "100%", padding: "13px 16px", backgroundColor: "#fff",
                border: "1px solid #e8e8e8", borderRadius: "10px",
                fontSize: "13px", color: "#333", outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Artist Statement */}
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "#888", marginBottom: "8px" }}>
              ARTIST STATEMENT
            </label>
            <textarea
              name="statement"
              placeholder="Describe the story of this piece..."
              value={formData.statement}
              onChange={handleChange}
              rows={4}
              style={{
                width: "100%", padding: "13px 16px", backgroundColor: "#fff",
                border: "1px solid #e8e8e8", borderRadius: "10px",
                fontSize: "13px", color: "#333", outline: "none",
                boxSizing: "border-box", resize: "vertical", fontFamily: "Inter, sans-serif"
              }}
            />
          </div>

          {/* Category and Tags side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "#888", marginBottom: "8px" }}>
                CATEGORY
              </label>
              <div style={{ position: "relative" }}>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: "100%", padding: "13px 16px", backgroundColor: "#fff",
                    border: "1px solid #e8e8e8", borderRadius: "10px",
                    fontSize: "12px", color: formData.category ? "#333" : "#aaa",
                    outline: "none", appearance: "none", cursor: "pointer",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="">Contemporary Gi...</option>
                  <option value="CONTEMPORARY">Contemporary</option>
                  <option value="MINIMALIST">Minimalist</option>
                  <option value="RENAISSANCE">Renaissance</option>
                  <option value="IMPRESSIONISM">Impressionism</option>
                  <option value="SURREALISM">Surrealism</option>
                  <option value="ABSTRACT">Abstract</option>
                </select>
                <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", pointerEvents: "none" }}>▾</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "#888", marginBottom: "8px" }}>
                TAGS
              </label>
              <input
                type="text"
                name="tags"
                placeholder="Abstract, Dark, Minimal"
                value={formData.tags}
                onChange={handleChange}
                style={{
                  width: "100%", padding: "13px 16px", backgroundColor: "#fff",
                  border: "1px solid #e8e8e8", borderRadius: "10px",
                  fontSize: "12px", color: "#333", outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* List for Sale Toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "#fff", border: "1px solid #e8e8e8",
            borderRadius: "10px", padding: "14px 16px", marginBottom: "18px"
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#333" }}>
                List for Exhibition &amp; Sale
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#aaa" }}>
                Make this artwork available to collectors
              </p>
            </div>
            {/* Toggle Switch */}
            <div
              onClick={() => setFormData((prev) => ({ ...prev, isForSale: !prev.isForSale }))}
              style={{
                width: "48px", height: "26px", borderRadius: "13px", cursor: "pointer",
                backgroundColor: formData.isForSale ? "#e53e3e" : "#ddd",
                position: "relative", transition: "background-color 0.3s", flexShrink: 0
              }}
            >
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#fff",
                position: "absolute", top: "3px", transition: "left 0.3s",
                left: formData.isForSale ? "25px" : "3px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)"
              }} />
            </div>
          </div>

          {/* Price */}
          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "700", letterSpacing: "2px", color: "#888", marginBottom: "8px" }}>
              ASKING PRICE (NPR)
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "13px", fontWeight: "600" }}>
                NPR
              </span>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                style={{
                  width: "100%", padding: "13px 16px 13px 52px", backgroundColor: "#fff",
                  border: "1px solid #e8e8e8", borderRadius: "10px",
                  fontSize: "13px", color: "#333", outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: "12px 16px", borderRadius: "10px", marginBottom: "16px",
              backgroundColor: "#f0fff4", border: "1px solid #9ae6b4",
              fontSize: "13px", color: "#276749", textAlign: "center"
            }}>
              {message}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              style={{
                flex: 1, padding: "14px", backgroundColor: "#fff",
                border: "1px solid #ddd", borderRadius: "10px",
                fontSize: "11px", fontWeight: "700", letterSpacing: "2px",
                color: "#888", cursor: "pointer"
              }}
            >
              SAVE DRAFT
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: "14px", backgroundColor: "#111",
                border: "none", borderRadius: "10px",
                fontSize: "11px", fontWeight: "700", letterSpacing: "2px",
                color: "#fff", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "PUBLISHING..." : "PUBLISH ARTWORK"}
            </button>
          </div>

        </form>
      </div>

      {/* Bottom Navigation */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff", borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around",
        alignItems: "center", padding: "10px 0", zIndex: 50
      }}>
        {[
          { icon: "⌂", label: "Home", path: "/home" },
          { icon: "🔍", label: "Search", path: "/gallery" },
          { icon: "＋", label: "Post", path: "/upload" },
          { icon: "👤", label: "Profile", path: "/profile" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
              color: item.path === "/upload" ? "#111" : "#aaa"
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span style={{ fontSize: "10px", fontWeight: item.path === "/upload" ? "700" : "400" }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}