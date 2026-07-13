import { useState } from "react";

const API = "http://localhost:8080";

/**
 * Circular user avatar — shows the person's profile photo when they have
 * one, falling back to an initial-letter circle (and falling back again
 * to the initial if the photo URL 404s/fails to load).
 *
 * `bgColor`/`textColor` are plain CSS colors (not Tailwind classes) so each
 * call site can match its own surrounding design for the fallback state.
 */
export default function Avatar({
  name,
  email,
  photo,
  size = 40,
  className = "",
  bgColor = "#dc2626",
  textColor = "#ffffff",
}) {
  const [imgError, setImgError] = useState(false);

  const initial = ((name || email || "?").trim()[0] || "?").toUpperCase();
  const px = typeof size === "number" ? `${size}px` : size;
  const src = photo ? (photo.startsWith("http") ? photo : `${API}/${photo}`) : null;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || "avatar"}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        background: bgColor,
        color: textColor,
        fontSize: Math.max(10, Number(size) * 0.4) || 14,
      }}
    >
      {initial}
    </div>
  );
}
