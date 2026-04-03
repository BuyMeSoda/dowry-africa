import { useState } from "react";
import { useLocation, Link } from "wouter";
import { adminLogin } from "@/lib/admin";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await adminLogin(email, password);
    setLoading(false);
    if (result.ok) {
      setLocation("/admin");
    } else {
      setError(result.error ?? "Invalid credentials. Please try again.");
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
          <h1 className="text-white text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to manage the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">Password</label>
              <Link href="/admin/forgot-password" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-600"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign in to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
