import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

/** eSewa redirects here when a payment is cancelled or fails. No order is placed. */
export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream text-stone-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl">✕</div>
          <h1 className="text-2xl font-black text-stone-900">Payment cancelled</h1>
          <p className="text-stone-500 text-sm">
            Your eSewa payment didn't go through, so no order was placed. You can try again anytime.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => navigate("/gallery")}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase rounded-full transition-colors cursor-pointer border-none"
            >
              Back to Gallery
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 text-xs font-bold tracking-widest uppercase rounded-full hover:border-stone-400 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
