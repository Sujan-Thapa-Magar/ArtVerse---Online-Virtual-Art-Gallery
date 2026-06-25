import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtworkUpload.css";

const CATEGORIES = [
  "Painting",
  "Drawing",
  "Sculpture",
  "Photography",
  "Digital Art",
  "Printmaking",
  "Textile",
  "Ceramics",
  "Mixed Media",
  "Other",
];

export default function ArtworkUpload() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    dimensions: "",
    medium: "",
    isForSale: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }

    setImageFile(file);
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.category) return setError("Please select a category.");
    if (!imageFile) return setError("Please upload an image.");
    if (
      form.isForSale &&
      (!form.price || isNaN(form.price) || Number(form.price) <= 0)
    ) {
      return setError("Enter a valid price for artworks listed for sale.");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to upload artwork.");
      return;
    }

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Upload failed (${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => navigate("/gallery"), 1800);
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <h1 className="upload-heading">Upload Artwork</h1>
      <p className="upload-subheading">
        Share your creation with the ArtVerse community
      </p>

      <div className="upload-card">
        {success && (
          <div className="upload-success">
            ✓ Artwork uploaded successfully! Redirecting to gallery…
          </div>
        )}
        {error && <div className="upload-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <p className="upload-section-title">Artwork Image</p>
          <div
            className="upload-image-box"
            onClick={() =>
              document.getElementById("artwork-image-input").click()
            }
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="upload-image-preview"
              />
            ) : (
              <>
                <div className="upload-image-icon">🖼</div>
                <p className="upload-image-hint">Click to select an image</p>
                <p className="upload-image-subhint">
                  JPG, PNG, WEBP — max 10MB
                </p>
              </>
            )}
            <input
              id="artwork-image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>
          {imageFile && (
            <p className="upload-filename">{imageFile.name}</p>
          )}

          <div className="upload-divider" />

          <p className="upload-section-title">Artwork Details</p>

          <div className="upload-field">
            <label className="upload-label">Title *</label>
            <input
              className="upload-input"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Sunset Over Patan"
              maxLength={120}
            />
          </div>

          <div className="upload-field">
            <label className="upload-label">Description</label>
            <textarea
              className="upload-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell the story behind this piece…"
              maxLength={1000}
            />
          </div>

          <div className="upload-row">
            <div className="upload-field">
              <label className="upload-label">Category *</label>
              <select
                className="upload-select"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="upload-field">
              <label className="upload-label">Medium</label>
              <input
                className="upload-input"
                type="text"
                name="medium"
                value={form.medium}
                onChange={handleChange}
                placeholder="e.g. Oil on canvas"
              />
            </div>
          </div>

          <div className="upload-field">
            <label className="upload-label">Dimensions</label>
            <input
              className="upload-input"
              type="text"
              name="dimensions"
              value={form.dimensions}
              onChange={handleChange}
              placeholder="e.g. 60 × 40 cm"
            />
          </div>

          <div className="upload-divider" />

          <p className="upload-section-title">Pricing</p>

          <div className="upload-checkbox-row">
            <input
              className="upload-checkbox"
              type="checkbox"
              id="isForSale"
              name="isForSale"
              checked={form.isForSale}
              onChange={handleChange}
            />
            <label htmlFor="isForSale" className="upload-checkbox-label">
              This artwork is for sale
            </label>
          </div>

          {form.isForSale && (
            <div className="upload-field">
              <label className="upload-label">Price (NPR) *</label>
              <input
                className="upload-input"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 15000"
                min="1"
              />
            </div>
          )}

          <button
            type="submit"
            className={`upload-btn${loading ? " upload-btn--loading" : ""}`}
            disabled={loading || success}
          >
            {loading ? "Uploading…" : "Upload Artwork"}
          </button>
        </form>
      </div>
    </div>
  );
}