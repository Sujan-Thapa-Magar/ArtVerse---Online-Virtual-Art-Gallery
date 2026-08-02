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


export default function Navbar({ active = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
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

      fetch(`${API}/api/messages/unread-count`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setUnreadMessageCount(d.unreadCount || 0))
        .catch(() => {});

      fetch(`${API}/api/users/me`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setMe(d))
        .catch(() => {});
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goToProfile = () =>
    navigate(isAdmin ? "/admin" : isArtist ? "/dashboard" : "/profile");

  const links = [
    { label: "HOME", path: "/home", key: "home" },
    { label: "GALLERY", path: "/gallery", key: "gallery" },
    { label: "ABOUT", path: "/about-us", key: "about" },
    { label: "CONTACT", path: "/contact-us", key: "contact" },
    ...(!isGuest
      ? [{ label: "NOTIFICATIONS", path: "/notification", key: "notifications" }]
      : []),
  ];

  const menuItems = [
    { icon: "🏠", label: "Home", path: "/home" },
    { icon: "🖼", label: "Gallery", path: "/gallery" },
    { icon: "ℹ️", label: "About Us", path: "/about-us" },
    { icon: "✉️", label: "Contact Us", path: "/contact-us" },
    ...(!isGuest ? [{ icon: "💬", label: "Messages", path: "/chat" }] : []),
    ...(!isGuest && isArtist
      ? [
          { icon: "➕", label: "Upload Artwork", path: "/upload" },
          { icon: "📊", label: "My Studio", path: "/dashboard" },
        ]
      : []),
    ...(!isGuest && !isArtist && !isAdmin
      ? [{ icon: "👤", label: "My Profile", path: "/profile" }]
      : []),
    ...(!isGuest && isAdmin ? [{ icon: "⚙️", label: "Admin Panel", path: "/admin" }] : []),
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-12 h-16">
          {/* LEFT: hamburger (mobile) + wordmark */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(true)}
              className="sm:hidden text-stone-800 text-2xl bg-transparent border-none cursor-pointer p-1 -ml-1"
              aria-label="Open menu"
            >
              ☰
            </button>
            <img
              src="/logo-dark.png"
              alt="ArtVerse"
              onClick={() => navigate("/home")}
              className="h-32 sm:h-36 object-contain cursor-pointer transition-transform hover:scale-[1.03]"
            />
          </div>

          {/* CENTER: desktop links */}
          <div className="hidden sm:flex items-center gap-9">
            {links.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`bg-transparent border-none text-[12px] font-bold tracking-[0.18em] cursor-pointer relative py-2 group transition-colors ${
                    isActive ? "text-red-600" : "text-stone-500 hover:text-red-600"
                  }`}
                >
                  {item.label}
                  {item.key === "notifications" && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-2.5 w-1.5 h-1.5 rounded-full bg-red-600" />
                  )}
                  <span
                    className={`absolute -bottom-0.5 left-0 w-full h-0.5 rounded-full bg-red-600 transition-transform duration-300 origin-left ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* RIGHT: notification bell (mobile only — desktop already has the NOTIFICATIONS
              link) / chat (desktop only — mobile already has Messages in the hamburger menu) + avatar / login */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!isGuest && (
              <button
                onClick={() => navigate("/notification")}
                className="sm:hidden relative text-stone-500 hover:text-red-600 text-xl bg-transparent border-none cursor-pointer transition-colors p-2 rounded-full hover:bg-stone-50"
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-0.5 bg-red-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            {!isGuest && (
              <button
                onClick={() => navigate("/chat")}
                className="hidden sm:inline-flex relative items-center justify-center text-stone-500 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors p-2 rounded-full hover:bg-stone-50"
                aria-label="Messages"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3a4 4 0 0 1-4 4h-1l-3 3v-3H12a4 4 0 0 1-4-4z" />
                  <path d="M6 15a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4" />
                </svg>
                {unreadMessageCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-0.5 bg-red-600 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadMessageCount}
                  </span>
                )}
              </button>
            )}

            {!isGuest && <div className="hidden sm:block w-px h-6 bg-stone-200 mx-1.5" />}

            {isGuest ? (
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer transition-colors ml-1"
              >
                Login
              </button>
            ) : (
              <div className="relative group ml-1">
                <button className="flex items-center gap-1.5 rounded-full cursor-pointer border-none bg-transparent p-0.5 pr-1.5 hover:bg-stone-50 transition-colors">
                  <Avatar name={me?.name} email={user?.sub} photo={me?.profilePhoto} size={34} />
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 group-hover:text-stone-600 transition-colors hidden sm:block">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                <div className="absolute right-0 top-full h-2 w-full" />

                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-stone-200 shadow-xl py-1.5 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="px-4 py-2.5 border-b border-stone-100 mb-1">
                    <p className="text-sm font-semibold text-stone-900 truncate">{me?.name || "My Account"}</p>
                    <p className="text-xs text-stone-400 truncate">{user?.sub}</p>
                  </div>
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
                  <div className="border-t border-stone-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 bg-transparent border-none cursor-pointer transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 sm:hidden bg-stone-900/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-72 bg-white flex flex-col py-5 px-4 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 px-1">
              <img src="/logo-dark.png" alt="ArtVerse" className="h-8 object-contain" />
              <button
                onClick={() => setMenuOpen(false)}
                className="text-stone-400 hover:text-stone-900 hover:bg-stone-50 text-xl bg-transparent border-none cursor-pointer rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-0.5">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-left text-stone-600 hover:text-red-600 hover:bg-stone-50 py-2.5 px-2 rounded-lg text-sm bg-transparent border-none cursor-pointer transition-colors"
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <button
                onClick={() => {
                  navigate("/exhibition");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 text-left text-stone-600 hover:text-red-600 hover:bg-stone-50 py-2.5 px-2 rounded-lg text-sm bg-transparent border-none cursor-pointer transition-colors"
              >
                <span className="text-base w-5 text-center flex-shrink-0">🎭</span>
                Exhibition
              </button>
            </div>

            <div className="mt-4 border-t border-stone-100 pt-3 flex flex-col gap-0.5">
              {isGuest ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/login");
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-left text-red-600 hover:bg-red-50 text-sm w-full py-2.5 px-2 rounded-lg font-bold bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">🔑</span>
                    Login
                  </button>
                  <button
                    onClick={() => {
                      navigate("/register");
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-left text-stone-600 hover:text-stone-900 hover:bg-stone-50 text-sm w-full py-2.5 px-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">✍️</span>
                    Register
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditProfileOpen(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-3 text-left text-stone-600 hover:text-red-600 hover:bg-stone-50 text-sm w-full py-2.5 px-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">✏️</span>
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 text-left text-red-600 hover:bg-red-50 text-sm w-full py-2.5 px-2 rounded-lg bg-transparent border-none cursor-pointer transition-colors"
                  >
                    <span className="text-base w-5 text-center flex-shrink-0">🚪</span>
                    Logout
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