import { useState, useEffect } from "react";

const API = "http://localhost:8080";

/**
 * Self-service "Edit Profile" modal — available to every logged-in role
 * (buyer, artist, admin) from the Navbar avatar menu. Lets a user change
 * their own name, bio, profile photo, and password.
 */
export default function EditProfileModal({ onClose }) {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setName(user.name || "");
          setBio(user.bio || "");
          if (user.profilePhoto) setPhotoPreview(`${API}/${user.profilePhoto}`);
        } else {
          setError("Could not load your profile.");
        }
      } catch {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (newPassword && !currentPassword) {
      setError("Enter your current password to set a new one.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("bio", bio);
      if (newPassword) {
        form.append("currentPassword", currentPassword);
        form.append("newPassword", newPassword);
      }
      if (photoFile) form.append("photo", photoFile);

      const res = await fetch(`${API}/api/users/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const text = await res.text();
      if (res.ok) {
        setSuccess(true);
        // Several pages (BuyerProfile, ArtistDashboard, SuperAdmin) derive
        // their own copy of the user's name/photo from separate fetches —
        // a reload is the simplest way to keep everything in sync.
        setTimeout(() => window.location.reload(), 900);
      } else {
        setError(text || "Could not update your profile.");
      }
    } catch {
      setError("Could not connect to server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="text-lg font-bold text-stone-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 text-xl bg-transparent border-none cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-red-600 animate-spin" />
            <p className="text-stone-400 text-sm">Loading profile…</p>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">✓</div>
            <p className="text-stone-700 font-semibold">Profile updated!</p>
            <p className="text-stone-400 text-xs">Refreshing…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* Photo */}
            <div className="flex flex-col items-center mb-6">
              <label htmlFor="edit-photo-upload" className="cursor-pointer">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center relative bg-stone-50 overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-stone-300">📷</span>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                    ✎
                  </div>
                </div>
              </label>
              <input id="edit-photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <span className="text-[11px] tracking-widest text-stone-400 mt-2 uppercase">Change Photo</span>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">FULL NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-md text-sm text-stone-700 outline-none focus:border-red-600 transition-colors"
              />
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">BIO</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell others a bit about yourself…"
                className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-md text-sm text-stone-700 outline-none focus:border-red-600 transition-colors resize-none"
              />
            </div>

            <div className="border-t border-stone-100 pt-5 mb-5">
              <p className="text-[11px] font-bold tracking-widest text-red-600 uppercase mb-3">
                Change Password <span className="text-stone-400 font-normal normal-case">(optional)</span>
              </p>

              <div className="mb-3">
                <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">CURRENT PASSWORD</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-md text-sm text-stone-700 outline-none focus:border-red-600 transition-colors"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">NEW PASSWORD</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+"
                  title="At least 6 characters, with an uppercase letter, a lowercase letter, and a special character."
                  className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-md text-sm text-stone-700 outline-none focus:border-red-600 transition-colors"
                />
                <p className="text-[11px] text-stone-400 mt-1.5">
                  Leave blank to keep your current password. New password needs an uppercase letter, a lowercase letter, and a special character.
                </p>
              </div>

              <div>
                <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-md text-sm text-stone-700 outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-stone-100 text-stone-600 text-xs tracking-widest font-semibold rounded-md hover:bg-stone-200 transition-colors cursor-pointer border-none"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-red-600 text-white text-xs tracking-widest font-semibold rounded-md hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer border-none"
              >
                {saving ? "SAVING…" : "SAVE CHANGES"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
