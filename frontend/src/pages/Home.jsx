import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const featuredWorks = [
  { id: 1, title: "Eternal Mandala", artist: "Sujan Shrestha", price: "NPR 12,400", image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300&q=80" },
  { id: 2, title: "Himalayan Dawn", artist: "Priya Maharjan", price: "NPR 8,500", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80" },
  { id: 3, title: "Forms & Silence", artist: "Rohan Gurung", price: "NPR 15,000", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80" },
  { id: 4, title: "Community Paths", artist: "Nisha Tamang", price: "NPR 6,200", image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=300&q=80" },
  { id: 5, title: "Echoes of Time", artist: "Maya Thapa", price: "NPR 9,800", image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=300&q=80" },
];

export default function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white font-sans">

      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-black border-b border-zinc-800">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white text-xl">☰</button>
        <span
          className="text-2xl font-bold tracking-widest cursor-pointer"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          onClick={() => navigate("/home")}
        >
          ArtVerse
        </span>
        <button
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold"
        >
          A
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="bg-zinc-900 px-6 py-4 flex flex-col gap-3 text-sm border-b border-zinc-800">
          <button onClick={() => navigate("/gallery")} className="text-left text-zinc-300 hover:text-white">Gallery</button>
          <button onClick={() => navigate("/upload")} className="text-left text-zinc-300 hover:text-white">Upload Artwork</button>
          <button onClick={() => navigate("/dashboard")} className="text-left text-zinc-300 hover:text-white">Dashboard</button>
          <button onClick={() => { logout(); navigate("/login"); }} className="text-left text-red-400 hover:text-red-300">Logout</button>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative w-full h-72 md:h-96 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&q=80"
          alt="Hero"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-10">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 inline-block mb-3 tracking-widest uppercase">
            Nepal's First Virtual Art Gallery
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            The Sacred Curator
          </h1>
          <button
            onClick={() => navigate("/gallery")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded transition"
          >
            Explore Art →
          </button>
        </div>
      </div>

      {/* Featured Works */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-red-500 text-xs font-bold tracking-widest uppercase mb-1">Curated Selection</p>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Featured Works
            </h2>
          </div>
          <button
            onClick={() => navigate("/gallery")}
            className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest"
          >
            View All
          </button>
        </div>

        {/* Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {featuredWorks.map((work) => (
            <div
              key={work.id}
              onClick={() => navigate(`/artwork/${work.id}`)}
              className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded overflow-hidden bg-zinc-800">
                <img
                  src={work.image}
                  alt={work.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-xs font-semibold mt-2 truncate">{work.title}</p>
              <p className="text-xs text-zinc-400 truncate">{work.artist}</p>
              <p className="text-xs text-red-500 font-bold">{work.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Exhibition Banner */}
      <div className="mx-6 mb-8 bg-zinc-900 border border-zinc-700 rounded-xl p-8 text-center">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Limited Time</p>
        <h2
          className="text-2xl md:text-3xl font-bold mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Sacred Geometry:<br />The 2024 Collection
        </h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
          Dive into the deep spiritual connection between ancient Buddhist mathematics and contemporary digital art forms.
        </p>
        <button
          onClick={() => navigate("/exhibition")}
          className="border border-white text-white text-xs font-bold px-6 py-2 rounded hover:bg-white hover:text-black transition tracking-widest uppercase"
        >
          Reserve Your Access
        </button>
      </div>

      {/* Quote Section */}
      <div className="px-6 mb-8">
        <blockquote
          className="text-lg md:text-xl italic text-zinc-300 border-l-2 border-red-500 pl-5"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          "Art is not what you see, but what you make others see through the lens of history."
        </blockquote>
        <p className="text-xs text-zinc-500 mt-2 pl-5">— Chief Curator, ArtVerse</p>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 flex justify-around items-center py-3 z-50">
        <button onClick={() => navigate("/home")} className="flex flex-col items-center gap-1 text-white">
          <span className="text-lg">⌂</span>
          <span className="text-xs">Home</span>
        </button>
        <button onClick={() => navigate("/gallery")} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white">
          <span className="text-lg">⌕</span>
          <span className="text-xs">Search</span>
        </button>
        <button onClick={() => navigate("/upload")} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white">
          <span className="text-lg">＋</span>
          <span className="text-xs">Post</span>
        </button>
        <button onClick={() => navigate("/profile")} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white">
          <span className="text-lg">👤</span>
          <span className="text-xs">Profile</span>
        </button>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}