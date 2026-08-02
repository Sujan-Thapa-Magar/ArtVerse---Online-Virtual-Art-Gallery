import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SUPPORT_EMAIL = "itsmesujan2003@gmail.com";
const SUPPORT_PHONE = "+977 9848938289";

const faqs = [
  {
    q: "How do I become a verified artist?",
    a: "Register with the Artist role and upload a photo of your ID card. Our admin team reviews every submission before your profile is fully verified and visible with a verified badge.",
  },
  {
    q: "What payment methods are supported?",
    a: "ArtVerse supports eSewa and Khalti — Nepal's most widely used digital wallets. Every payment is verified directly with the gateway before an order is confirmed.",
  },
  {
    q: "Is there a fee to sell my artwork?",
    a: "No — ArtVerse doesn't take a commission on sales. Artists keep full control of their pricing and portfolio.",
  },
  {
    q: "How long does artist verification take?",
    a: "Typically within a few business days. You'll see your status update to \"Verified\" on your profile once approved.",
  },
];

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = encodeURIComponent(
      `${form.message}\n\n— ${form.name} (${form.email})`
    );
    const subject = encodeURIComponent(form.subject || "ArtVerse Inquiry");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <Navbar active="contact" />

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          <span className="uppercase tracking-[0.25em] font-bold text-[9px]">Get In Touch</span>
        </div>
        <h1 className="font-display font-bold leading-tight mb-4" style={{ fontSize: "clamp(34px, 5vw, 56px)" }}>
          Contact Us
        </h1>
        <p className="text-stone-500 text-base leading-relaxed max-w-2xl mx-auto">
          Questions about buying, selling, or verification? We're a small team building ArtVerse
          from Nepal, and we read every message.
        </p>
      </div>

      {/* Info cards */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="block bg-stone-50 border border-stone-100 rounded-2xl p-6 text-center no-underline hover:border-red-200 hover:bg-red-50/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl mx-auto mb-4">📧</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Email</p>
            <p className="text-sm font-semibold text-stone-800 break-all">{SUPPORT_EMAIL}</p>
          </a>

          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
            className="block bg-stone-50 border border-stone-100 rounded-2xl p-6 text-center no-underline hover:border-red-200 hover:bg-red-50/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl mx-auto mb-4">📞</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Phone</p>
            <p className="text-sm font-semibold text-stone-800">{SUPPORT_PHONE}</p>
          </a>

          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-6 text-center">
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl mx-auto mb-4">📍</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">Based In</p>
            <p className="text-sm font-semibold text-stone-800">Kathmandu, Nepal 🇳🇵</p>
          </div>
        </div>
      </div>

      {/* Form + FAQ */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Contact form */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-5">Send a Message</h2>
            {sent ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                <span className="text-3xl block mb-3">✓</span>
                <h3 className="font-bold text-stone-900 text-sm mb-2">Opening</h3>
                <p className="text-stone-500 text-xs leading-relaxed mb-4">
                  We've pre-filled a message to {SUPPORT_EMAIL}. Just hit send from there.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="text-xs font-bold text-red-600 bg-transparent border-none cursor-pointer uppercase tracking-widest"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">YOUR NAME</label>
                  <input
                    type="text" name="name" required value={form.name} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-red-400 transition-colors"
                    placeholder="Sujan Thapa Magar"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">YOUR EMAIL</label>
                  <input
                    type="email" name="email" required value={form.email} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-red-400 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">SUBJECT</label>
                  <input
                    type="text" name="subject" value={form.subject} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-red-400 transition-colors"
                    placeholder="Artist verification question"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest text-stone-500 mb-1.5 font-medium">MESSAGE</label>
                  <textarea
                    name="message" required rows={5} value={form.message} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-red-400 transition-colors resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg border-none cursor-pointer transition-colors"
                >
                  Send Message
                </button>
                <p className="text-[11px] text-stone-400 text-center">
                </p>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900 mb-5">Frequently Asked</h2>
            <div className="flex flex-col gap-2.5">
              {faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} className="border border-stone-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white border-none cursor-pointer text-left"
                    >
                      <span className="text-sm font-semibold text-stone-800">{f.q}</span>
                      <span className={`text-red-600 text-lg flex-shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
                    </button>
                    {open && (
                      <div className="px-5 pb-4 -mt-1">
                        <p className="text-stone-500 text-xs leading-relaxed">{f.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
