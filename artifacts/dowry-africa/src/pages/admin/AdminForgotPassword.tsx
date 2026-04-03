import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { API_BASE } from "@/lib/api-url";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin-auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong.");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <SeriousBadgeIcon size={36} />
            <span className="text-white text-xl font-bold font-display">Dowry.Africa</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Reset admin password</h1>
          <p className="text-gray-400 text-sm mt-1">Enter your admin email to receive a reset link</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {sent ? (
            <div className="space-y-5">
              <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-xl p-4 text-sm text-emerald-300 leading-relaxed">
                If this email has admin access, a reset link will be sent shortly.
              </div>
              <Link href="/admin/login" className="block text-center text-sm text-amber-400 hover:text-amber-300 transition-colors">
                Back to admin login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Admin email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-600"
                  placeholder="admin@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-sm">
                <Link href="/admin/login" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Back to admin login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
