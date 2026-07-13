import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EditProfileModal from "./EditProfileModal";
import Avatar from "./Avatar";

const API = "http://localhost:8080";

function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

/**
 * Shared site navbar — identical on every page.
 * Pass `active` ("home" | "gallery" | "notifications" | "profile") to highlight the current link.
 */
export default function Navbar({ active = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [exhibitionId, setExhibitionId] = useState(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [me, setMe] = useState(null);

  const token = localStorage.getItem("token");
  const user = getCurrentUser();
  const isGuest = !token;
  const role = user?.role || "BUYER";
  const isArtist = role === "ARTIST";
  const isAdmin = role === "ADMIN";

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (token) {
      fetch(`${API}/api/notifications/unread-count`, { headers })
        .then((r) => r.json())
        .then((d) => setUnreadCount(d.unreadCount || 0))
        .catch(() => {});

      // Real name + profile photo aren't in the JWT (it only carries email
      // + role), so fetch them for the avatar.
      fetch(`${API}/api/users/me`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setMe(d))
        .catch(() => {});
    }
    fetch(`${API}/api/exhibitions`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) setExhibitionId(d[0].id);
      })
      .catch(() => {});
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToProfile = () =>
    navigate(isAdmin ? "/admin" : isArtist ? "/dashboard" : "/profile");

  const goToExhibition = () =>
    navigate(exhibitionId ? `/exhibition/${exhibitionId}` : "/home");

  const links = [
    { label: "HOME", path: "/home", key: "home" },
    { label: "GALLERY", path: "/gallery", key: "gallery" },
    ...(!isGuest
      ? [{ label: "NOTIFICATIONS", path: "/notification", key: "notifications" }]
      : []),
  ];

  const menuItems = [
    { label: "🏠  Home", path: "/home" },
    { label: "🖼  Gallery", path: "/gallery" },
    ...(!isGuest ? [{ label: "💬  Messages", path: "/chat" }] : []),
    ...(!isGuest ? [{ label: "🔔  Notifications", path: "/notification" }] : []),
    ...(!isGuest && isArtist
      ? [
          { label: "➕  Upload Artwork", path: "/upload" },
          { label: "📊  My Studio", path: "/dashboard" },
        ]
      : []),
    ...(!isGuest && !isArtist && !isAdmin
      ? [{ label: "👤  My Profile", path: "/profile" }]
      : []),
    ...(!isGuest && isAdmin ? [{ label: "⚙️  Admin Panel", path: "/admin" }] : []),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 h-16">
          {/* LEFT: hamburger (mobile) + wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="sm:hidden text-stone-800 text-2xl bg-transparent border-none cursor-pointer p-1"
              aria-label="Open menu"
            >
              ☰
            </button>
            <img
              src="/logo-dark.png"
              alt="ArtVerse"
              onClick={() => navigate("/home")}
              className="h-32 sm:h-36 object-contain cursor-pointer transition-transform hover:scale-[1.02]"
            />
          </div>

          {/* CENTER: desktop links */}
          <div className="hidden sm:flex gap-8">
            {links.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`bg-transparent border-none text-[11px] font-bold tracking-[0.2em] cursor-pointer relative py-2 group transition-colors ${
                    isActive ? "text-red-600" : "text-stone-500 hover:text-red-600"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-transform duration-300 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* RIGHT: bell + avatar / login */}
          <div className="flex items-center gap-3">
            {!isGuest && (
              <button
                onClick={() => navigate("/notification")}
                className="relative text-stone-500 hover:text-red-600 text-xl bg-transparent border-none cursor-pointer transition-colors"
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 bg-red-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            {isGuest ? (
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer transition-colors"
              >
                Login
              </button>
            ) : (
              <div className="relative group">
                <button className="block rounded-full cursor-pointer border-none bg-transparent p-0 overflow-hidden hover:opacity-90 transition-opacity">
                  <Avatar name={me?.name} email={user?.sub} photo={me?.profilePhoto} size={36} />
                </button>

                {/* Invisible bridge so the dropdown doesn't disappear on the gap between button and menu */}
                <div className="absolute right-0 top-full h-2 w-full" />

                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl border border-stone-200 shadow-lg py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <button
                    onClick={goToProfile}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    {isArtist ? "My Studio" : isAdmin ? "Admin Panel" : "My Profile"}
                  </button>
                  <button
                    onClick={() => setEditProfileOpen(true)}
                    className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Slide-in menu — mobile only */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 sm:hidden bg-stone-900/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-72 bg-white flex flex-col py-6 px-5 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <img src="/logo-dark.png" alt="ArtVerse" className="h-9 object-contain" />
              <button
                onClick={() => setMenuOpen(false)}
                className="text-stone-400 hover:text-stone-900 text-xl bg-transparent border-none cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                className="text-left text-stone-600 hover:text-red-600 py-3 border-b border-stone-100 text-sm bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer transition-colors"
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => {
                goToExhibition();
                setMenuOpen(false);
              }}
              className="text-left text-stone-600 hover:text-red-600 py-3 border-b border-stone-100 text-sm bg-transparent border-l-0 border-r-0 border-t-0 cursor-pointer transition-colors"
            >
              🎭  Exhibition
            </button>

            <div className="mt-6 border-t border-stone-200 pt-4">
              {isGuest ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMenuOpen(false);
                    }}
                    className="text-left text-red-600 hover:text-red-700 text-sm w-full py-2 font-bold bg-transparent border-none cursor-pointer"
                  >
                    🔑  Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/register");
                      setMenuOpen(false);
                    }}
                    className="text-left text-stone-600 hover:text-stone-900 text-sm w-full py-2 bg-transparent border-none cursor-pointer"
                  >
                    ✍️  Register
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditProfileOpen(true);
                      setMenuOpen(false);
                    }}
                    className="text-left text-stone-600 hover:text-red-600 text-sm w-full py-2 bg-transparent border-none cursor-pointer"
                  >
                    ✏️  Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-left text-red-600 hover:text-red-700 text-sm w-full py-2 bg-transparent border-none cursor-pointer"
                  >
                    🚪  Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {editProfileOpen && <EditProfileModal onClose={() => setEditProfileOpen(false)} />}
    </>
  );
}