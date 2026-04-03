import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { API_BASE } from "@/lib/api-url";

export default function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setInvalidToken(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin-auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.error?.includes("invalid or has expired")) setInvalidToken(true);
        else setError(d.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        setTimeout(() => setLocation("/admin/login"), 2000);
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const card = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <SeriousBadgeIcon size={36} />
            <span className="text-white text-xl font-bold font-display">Dowry.Africa</span>
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {children}
        </div>
      </div>
    </div>
  );

  if (invalidToken) return card(
    <div className="space-y-5 text-center">
      <div>
        <h2 className="text-white text-xl font-bold mb-2">Link expired</h2>
        <p className="text-gray-400 text-sm">This link is invalid or has expired. Reset links are valid for 1 hour.</p>
      </div>
      <Link href="/admin/forgot-password" className="block w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl text-center transition-colors">
        Request a new link
      </Link>
      <Link href="/admin/login" className="block text-sm text-amber-400 hover:text-amber-300">Back to admin login</Link>
    </div>
  );

  if (success) return card(
    <div className="space-y-4 text-center">
      <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4">
        <p className="text-emerald-300 font-semibold">Password updated successfully!</p>
        <p className="text-emerald-400/70 text-sm mt-1">Redirecting you to login…</p>
      </div>
    </div>
  );

  return card(
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-white text-xl font-bold mb-1">Set new admin password</h2>
        <p className="text-gray-400 text-sm">Choose a strong password for your admin account.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">New password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-600"
            placeholder="At least 8 characters"
            required
            autoFocus
          />
          <button type="button" onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1" tabIndex={-1}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(""); }}
            className={`w-full bg-gray-800 border text-white rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-600 ${
              confirm.length > 0 && confirm !== password
                ? "border-red-600 focus:ring-red-500"
                : "border-gray-700 focus:ring-amber-500"
            }`}
            placeholder="Repeat your new password"
            required
          />
          <button type="button" onClick={() => setShowConfirm(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1" tabIndex={-1}>
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirm.length > 0 && confirm !== password && (
          <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || password !== confirm || password.length < 8}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Updating…" : "Update password"}
      </button>

      <p className="text-center text-sm">
        <Link href="/admin/login" className="text-amber-400 hover:text-amber-300">Back to admin login</Link>
      </p>
    </form>
  );
}
