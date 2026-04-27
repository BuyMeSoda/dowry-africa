import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, XCircle } from "lucide-react";
import { API_BASE } from "@/lib/api-url";

export default function VerifyEmail() {
  const [missingToken, setMissingToken] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setMissingToken(true);
      return;
    }

    window.location.replace(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {!missingToken ? (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-display font-bold text-foreground">Verifying your email…</h1>
            <p className="text-muted-foreground">Hold on a moment while we confirm your account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-display font-bold text-foreground">Verification link is incomplete</h1>
            <p className="text-muted-foreground">
              The link you opened is missing its verification token. Please use the most recent verification email we
              sent you, or request a new one from the login page.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/login" className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors">
                Go to login
              </Link>
              <Link href="/" className="px-6 py-3 border border-border rounded-full font-semibold hover:bg-secondary transition-colors">
                Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
