import { useState } from "react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api-url";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Something went wrong. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-border/50">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-display font-bold text-primary mb-6">
            Dowry.Africa
          </Link>
          <h1 className="text-2xl font-display font-bold mb-2">Reset your password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we will send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-sm text-emerald-800 leading-relaxed">
              If an account exists with this email, you will receive a reset link shortly. Check your inbox.
            </div>
            <Link href="/login" className="block text-center text-sm text-primary hover:underline font-medium">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-70 disabled:transform-none flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send reset link"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline font-medium">Back to login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
