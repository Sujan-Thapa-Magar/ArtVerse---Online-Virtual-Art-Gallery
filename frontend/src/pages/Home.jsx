import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState("BUYER");
  const [exhibitionId, setExhibitionId] = useState(null);
  const [featuredWorks, setFeaturedWorks] = useState([]);

  const token = localStorage.getItem("token");
  const isGuest = !token;

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setRole(user.role || "BUYER");

    const artworksHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("http://localhost:8080/api/artworks", {
      headers: artworksHeaders,
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.slice(0, 5).map((a) => ({
            id: a.id,
            title: a.title,
            artist: a.artist?.name || "Unknown Artist",
            price: `NPR ${Number(a.price).toLocaleString()}`,
            image: a.imageUrl
              ? a.imageUrl
              : "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80",
          }));
          setFeaturedWorks(mapped);
        }
      })
      .catch(() => {});

    fetch("http://localhost:8080/api/exhibitions", {
      headers: artworksHeaders,
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) setExhibitionId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const goToExhibition = () => navigate(exhibitionId ? `/exhibition/${exhibitionId}` : "/home");

  const isArtist = role === "ARTIST";
  const isAdmin = role === "ADMIN";

  const quickActionCls =
    "bg-white border border-stone-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-red-600 hover:shadow-md transition cursor-pointer";

  return (
    <div className="min-h-screen bg-cream text-stone-900">

      <Navbar active="home" />

      {/* Hero Section */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&q=80"
          alt="Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 inline-block mb-3 tracking-widest uppercase rounded">
            Nepal's First Virtual Art Gallery
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
            The Sacred Curator
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/gallery")}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded transition cursor-pointer border-none"
            >
              Explore Art →
            </button>
            {isGuest && (
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 border border-white text-white text-sm font-semibold px-5 py-2 rounded hover:bg-white hover:text-stone-900 transition cursor-pointer bg-transparent"
              >
                Join ArtVerse
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Featured Works */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-red-600 text-xs font-bold tracking-widest uppercase mb-1">Curated Selection</p>
            <h2 className="text-xl font-bold text-stone-900">Featured Works</h2>
          </div>
          <button
            onClick={() => navigate("/gallery")}
            className="text-xs text-stone-500 hover:text-red-600 uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
          >
            View All
          </button>
        </div>

        {featuredWorks.length === 0 ? (
          <p className="text-stone-400 text-sm">No artworks to show yet.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {featuredWorks.map((work) => (
              <div
                key={work.id}
                onClick={() => navigate(`/artwork/${work.id}`)}
                className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden bg-stone-200 border border-stone-200 shadow-sm">
                  <img
                    src={work.image}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-xs font-semibold mt-2 truncate text-stone-900">{work.title}</p>
                <p className="text-xs text-stone-500 truncate">{work.artist}</p>
                <p className="text-xs text-red-600 font-bold">{work.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions for Artist */}
      {!isGuest && isArtist && (
        <div className="px-6 mb-8 max-w-7xl mx-auto">
          <p className="text-red-600 text-xs font-bold tracking-widest uppercase mb-3">Artist Tools</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Upload", icon: "➕", action: () => navigate("/upload") },
              { label: "My Studio", icon: "📊", action: () => navigate("/dashboard") },
              { label: "Messages", icon: "💬", action: () => navigate("/chat") },
              { label: "Exhibition", icon: "🎭", action: goToExhibition },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className={quickActionCls}>
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-stone-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions for Buyer */}
      {!isGuest && !isArtist && !isAdmin && (
        <div className="px-6 mb-8 max-w-7xl mx-auto">
          <p className="text-red-600 text-xs font-bold tracking-widest uppercase mb-3">Quick Actions</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Gallery", icon: "🖼", action: () => navigate("/gallery") },
              { label: "My Orders", icon: "🛍", action: () => navigate("/profile") },
              { label: "Messages", icon: "💬", action: () => navigate("/chat") },
              { label: "Exhibition", icon: "🎭", action: goToExhibition },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className={quickActionCls}>
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-stone-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions for Guest */}
      {isGuest && (
        <div className="px-6 mb-8 max-w-7xl mx-auto">
          <p className="text-red-600 text-xs font-bold tracking-widest uppercase mb-3">Explore ArtVerse</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Gallery", icon: "🖼", action: () => navigate("/gallery") },
              { label: "Exhibition", icon: "🎭", action: goToExhibition },
              { label: "Login", icon: "🔑", action: () => navigate("/login") },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className={quickActionCls}>
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-stone-600">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exhibition Banner */}
      <div className="mx-6 mb-8 max-w-7xl lg:mx-auto bg-white border border-stone-200 rounded-xl p-8 text-center shadow-sm">
        <p className="text-xs text-red-600 font-bold uppercase tracking-widest mb-2">Limited Time</p>
        <h2 className="text-2xl md:text-3xl font-black mb-3 text-stone-900">
          Sacred Geometry:<br />The 2024 Collection
        </h2>
        <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
          Dive into the deep spiritual connection between ancient Buddhist mathematics and contemporary digital art forms.
        </p>
        <button
          onClick={goToExhibition}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded transition tracking-widest uppercase cursor-pointer border-none"
        >
          Reserve Your Access
        </button>
      </div>

      {/* Quote */}
      <div className="px-6 mb-8 max-w-7xl mx-auto">
        <blockquote className="text-lg md:text-xl italic text-stone-700 border-l-2 border-red-600 pl-5">
          "Art is not what you see, but what you make others see through the lens of history."
        </blockquote>
        <p className="text-xs text-stone-400 mt-2 pl-5">— Chief Curator, ArtVerse</p>
      </div>

      <Footer />
    </div>
  );
}
