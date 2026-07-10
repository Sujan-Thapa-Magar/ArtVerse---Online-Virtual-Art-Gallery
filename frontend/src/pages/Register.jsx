import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("register");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    discipline: "",
    role: "ARTIST",
  });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [idFile, setIdFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleIdUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdPreview(URL.createObjectURL(file));
      setIdFile(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("password", formData.password);
      form.append("role", formData.role);
      if (idFile) {
        form.append("idCard", idFile);
      }

      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        body: form,
      });
      const text = await response.text();
      if (response.ok) {
        setMessage("✅ Account created! You can now login.");
        setActiveTab("login");
      } else {
        setMessage("❌ " + text);
      }
    } catch {
      setMessage("❌ Could not connect to server.");
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const text = await response.text();
      if (response.ok) {
        login(text, { email: loginData.email });

        // If the user was redirected here from an artwork action
        // (like/follow/comment/buy), send them back to that artwork
        // so the page can resume the action automatically.
        const raw = sessionStorage.getItem("pendingArtworkAction");
        if (raw) {
          try {
            const pending = JSON.parse(raw);
            if (pending?.artworkId) {
              navigate(`/artwork/${pending.artworkId}`);
              setLoading(false);
              return;
            }
          } catch {
            sessionStorage.removeItem("pendingArtworkAction");
          }
        }

        navigate("/home");
      } else {
        setMessage("❌ " + text);
      }
    } catch {
      setMessage("❌ Could not connect to server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream">

      <Navbar />

      {/* ── Floating card — centered ── */}
      <div className="flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-xl bg-white rounded-2xl overflow-hidden border border-stone-200"
          style={{ boxShadow: "0 20px 50px rgba(28,25,23,0.08)" }}
        >
          <main className="px-10 py-10 md:px-12 md:py-12">

            <a href="/" className="text-2xl font-black tracking-widest text-stone-900 no-underline block text-center mb-6">
              Art<span className="text-red-600">Verse</span>
            </a>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              The Sacred Curator
            </h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              Enter the sanctum of contemporary expression.
            </p>

            {/* Tabs */}
            <div className="flex justify-center gap-8 border-b border-gray-200 mb-6">
              <button
                onClick={() => { setActiveTab("register"); setMessage(""); }}
                className={`text-xs tracking-widest pb-3 bg-transparent border-none cursor-pointer font-medium transition-colors ${
                  activeTab === "register"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-400"
                }`}
              >
                REGISTER
              </button>
              <button
                onClick={() => { setActiveTab("login"); setMessage(""); }}
                className={`text-xs tracking-widest pb-3 bg-transparent border-none cursor-pointer font-medium transition-colors ${
                  activeTab === "login"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-400"
                }`}
              >
                LOGIN
              </button>
            </div>

            {activeTab === "register" ? (
              <form onSubmit={handleRegister}>

                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative bg-gray-50 overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl text-gray-300">📷</span>
                      )}
                      <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center">
                        ✎
                      </div>
                    </div>
                  </label>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  <span className="text-xs tracking-widest text-gray-300 mt-2.5">UPLOAD PROFILE PHOTO</span>
                </div>

                {/* Full Name */}
                <div className="mb-5">
                  <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">FULL NAME</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Julianne Moore"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Email */}
                <div className="mb-5">
                  <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="curator@artverse.io"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="mb-5">
                  <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">PASSWORD</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Role Selector */}
                <div className="mb-5">
                  <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">I AM A</label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none appearance-none cursor-pointer"
                    >
                      <option value="ARTIST">Artist</option>
                      <option value="BUYER">Buyer / Art Lover</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                  </div>
                </div>

                {/* Artistic Discipline — only for ARTIST */}
                {formData.role === "ARTIST" && (
                  <div className="mb-5">
                    <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">ARTISTIC DISCIPLINE</label>
                    <div className="relative">
                      <select
                        name="discipline"
                        value={formData.discipline}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-400 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select your craft</option>
                        <option value="painting">Painting</option>
                        <option value="sculpture">Sculpture</option>
                        <option value="photography">Photography</option>
                        <option value="digital">Digital Art</option>
                        <option value="traditional">Traditional Art</option>
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                    </div>
                  </div>
                )}

                {/* ID Card Upload — only for ARTIST */}
                {formData.role === "ARTIST" && (
                  <div className="mb-5">
                    <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">
                      GOVERNMENT ID / CITIZENSHIP
                    </label>
                    <label htmlFor="id-upload" className="cursor-pointer">
                      <div className="w-full px-4 py-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors">
                        {idPreview ? (
                          <img src={idPreview} alt="ID preview" className="h-24 object-contain rounded" />
                        ) : (
                          <>
                            <span className="text-2xl text-gray-300">🪪</span>
                            <span className="text-xs tracking-widest text-gray-400">UPLOAD YOUR ID CARD</span>
                            <span className="text-xs text-gray-300">Citizenship, Passport or National ID</span>
                          </>
                        )}
                      </div>
                    </label>
                    <input id="id-upload" type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-red-600 text-white text-xs tracking-widest font-semibold rounded-md mb-4 hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "CREATING..." : formData.role === "ARTIST" ? "CREATE ARTIST ACCOUNT" : "CREATE BUYER ACCOUNT"}
                </button>

                <div className="text-center text-gray-300 text-xs mb-4">or</div>

                <button
                  type="button"
                  className="w-full py-3.5 bg-white text-gray-700 border border-gray-200 rounded-md text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-xs text-gray-300 mt-6 leading-relaxed">
                  By joining ArtVerse, you agree to our{" "}
                  <span className="text-gray-500 underline cursor-pointer">Curator Agreement</span>{" "}
                  and{" "}
                  <span className="text-gray-500 underline cursor-pointer">Privacy Mandate</span>
                </p>
              </form>

            ) : (

              <form onSubmit={handleLogin}>
                <div className="mb-5">
                  <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="curator@artverse.io"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-xs tracking-widest text-gray-500 mb-2 font-medium">PASSWORD</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-red-600 text-white text-xs tracking-widest font-semibold rounded-md mb-4 hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "LOGGING IN..." : "LOGIN"}
                </button>

                <div className="text-center text-gray-300 text-xs mb-4">or</div>

                <button
                  type="button"
                  className="w-full py-3.5 bg-white text-gray-700 border border-gray-200 rounded-md text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-xs text-gray-400 mt-6">
                  Don't have an account?{" "}
                  <span
                    className="text-red-600 underline cursor-pointer font-medium"
                    onClick={() => setActiveTab("register")}
                  >
                    Register here
                  </span>
                </p>
              </form>
            )}

            {message && (
              <p className="text-center text-sm mt-4 p-3 rounded-md bg-gray-100">
                {message}
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}