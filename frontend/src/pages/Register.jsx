import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { loadGoogleIdentityScript } from "../utils/loadGoogleIdentityScript";

// Create your own OAuth 2.0 Client ID (Web application) at
// https://console.cloud.google.com/apis/credentials, add http://localhost:5173
// as an Authorized JavaScript origin, then paste it here AND into
// google.client-id in Backend/artverse-backend/src/main/resources/application.properties.
const GOOGLE_CLIENT_ID = "879111825472-tqj2cn0lsjc2gbk4gscdkqbfml5e2f7a.apps.googleusercontent.com";

function decodeJwtPayload(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const googleInitialized = useRef(false);

  // If redirected here because the JWT expired, land on the login tab
  // with a clear explanation instead of a silent, confusing redirect.
  useEffect(() => {
    if (searchParams.get("sessionExpired") === "true") {
      setActiveTab("login");
      setMessage("⏱️ Your session expired. Please log in again.");
    }
  }, [searchParams]);

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

  // Fired by Google Identity Services once the user picks an account. We
  // send the ID token to the backend for verification — never trust it
  // client-side — and it hands back our own JWT, same shape as /login.
  const handleGoogleCredential = async (response) => {
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: response.credential }),
      });
      const text = await res.text();
      if (res.ok) {
        const payload = decodeJwtPayload(text);
        login(text, { email: payload?.sub });

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

  // Renders Google's own Sign-In button into whichever tab is currently
  // visible — its container unmounts/remounts on every tab switch, so the
  // button has to be (re)drawn each time.
  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentityScript()
      .then((google) => {
        if (cancelled || !google) return;
        if (!googleInitialized.current) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
          });
          googleInitialized.current = true;
        }
        const el = document.getElementById("google-signin-btn");
        if (el) {
          el.innerHTML = "";
          google.accounts.id.renderButton(el, {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: activeTab === "register" ? "signup_with" : "signin_with",
            width: el.offsetWidth || 400,
          });
        }
      })
      .catch(() => {
        // Google script failed to load (offline, blocked, etc.) — the rest
        // of the form still works, so we just leave the button slot empty.
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Floating card — centered ── */}
      <div className="flex items-center justify-center px-4 py-6">
        <div
          className="w-full max-w-md bg-white rounded-2xl overflow-hidden border border-stone-200"
          style={{ boxShadow: "0 20px 50px rgba(28,25,23,0.08)" }}
        >
          <main className="px-6 py-6 md:px-8 md:py-7">

            <a href="/" className="flex justify-center mb-3">
            <img src="/logo-dark.png" alt="ArtVerse" className="h-20 sm:h-24 object-contain" />
                </a>

            <h1 className="text-xl font-bold text-center text-gray-900 mb-1">
              The Sacred Curator
            </h1>
            <p className="text-xs text-gray-400 text-center mb-4">
              Enter the sanctum of contemporary expression.
            </p>

            {/* Tabs */}
            <div className="flex justify-center gap-6 border-b border-gray-200 mb-4">
              <button
                onClick={() => { setActiveTab("register"); setMessage(""); }}
                className={`text-xs tracking-widest pb-2 bg-transparent border-none cursor-pointer font-medium transition-colors ${
                  activeTab === "register"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-400"
                }`}
              >
                REGISTER
              </button>
              <button
                onClick={() => { setActiveTab("login"); setMessage(""); }}
                className={`text-xs tracking-widest pb-2 bg-transparent border-none cursor-pointer font-medium transition-colors ${
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
                <div className="flex flex-col items-center mb-4">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative bg-gray-50 overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg text-gray-300">📷</span>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-700 text-white text-[10px] flex items-center justify-center">
                        ✎
                      </div>
                    </div>
                  </label>
                  <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  <span className="text-[10px] tracking-widest text-gray-300 mt-1.5">UPLOAD PROFILE PHOTO</span>
                </div>

                {/* Full Name */}
                <div className="mb-3">
                  <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">FULL NAME</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Julianne Moore"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="curator@artverse.io"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">PASSWORD</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                {/* Role Selector */}
                <div className="mb-3">
                  <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">I AM A</label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none appearance-none cursor-pointer"
                    >
                      <option value="ARTIST">Artist</option>
                      <option value="BUYER">Buyer / Art Lover</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                  </div>
                </div>

                {/* Artistic Discipline — only for ARTIST */}
                {formData.role === "ARTIST" && (
                  <div className="mb-3">
                    <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">ARTISTIC DISCIPLINE</label>
                    <div className="relative">
                      <select
                        name="discipline"
                        value={formData.discipline}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-400 outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select your craft</option>
                        <option value="painting">Painting</option>
                        <option value="sculpture">Sculpture</option>
                        <option value="photography">Photography</option>
                        <option value="digital">Digital Art</option>
                        <option value="traditional">Traditional Art</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                    </div>
                  </div>
                )}

                {/* ID Card Upload — only for ARTIST */}
                {formData.role === "ARTIST" && (
                  <div className="mb-3">
                    <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">
                      GOVERNMENT ID / CITIZENSHIP
                    </label>
                    <label htmlFor="id-upload" className="cursor-pointer">
                      <div className="w-full px-3 py-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center gap-1.5 hover:border-gray-400 transition-colors">
                        {idPreview ? (
                          <img src={idPreview} alt="ID preview" className="h-16 object-contain rounded" />
                        ) : (
                          <>
                            <span className="text-lg text-gray-300">🪪</span>
                            <span className="text-[10px] tracking-widest text-gray-400">UPLOAD YOUR ID CARD</span>
                            <span className="text-[10px] text-gray-300">Citizenship, Passport or National ID</span>
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
                  className="w-full py-3 bg-red-600 text-white text-xs tracking-widest font-semibold rounded-md mb-3 hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "CREATING..." : formData.role === "ARTIST" ? "CREATE ARTIST ACCOUNT" : "CREATE BUYER ACCOUNT"}
                </button>

                <div className="text-center text-gray-300 text-xs mb-3">or</div>

                <div id="google-signin-btn" className="w-full flex justify-center" />

                <p className="text-center text-[10px] text-gray-300 mt-4 leading-relaxed">
                  By joining ArtVerse, you agree to our{" "}
                  <span className="text-gray-500 underline cursor-pointer">Curator Agreement</span>{" "}
                  and{" "}
                  <span className="text-gray-500 underline cursor-pointer">Privacy Mandate</span>
                </p>
              </form>

            ) : (

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="curator@artverse.io"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs tracking-widest text-gray-500 mb-1.5 font-medium">PASSWORD</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-700 outline-none focus:border-gray-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 text-white text-xs tracking-widest font-semibold rounded-md mb-3 hover:bg-red-700 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "LOGGING IN..." : "LOGIN"}
                </button>

                <div className="text-center text-gray-300 text-xs mb-3">or</div>

                <div id="google-signin-btn" className="w-full flex justify-center" />

                <p className="text-center text-xs text-gray-400 mt-4">
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
              <p className="text-center text-sm mt-3 p-2.5 rounded-md bg-gray-100">
                {message}
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}