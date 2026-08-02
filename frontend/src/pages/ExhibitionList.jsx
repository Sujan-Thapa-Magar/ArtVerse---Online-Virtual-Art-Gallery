import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API = "http://localhost:8080";

function imgUrl(u) {
  if (!u) return "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80";
  return u.startsWith("http") ? u : `${API}${u}`;
}

function formatRun(startDate, endDate) {
  const fmt = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (!startDate) return null;
  if (!endDate || new Date(endDate) < new Date(startDate)) return `From ${fmt(startDate)}`;
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

export default function ExhibitionList() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [exhibitions, setExhibitions] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch(`${API}/api/exhibitions`, { headers }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${API}/api/artworks`, { headers }).then(r => r.ok ? r.json() : []),
    ])
      .then(([exData, artData]) => {
        setExhibitions(Array.isArray(exData) ? exData : []);
        setArtworks(Array.isArray(artData) ? artData : []);
      })
      .catch(() => setError("Could not load exhibitions."))
      .finally(() => setLoading(false));
  }, [token]);

  // Every exhibition gets a cover pulled from its curating artist's own
  // work — no separate endpoint needed, and it's honest about what's on view.
  const coverFor = (exhibition) => {
    const byArtist = artworks.find(a => a.artist?.id === exhibition.artist?.id);
    return byArtist?.imageUrl || null;
  };

  return (
    <div className="min-h-screen bg-cream text-stone-900 selection:bg-red-100 selection:text-red-600">
      <Navbar active="exhibition" />

      {/* Header */}
      <div className="relative overflow-hidden pt-12 pb-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto border-b border-stone-200/60 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="uppercase tracking-[0.25em] font-bold text-[9px]">Curated Spaces</span>
          </div>
          <h1 className="font-display text-stone-900 font-bold leading-tight" style={{ fontSize: "clamp(34px, 5vw, 56px)" }}>
            Virtual Exhibitions
          </h1>
          <p className="text-stone-500 text-sm max-w-md mt-2">
            Themed collections curated by our artists — walk through each one at your own pace.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-6 h-6 rounded-full border-[2px] border-stone-200 border-t-red-600 animate-spin" />
            <p className="text-stone-400 text-xs tracking-widest uppercase font-bold">Loading Exhibitions…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-24 gap-4 max-w-md mx-auto text-center">
            <span className="text-4xl">🕊️</span>
            <p className="text-stone-600 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && exhibitions.length === 0 && (
          <div className="flex flex-col items-center py-28 gap-4 text-center max-w-sm mx-auto">
            <span className="text-3xl grayscale opacity-40">🎭</span>
            <h3 className="font-bold text-lg text-stone-800">No exhibitions yet</h3>
            <p className="text-stone-400 text-xs leading-relaxed">Artists haven't curated a virtual exhibition yet — check back soon.</p>
          </div>
        )}

        {!loading && !error && exhibitions.length > 0 && (
          <>
            <p className="text-stone-400 tracking-wider uppercase text-[10px] font-bold mb-8">
              {exhibitions.length} Exhibition{exhibitions.length !== 1 ? "s" : ""} On View
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exhibitions.map((ex) => {
                const cover = coverFor(ex);
                return (
                  <div
                    key={ex.id}
                    onClick={() => navigate(`/exhibition/${ex.id}`)}
                    className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm hover:shadow-xl hover:shadow-stone-950/10 transition-all duration-500"
                  >
                    <div className="relative h-56 overflow-hidden">
                      {cover ? (
                        <img
                          src={imgUrl(cover)}
                          alt={ex.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-stone-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <h3 className="font-display text-2xl font-bold text-white leading-tight">{ex.title}</h3>
                        {ex.artist?.name && (
                          <p className="text-stone-300 text-xs mt-1">Curated by {ex.artist.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex items-center justify-between gap-4">
                      {ex.description?.trim() ? (
                        <p className="text-stone-500 text-xs leading-relaxed line-clamp-2 flex-1">{ex.description}</p>
                      ) : formatRun(ex.startDate, ex.endDate) ? (
                        <p className="text-stone-400 text-xs tabular-nums flex-1">{formatRun(ex.startDate, ex.endDate)}</p>
                      ) : (
                        <span className="flex-1" />
                      )}
                      <span className="text-red-600 text-[10px] font-bold tracking-widest uppercase whitespace-nowrap flex items-center gap-1 group-hover:gap-2 transition-all">
                        Enter <span className="text-sm font-normal">→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
