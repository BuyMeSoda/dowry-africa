import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api-url";

function getStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "25%" };
  if (score <= 2) return { label: "Fair", color: "bg-amber-400", width: "50%" };
  if (score <= 3) return { label: "Good", color: "bg-yellow-400", width: "70%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function ResetPassword() {
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

  const strength = getStrength(password);

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
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && d.error?.includes("invalid or has expired")) {
          setInvalidToken(true);
        } else {
          setError(d.error ?? "Something went wrong. Please try again.");
        }
      } else {
        setSuccess(true);
        setTimeout(() => setLocation("/login"), 2000);
      }
    } catch {
      setError("Unable to connect. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-border/50 text-center space-y-6">
          <Link href="/" className="inline-block text-2xl font-display font-bold text-primary">Dowry.Africa</Link>
          <div>
            <h1 className="text-2xl font-display font-bold mb-2">Link expired</h1>
            <p className="text-muted-foreground text-sm">This link is invalid or has expired. Reset links are valid for 1 hour.</p>
          </div>
          <Link href="/forgot-password" className="inline-block w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-center hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/25">
            Request a new link
          </Link>
          <Link href="/login" className="block text-sm text-primary hover:underline">Back to login</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-border/50 text-center space-y-4">
          <Link href="/" className="inline-block text-2xl font-display font-bold text-primary">Dowry.Africa</Link>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <p className="text-emerald-800 font-semibold">Password updated successfully!</p>
            <p className="text-emerald-700 text-sm mt-1">Redirecting you to login…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-border/50">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-display font-bold text-primary mb-6">
            Dowry.Africa
          </Link>
          <h1 className="text-2xl font-display font-bold mb-2">Set a new password</h1>
          <p className="text-muted-foreground text-sm">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/80">New password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="At least 8 characters"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className={`text-xs font-medium ${strength.color.replace("bg-", "text-").replace("-400", "-600").replace("-500", "-600")}`}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground/80">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-secondary/50 border focus:outline-none focus:ring-4 transition-all ${
                  confirm.length > 0 && confirm !== password
                    ? "border-destructive focus:border-destructive focus:ring-destructive/10"
                    : "border-border focus:border-primary focus:ring-primary/10"
                }`}
                placeholder="Repeat your new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirm.length > 0 && confirm !== password && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading || password !== confirm || password.length < 8}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-70 disabled:transform-none flex justify-center items-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update password"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">Back to login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
