import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-stone-900">
      <Navbar />

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

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pb-20">
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

          <section className="pt-6 border-t border-stone-100">
            <h2 className="text-xl font-bold text-stone-900 mb-3">Built With Care</h2>
            <p className="text-stone-600 text-sm leading-relaxed">
              ArtVerse is an independent project, built from the ground up to serve Nepal's growing
              community of artists and art lovers. We're just getting started.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}