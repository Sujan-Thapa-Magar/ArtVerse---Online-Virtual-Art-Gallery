import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

const values = [
  { icon: "🎨", title: "Authenticity", desc: "Every artist is verified before their work goes live — no anonymous listings, no stolen work." },
  { icon: "🔐", title: "Security", desc: "JWT authentication, encrypted passwords, and verified payment gateways protect every transaction." },
  { icon: "🌍", title: "Accessibility", desc: "No gallery fees, no geographic barriers — any artist in Nepal can showcase work to a global audience." },
  { icon: "🤝", title: "Community", desc: "Direct messaging, comments, and follows let buyers and artists build real relationships, not just transactions." },
];

const steps = [
  { num: "01", title: "Artists Sign Up", desc: "Artists register, upload an ID card for verification, and build a professional digital portfolio." },
  { num: "02", title: "Work Gets Verified", desc: "Our admin team reviews and verifies each artist before their profile is fully activated." },
  { num: "03", title: "Buyers Discover", desc: "Collectors browse the gallery, explore virtual exhibitions, and connect directly with artists." },
  { num: "04", title: "Secure Purchase", desc: "Buyers check out safely through eSewa or Khalti, with every payment verified before an order is created." },
];

export default function About() {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState({ artworks: 0, artists: 0, categories: 0 });

  const user = getCurrentUser();
  const isGuest = !user;
  const isArtist = user?.role === "ARTIST";

  useEffect(() => {
    fetch(`${API}/api/artworks`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const artistIds = new Set(data.map((a) => a.artist?.id).filter(Boolean));
        const categories = new Set(data.map((a) => a.category).filter(Boolean));
        setLiveStats({ artworks: data.length, artists: artistIds.size, categories: categories.size });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <Navbar active="about" />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          <span className="uppercase tracking-[0.25em] font-bold text-[9px]">Our Story</span>
        </div>
        <h1 className="font-black tracking-tight leading-tight mb-4" style={{ fontSize: "clamp(32px, 5vw, 52px)" }}>
          About ArtVerse
        </h1>
        <p className="text-stone-500 text-base leading-relaxed max-w-2xl mx-auto">
          Nepal's first virtual art gallery — built to give local artists a real home online,
          and to bring collectors closer to original work they'd otherwise never discover.
        </p>
      </div>

      {/* Live Stats */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pb-16">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 bg-stone-50 border border-stone-100 rounded-3xl p-6 sm:p-10">
          {[
            { label: "Artworks Listed", value: liveStats.artworks },
            { label: "Artists Onboard", value: liveStats.artists },
            { label: "Categories", value: liveStats.categories },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-black text-red-600 leading-none mb-2" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>
                {s.value}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pb-16">
        <div className="space-y-10">

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">Why We Started</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              For years, Nepali artists have relied on scattered Instagram posts and word-of-mouth
              to sell their work — with no dedicated platform, no secure way to handle payments,
              and no way to reach collectors beyond their immediate circle. Physical galleries remain
              concentrated in Kathmandu, leaving talented artists across the country with few ways
              to showcase what they create. ArtVerse exists to close that gap.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">What We Offer</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              A dedicated online gallery where artists can upload and showcase their work, host
              virtual exhibitions, and connect directly with buyers — all backed by a secure
              platform built specifically for this purpose. Buyers can browse freely, follow their
              favorite artists, and purchase original pieces with confidence.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">Our Mission</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              To give every Nepali artist — regardless of where they're based — a real, professional
              platform to be discovered, and to make it simple for collectors anywhere in the world
              to find and support original Nepali art.
            </p>
          </section>

        </div>
      </div>

      {/* Values */}
      <div className="bg-stone-50 border-y border-stone-100 py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-red-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-2">What We Stand For</p>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.title} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-xl mb-4">
                  {v.icon}
                </div>
                <h3 className="font-bold text-stone-900 text-sm mb-2">{v.title}</h3>
                <p className="text-stone-500 text-xs leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-16">
        <div className="text-center mb-10">
          <p className="text-red-600 text-[10px] font-bold tracking-[0.25em] uppercase mb-2">The Process</p>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">How ArtVerse Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="relative border border-stone-100 rounded-2xl p-6">
              <span className="text-3xl font-black text-stone-100 absolute top-4 right-5">{s.num}</span>
              <h3 className="font-bold text-stone-900 text-sm mb-2 relative">{s.title}</h3>
              <p className="text-stone-500 text-xs leading-relaxed relative">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Built with care + CTA */}
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pb-16">
        <section className="pt-6 border-t border-stone-100 mb-12">
          <h2 className="text-xl font-bold text-stone-900 mb-3">Built With Care</h2>
          <p className="text-stone-600 text-sm leading-relaxed">
            ArtVerse is an independent project, built from the ground up to serve Nepal's growing
            community of artists and art lovers. We're just getting started.
          </p>
        </section>

        <div className="bg-red-600 rounded-3xl px-8 py-10 text-center">
          <h3 className="text-white font-black text-xl sm:text-2xl mb-2">Ready to join the gallery?</h3>
          <p className="text-red-100 text-sm mb-6 max-w-md mx-auto">
            Whether you're an artist looking to showcase your work, or a collector looking to discover something new.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isGuest ? (
              <button
                onClick={() => navigate("/register")}
                className="bg-white text-red-600 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full border-none cursor-pointer hover:bg-red-50 transition-colors"
              >
                Join as Artist
              </button>
            ) : isArtist ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-white text-red-600 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full border-none cursor-pointer hover:bg-red-50 transition-colors"
              >
                Go to My Studio
              </button>
            ) : null}
            <button
              onClick={() => navigate("/gallery")}
              className="bg-transparent text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full border border-white/40 cursor-pointer hover:bg-white/10 transition-colors"
            >
              Explore Gallery
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
