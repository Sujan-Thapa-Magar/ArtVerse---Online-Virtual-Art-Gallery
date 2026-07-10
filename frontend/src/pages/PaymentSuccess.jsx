import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

/**
 * eSewa redirects the browser here after a successful payment, appending a
 * base64-encoded `data` query param. We pull the transaction_uuid out of it
 * (falling back to what we stashed before redirecting), then ask the backend
 * to verify the payment with eSewa and place the order.
 */
export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    let transactionUuid = sessionStorage.getItem("esewaTransactionUuid");
    const rawData = params.get("data");
    if (rawData) {
      try {
        const decoded = JSON.parse(atob(rawData));
        if (decoded.transaction_uuid) transactionUuid = decoded.transaction_uuid;
      } catch {
        /* fall back to the stashed uuid */
      }
    }

    if (!transactionUuid) {
      setStatus("error");
      setMessage("We couldn't find your transaction reference.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/payments/esewa/verify", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transactionUuid }),
        });
        if (res.ok) {
          sessionStorage.removeItem("esewaTransactionUuid");
          setStatus("success");
          setMessage("Payment verified and your order has been placed.");
          setTimeout(() => navigate("/profile"), 2200);
        } else {
          const errText = await res.text();
          setStatus("error");
          setMessage(errText || "We couldn't verify your payment.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong while verifying your payment.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-cream text-stone-900">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4">
          {status === "verifying" && (
            <>
              <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-red-600 animate-spin" />
              <h1 className="text-2xl font-black text-stone-900">Verifying payment…</h1>
              <p className="text-stone-500 text-sm">Please wait while we confirm your eSewa transaction.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl">✓</div>
              <h1 className="text-2xl font-black text-stone-900">Payment successful</h1>
              <p className="text-stone-500 text-sm">{message}</p>
              <p className="text-stone-400 text-xs">Redirecting to your profile…</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-3xl">!</div>
              <h1 className="text-2xl font-black text-stone-900">Verification failed</h1>
              <p className="text-stone-500 text-sm">{message}</p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate("/gallery")}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold tracking-widest uppercase rounded-full transition-colors cursor-pointer border-none"
                >
                  Back to Gallery
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="px-5 py-2.5 bg-white border border-stone-200 text-stone-600 text-xs font-bold tracking-widest uppercase rounded-full hover:border-stone-400 transition-colors cursor-pointer"
                >
                  My Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
