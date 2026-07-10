import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const categories = ["ALL", "RENAISSANCE", "IMPRESSIONISM", "MINIMALIST", "CONTEMPORARY", "SURREALISM"];

export default function Gallery() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState("ALL");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState({});
  const [hoverId, setHoverId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const r = await fetch("http://localhost:8080/api/artworks", { headers });
        if (!r.ok) throw new Error();
        setArtworks(await r.json());
      } catch {
        setError("Could not connect to server.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const toggleLike = (e, id) => {
    e.stopPropagation();
    if (!token) { navigate("/login"); return; }
    setLiked(p => ({ ...p, [id]: !p[id] }));
  };

  const artistName = a => {
    if (!a) return "Unknown Artist";
    return typeof a === "string" ? a : (a.name || a.email || "Unknown Artist");
  };

  const imgUrl = u => {
    if (!u) return "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80";
    return u.startsWith("http") ? u : `http://localhost:8080${u}`;
  };

  const filtered = artworks.filter(art => {
    const cm = activeCat === "ALL" || (art.category || "").toUpperCase() === activeCat;
    const q = search.toLowerCase();
    return cm && ((art.title || "").toLowerCase().includes(q) || artistName(art.artist).toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-cream text-stone-900 selection:bg-red-100 selection:text-red-600">

      <Navbar active="gallery" />

      {/* Hero / Header Section */}
      <div className="relative overflow-hidden pt-12 pb-6 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/60 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="uppercase tracking-[0.25em] font-bold text-[9px]">Live Collection</span>
            </div>
            <h1 className="text-stone-900 font-black tracking-tight leading-tight" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
              The Curated Gallery
            </h1>
            <p className="text-stone-500 text-sm max-w-md mt-2">Explore original masterpieces and contemporary discoveries directly from exceptional creators.</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:max-w-sm self-center md:self-end">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-xs pointer-events-none">🔍</span>
            <input
              type="text"
              placeholder="Search masterworks, artists..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full py-3.5 pr-4 rounded-xl text-sm text-stone-900 outline-none border transition-all duration-300 bg-white border-stone-200 shadow-sm focus:border-red-600 focus:ring-1 focus:ring-red-600 pl-11"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="sticky top-16 z-30 bg-cream/80 backdrop-blur-md border-b border-stone-200/40 py-2">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => {
            const a = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`flex-shrink-0 border-none py-2 px-4 text-[10px] font-bold tracking-[0.15em] cursor-pointer transition-all duration-300 rounded-full ${
                  a ? "bg-red-600 text-white" : "bg-transparent text-stone-500 hover:text-red-600"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        {!loading && !error && filtered.length > 0 && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-stone-400 tracking-wider uppercase text-[10px] font-bold">{filtered.length} Work{filtered.length !== 1 ? "s" : ""} Unveiled</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-6 h-6 rounded-full border-[2px] border-stone-200 border-t-red-600 animate-spin" />
            <p className="text-stone-400 text-xs tracking-widest uppercase font-bold">Curating Feed…</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center py-24 gap-4 max-w-md mx-auto text-center">
            <span className="text-4xl">🕊️</span>
            <p className="text-stone-600 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="text-xs font-bold tracking-widest uppercase px-6 py-3 rounded-xl text-white border-none cursor-pointer bg-red-600 hover:bg-red-700 transition-colors">Reset Session</button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center py-28 gap-4 text-center max-w-sm mx-auto">
            <span className="text-3xl grayscale opacity-40">🎨</span>
            <h3 className="font-bold text-lg text-stone-800">No matching works found</h3>
            <p className="text-stone-400 text-xs leading-relaxed">Adjust your criteria or query parameters. The artwork might be archived or filed under a separate movement.</p>
          </div>
        )}

        {/* Artwork Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {filtered.map(art => {
              const isLiked = liked[art.id];
              const isHov = hoverId === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => navigate(`/artwork/${art.id}`)}
                  onMouseEnter={() => setHoverId(art.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="cursor-pointer flex flex-col group"
                >
                  {/* Canvas framing */}
                  <div className="relative overflow-hidden bg-white shadow-sm border border-stone-200/60 rounded-lg transition-all duration-500 ease-out group-hover:shadow-xl group-hover:shadow-stone-950/5 mb-4" style={{ aspectRatio: "4/5" }}>
                    <img
                      src={imgUrl(art.imageUrl)}
                      alt={art.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-[1.03]"
                      onError={e => { e.target.src = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80"; }}
                    />

                    <div className={`absolute inset-0 bg-gradient-to-t from-stone-950/40 via-stone-900/0 to-transparent transition-opacity duration-300 ${isHov ? "opacity-100" : "opacity-0"}`} />

                    {/* Heart interaction */}
                    <button
                      onClick={e => toggleLike(e, art.id)}
                      className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/90 shadow-md hover:bg-white ${isLiked ? "text-red-600" : "text-stone-400"}`}
                      style={{
                        transform: isHov ? "translateY(0) scale(1)" : "translateY(-4px) scale(0.95)",
                        opacity: isHov || isLiked ? 1 : 0
                      }}
                    >
                      {isLiked ? "♥" : "♡"}
                    </button>

                    {/* Price tag reveal */}
                    {art.forSale && art.price && (
                      <div className={`absolute bottom-4 left-4 font-bold text-white transition-all duration-300 translate-y-2 ${isHov ? "opacity-100 translate-y-0" : "opacity-0"}`} style={{ fontSize: 15 }}>
                        NPR {Number(art.price).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Typographic details */}
                  <div className="flex flex-col flex-grow px-1">
                    <span className="text-red-600 text-[9px] tracking-[0.2em] uppercase font-bold mb-1">
                      {art.medium || art.category || "EXHIBIT"}
                    </span>
                    <h3 className="font-bold text-stone-900 tracking-tight leading-snug group-hover:text-red-600 transition-colors duration-200 text-base">
                      {art.title}
                    </h3>
                    <p className="text-stone-400 text-xs mt-0.5 mb-3">{artistName(art.artist)}</p>

                    <div className="mt-auto pt-3 border-t border-stone-100 flex items-center justify-between">
                      {art.forSale && art.price ? (
                        <span className="font-semibold text-stone-900 text-xs tracking-tight">NPR {Number(art.price).toLocaleString()}</span>
                      ) : (
                        <span className="text-stone-300 text-[10px] font-bold tracking-widest uppercase">Archived</span>
                      )}

                      <span className="text-[10px] font-bold tracking-widest text-stone-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-300 flex items-center gap-1">
                        VIEW <span className="text-xs font-normal">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
