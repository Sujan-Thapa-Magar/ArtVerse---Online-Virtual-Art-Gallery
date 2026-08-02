import { useNavigate } from "react-router-dom";

/** Shared site footer — same on every page that shows one. */
export default function Footer() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const linkCls =
    "text-stone-500 hover:text-red-600 text-xs text-left bg-transparent border-none cursor-pointer transition-colors";

  return (
    <footer className="mt-16 border-t border-stone-200 bg-white px-6 lg:px-12 pt-12 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 pb-10 border-b border-stone-100">
          <div className="max-w-xs">
            <p className="text-stone-500 text-xs leading-relaxed">
              Nepal's virtual art gallery — connecting local artists with collectors around the world.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8">
            <div>
              <p className="text-stone-900 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                Explore
              </p>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => navigate("/home")} className={linkCls}>
                  Home
                </button>
                <button onClick={() => navigate("/gallery")} className={linkCls}>
                  Gallery
                </button>
              </div>
            </div>

            <div>
              <p className="text-stone-900 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                Account
              </p>
              <div className="flex flex-col gap-2.5">
                {!token ? (
                  <>
                    <button onClick={() => navigate("/login")} className={linkCls}>
                      Login
                    </button>
                    <button onClick={() => navigate("/register")} className={linkCls}>
                      Register
                    </button>
                  </>
                ) : (
                  <button onClick={() => navigate("/profile")} className={linkCls}>
                    My Profile
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-stone-900 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                Company
              </p>
              <div className="flex flex-col gap-2.5">
                <button onClick={() => navigate("/about-us")} className={linkCls}>
                  About Us
                </button>
              </div>
            </div>

            <div>
              <p className="text-stone-900 text-[10px] font-bold tracking-[0.2em] uppercase mb-4">
                Contact Us
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => { window.location.href = "mailto:itsmesujan2003@gmail.com"; }}
                  className={linkCls}
                >
                  itsmesujan2003@gmail.com
                </button>
                <button
                  onClick={() => { window.location.href = "tel:+9779800000000"; }}
                  className={linkCls}
                >
                  +977 9848938289
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-stone-400 text-[11px]">
            © {new Date().getFullYear()} ArtVerse. All rights reserved.
          </p>
          <p className="text-stone-400 text-[11px]">Made in Nepal 🇳🇵</p>
        </div>
      </div>
    </footer>
  );
}
