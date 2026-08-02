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

function imgUrl(u) {
  if (!u) return "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80";
  return u.startsWith("http") ? u : `http://localhost:8080${u}`;
}

const valueProps = [
  {
    icon: "◈",
    title: "Verified Artists",
    body: "Every artist submits a government ID and is reviewed by our team before a single work goes live. No anonymous listings.",
  },
  {
    icon: "◆",
    title: "Secure Payments",
    body: "Checkout runs through eSewa and Khalti. Every transaction is confirmed with the gateway server-side before an order is created.",
  },
  {
    icon: "◇",
    title: "Straight From the Studio",
    body: "No gallery commission and no middlemen. Message an artist directly, and what you pay is what they set.",
  },
];

/** Shared section masthead. Declared outside the component so React doesn't
 *  treat it as a brand-new component type on every render. */
function SectionHead({ kicker, title, action, onAction }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        <p className="text-red-600 text-xs font-bold tracking-widest uppercase mb-1.5">{kicker}</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-stone-900">{title}</h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-xs text-stone-500 hover:text-red-600 uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors font-bold flex items-center gap-1 whitespace-nowrap"
        >
          {action} <span className="text-sm font-normal">→</span>
        </button>
      )}
    </div>
  );
}

/** "3 Aug 2026" — or just the start date if the range is malformed. */
function formatRun(startDate, endDate) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (!startDate) return null;
  if (!endDate) return `From ${fmt(startDate)}`;
  // Guard against end-before-start data, which would otherwise render backwards.
  if (new Date(endDate) < new Date(startDate)) return `From ${fmt(startDate)}`;
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState("BUYER");
  const [exhibition, setExhibition] = useState(null);
  const [artworks, setArtworks] = useState([]);

  const token = localStorage.getItem("token");
  const isGuest = !token;

  useEffect(() => {
    const user = getCurrentUser();
    if (user) setRole(user.role || "BUYER");

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    fetch("http://localhost:8080/api/artworks", { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setArtworks(data); })
      .catch(() => {});

    fetch("http://localhost:8080/api/exhibitions", { headers: authHeaders })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setExhibition(data[0]); })
      .catch(() => {});
  }, []);

  // Only for the banner CTA below, which is about this one featured
  // exhibition specifically. Quick Actions elsewhere link to the full list.
  const enterFeaturedExhibition = () => navigate(exhibition ? `/exhibition/${exhibition.id}` : "/exhibition");

  const isArtist = role === "ARTIST";
  const isAdmin = role === "ADMIN";

  // ── Derived views over the same artwork list ──
  const featured = artworks.slice(0, 8);

  // Real categories artists actually picked, each with a count and a cover image.
  const categories = Object.values(
    artworks.reduce((acc, a) => {
      const key = (a.category || "").trim();
      if (!key) return acc;
      if (!acc[key]) acc[key] = { name: key, count: 0, cover: a.imageUrl };
      acc[key].count += 1;
      return acc;
    }, {})
  ).sort((x, y) => y.count - x.count);

  // Genuinely most-viewed — viewCount is incremented server-side per visitor.
  const mostViewed = [...artworks]
    .filter(a => (a.viewCount || 0) > 0)
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 4);

  // Cover art for the exhibition banner: prefer an artwork sharing the
  // exhibition's title, else the same artist's work, else the newest piece.
  const exhibitionCover = (() => {
    if (!exhibition || artworks.length === 0) return null;
    const byTitle = artworks.find(
      a => a.title?.trim().toLowerCase() === exhibition.title?.trim().toLowerCase()
    );
    if (byTitle) return byTitle.imageUrl;
    const byArtist = artworks.find(a => a.artist?.id === exhibition.artist?.id);
    return (byArtist || artworks[0]).imageUrl;
  })();

  const quickActionCls =
    "bg-white border border-stone-200 rounded-xl p-5 flex flex-col items-center gap-3 hover:border-red-200 hover:shadow-lg hover:shadow-stone-950/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer";
  const quickActionIconCls =
    "w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-xl";

  return (
    <div className="min-h-screen bg-cream text-stone-900">

      <Navbar active="home" />

      {/* ── Hero ── */}
      <div className="relative w-full h-[26rem] md:h-[34rem] overflow-hidden">
        <img
          src="/homepage.png"
          alt="Hero"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/10" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-6 md:px-10 pb-14 md:pb-20">
            <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 inline-block mb-4 tracking-[0.2em] uppercase rounded-full">
              Nepal's Virtual Art Gallery
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.05] mb-5 max-w-2xl">
              The Sacred Curator
            </h1>
            <p className="text-stone-200 text-sm md:text-base max-w-md mb-8 leading-relaxed">
              Original work from Nepali artists, curated for collectors who want more than a print.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/gallery")}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-6 py-3 rounded-full transition cursor-pointer border-none"
              >
                Explore Art →
              </button>
              {isGuest && (
                <button
                  onClick={() => navigate("/register")}
                  className="flex items-center gap-2 border border-white/70 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-white hover:text-stone-900 transition cursor-pointer bg-transparent"
                >
                  Join ArtVerse
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured Works ── */}
      <section className="px-6 lg:px-10 py-14 max-w-7xl mx-auto">
        <SectionHead
          kicker="Curated Selection"
          title="Featured Works"
          action="View All"
          onAction={() => navigate("/gallery")}
        />

        {featured.length === 0 ? (
          <p className="text-stone-400 text-sm">No artworks to show yet.</p>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
            {featured.map((work) => (
              <div
                key={work.id}
                onClick={() => navigate(`/artwork/${work.id}`)}
                className="flex-shrink-0 w-48 md:w-56 cursor-pointer group snap-start"
              >
                <div
                  className="relative overflow-hidden bg-white shadow-sm border border-stone-200/60 rounded-lg transition-all duration-500 ease-out group-hover:shadow-xl group-hover:shadow-stone-950/10 mb-3"
                  style={{ aspectRatio: "4/5" }}
                >
                  <img
                    src={imgUrl(work.imageUrl)}
                    alt={work.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {work.forSale && work.price && (
                    <div className="absolute bottom-3 left-3 text-white font-bold text-sm opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      NPR {Number(work.price).toLocaleString()}
                    </div>
                  )}
                </div>
                <span className="text-red-600 text-[9px] tracking-[0.2em] uppercase font-bold block mb-0.5">
                  {work.category || work.medium || "Exhibit"}
                </span>
                <p className="text-sm font-semibold mt-0.5 truncate text-stone-900 group-hover:text-red-600 transition-colors">{work.title}</p>
                <p className="text-xs text-stone-400 truncate">{work.artist?.name || "Unknown Artist"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Browse by Category ── (white band for rhythm) */}
      {categories.length > 0 && (
        <section className="bg-white border-y border-stone-200/70 py-14">
          <div className="px-6 lg:px-10 max-w-7xl mx-auto">
            <SectionHead kicker="Find Your Medium" title="Browse by Category" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((c) => (
                <div
                  key={c.name}
                  onClick={() => navigate("/gallery")}
                  className="relative overflow-hidden rounded-xl cursor-pointer group h-44"
                >
                  <img
                    src={imgUrl(c.cover)}
                    alt={c.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white leading-tight">{c.name}</h3>
                      <p className="tabular-nums text-[10px] uppercase tracking-widest text-stone-300 font-bold mt-1">
                        {c.count} work{c.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-white text-lg opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Most Viewed ── (real viewCount data) */}
      {mostViewed.length > 0 && (
        <section className="px-6 lg:px-10 py-14 max-w-7xl mx-auto">
          <SectionHead
            kicker="What Collectors Are Watching"
            title="Most Viewed"
            action="Browse Gallery"
            onAction={() => navigate("/gallery")}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {mostViewed.map((a, i) => (
              <div
                key={a.id}
                onClick={() => navigate(`/artwork/${a.id}`)}
                className="cursor-pointer group"
              >
                <div
                  className="relative overflow-hidden bg-white shadow-sm border border-stone-200/60 rounded-lg mb-3 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-stone-950/10"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={imgUrl(a.imageUrl)}
                    alt={a.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Rank badge */}
                  <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-stone-950/70 backdrop-blur-sm text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-stone-700 text-[10px] font-bold px-2 py-1 rounded-full tabular-nums">
                    {a.viewCount} views
                  </span>
                </div>
                <p className="text-sm font-semibold truncate text-stone-900 group-hover:text-red-600 transition-colors">{a.title}</p>
                <p className="text-xs text-stone-400 truncate">{a.artist?.name || "Unknown Artist"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Why ArtVerse ── (white band) */}
      <section className="bg-white border-y border-stone-200/70 py-14">
        <div className="px-6 lg:px-10 max-w-7xl mx-auto">
          <SectionHead kicker="Why ArtVerse" title="Built for Artists, Not Middlemen" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueProps.map((v) => (
              <div key={v.title} className="border-l-2 border-red-600 pl-5 py-1">
                <span className="text-red-600 text-2xl leading-none block mb-3">{v.icon}</span>
                <h3 className="font-display text-lg font-bold text-stone-900 mb-2">{v.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Actions: Artist ── */}
      {!isGuest && isArtist && (
        <section className="px-6 lg:px-10 py-14 max-w-7xl mx-auto">
          <SectionHead kicker="Your Workspace" title="Artist Tools" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Upload", icon: "➕", action: () => navigate("/upload") },
              { label: "My Studio", icon: "📊", action: () => navigate("/dashboard") },
              { label: "Messages", icon: "💬", action: () => navigate("/chat") },
              { label: "Exhibition", icon: "🎭", action: () => navigate("/exhibition") },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className={quickActionCls}>
                <span className={quickActionIconCls}>{item.icon}</span>
                <span className="text-xs font-semibold text-stone-700">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Actions: Buyer ── */}
      {!isGuest && !isArtist && !isAdmin && (
        <section className="px-6 lg:px-10 py-14 max-w-7xl mx-auto">
          <SectionHead kicker="Your Account" title="Quick Actions" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Gallery", icon: "🖼", action: () => navigate("/gallery") },
              { label: "My Orders", icon: "🛍", action: () => navigate("/profile") },
              { label: "Messages", icon: "💬", action: () => navigate("/chat") },
              { label: "Exhibition", icon: "🎭", action: () => navigate("/exhibition") },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className={quickActionCls}>
                <span className={quickActionIconCls}>{item.icon}</span>
                <span className="text-xs font-semibold text-stone-700">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Quick Actions: Guest ── */}
      {isGuest && (
        <section className="px-6 lg:px-10 py-14 max-w-7xl mx-auto">
          <SectionHead kicker="Get Started" title="Explore ArtVerse" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Gallery", icon: "🖼", action: () => navigate("/gallery") },
              { label: "Exhibition", icon: "🎭", action: () => navigate("/exhibition") },
              { label: "Login", icon: "🔑", action: () => navigate("/login") },
            ].map((item) => (
              <button key={item.label} onClick={item.action} className={quickActionCls}>
                <span className={quickActionIconCls}>{item.icon}</span>
                <span className="text-xs font-semibold text-stone-700">{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Exhibition Banner ──
          Reads the real, currently-listed exhibition rather than hardcoded copy,
          and leads with actual artwork instead of a flat colour field.          */}
      {exhibition && (
        <section className="mx-6 lg:mx-auto mb-16 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-2xl shadow-xl shadow-stone-950/10">

            {/* Artwork side */}
            <div className="relative min-h-[16rem] md:min-h-[26rem] overflow-hidden group">
              <img
                src={imgUrl(exhibitionCover)}
                alt={exhibition.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />
              {/* Warm wash ties the photo to the brand red without muddying it */}
              <div className="absolute inset-0 bg-gradient-to-tr from-red-950/50 via-transparent to-transparent" />
              {/* Seam blend into the content panel on desktop */}
              <div className="hidden md:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-[#1a1512]" />
            </div>

            {/* Content side */}
            <div
              className="relative flex flex-col justify-center px-8 sm:px-12 py-14 md:py-16"
              style={{ background: "linear-gradient(135deg, #1a1512 0%, #241a17 55%, #2e1a18 100%)" }}
            >
              {/* Faint dot texture, kept very low so it reads as paper grain */}
              <div
                className="absolute inset-0 opacity-[0.05] pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "22px 22px",
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-[0.25em]">
                    Now Exhibiting
                  </span>
                </div>

                <h2 className="font-display text-3xl md:text-5xl font-bold text-white leading-[1.1] mb-5">
                  {exhibition.title}
                </h2>

                {exhibition.description?.trim() && (
                  <p className="text-stone-400 text-sm mb-6 max-w-sm leading-relaxed">
                    {exhibition.description}
                  </p>
                )}

                {/* Real metadata, on hairlines rather than in boxes */}
                <div className="flex flex-wrap gap-x-10 gap-y-4 mb-9 pt-6 border-t border-white/10">
                  {exhibition.artist?.name && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/35 font-bold mb-1.5">Curated By</p>
                      <p className="text-sm text-white font-medium">{exhibition.artist.name}</p>
                    </div>
                  )}
                  {formatRun(exhibition.startDate, exhibition.endDate) && (
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/35 font-bold mb-1.5">On View</p>
                      <p className="text-sm text-white font-medium tabular-nums">
                        {formatRun(exhibition.startDate, exhibition.endDate)}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={enterFeaturedExhibition}
                  className="self-start bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-8 py-3.5 rounded-full transition-all tracking-widest uppercase cursor-pointer border-none hover:gap-3 inline-flex items-center gap-2"
                >
                  Enter Exhibition <span className="text-sm font-normal">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Quote ── */}
      <div className="px-6 lg:px-10 mb-16 max-w-7xl mx-auto">
        <blockquote className="font-display text-xl md:text-2xl italic text-stone-700 border-l-2 border-red-600 pl-6">
          "Art is not what you see, but what you make others see through the lens of history."
        </blockquote>
        <p className="text-xs text-stone-400 mt-2 pl-6">— ArtVerse</p>
      </div>

      <Footer />
    </div>
  );
}
