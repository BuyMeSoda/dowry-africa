import { useState, useEffect } from "react";
import { useComingSoon } from "@/contexts/ComingSoonContext";
import { API_BASE } from "@/lib/api-url";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.41a8.16 8.16 0 004.77 1.52V7.47a4.85 4.85 0 01-1-.78z" />
    </svg>
  );
}

export default function ComingSoon() {
  const { headline, subtext, exclusivity, buttonText, successMessage, refresh } = useComingSoon();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/early-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus(data.alreadyRegistered ? "already" : "success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Soft background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/4 blur-3xl" />
      </div>

      {/* Pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <img
          src={`${import.meta.env.BASE_URL}images/pattern-bg.png`}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo with gentle pulse */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="relative w-20 h-20 overflow-hidden">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Dowry.Africa"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Brand name */}
        <p className="font-display font-bold text-primary text-2xl mb-10 tracking-tight">
          Dowry.Africa
        </p>

        {/* Headline */}
        <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-6">
          {headline}
        </h1>

        {/* Subtext */}
        {subtext && (
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed mb-6 max-w-md mx-auto">
            {subtext}
          </p>
        )}

        {/* Exclusivity line */}
        {exclusivity && (
          <p className="text-primary font-semibold text-base mb-10 italic">
            {exclusivity}
          </p>
        )}

        {/* Email capture */}
        {status === "success" ? (
          <div className="bg-primary/8 border border-primary/20 rounded-2xl px-6 py-8">
            <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-display font-bold text-foreground text-xl mb-1">{successMessage}</p>
            <p className="text-muted-foreground text-sm">We review every request personally.</p>
          </div>
        ) : status === "already" ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-8">
            <p className="font-display font-bold text-foreground text-xl mb-1">You're already on the list!</p>
            <p className="text-muted-foreground text-sm">We'll be in touch very soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 h-14 px-5 rounded-full border border-border bg-white text-foreground placeholder:text-muted-foreground/60 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="h-14 px-7 bg-primary text-primary-foreground rounded-full font-semibold text-base hover:bg-primary/90 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 disabled:translate-y-0 whitespace-nowrap"
              >
                {status === "loading" ? "Submitting..." : buttonText}
              </button>
            </div>
            {status === "error" && (
              <p className="text-red-500 text-sm text-center">{errorMsg}</p>
            )}
            <p className="text-muted-foreground/50 text-xs">No spam. No nonsense. Just priority access.</p>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground/40 text-xs uppercase tracking-widest">Follow the journey</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center gap-6">
          <a
            href="https://instagram.com/dowry.africa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <InstagramIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Instagram</span>
          </a>
          <a
            href="https://tiktok.com/@dowry.africa"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <TikTokIcon className="w-5 h-5" />
            <span className="text-sm font-medium">TikTok</span>
          </a>
          <a
            href="https://x.com/dowryafrica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <TwitterIcon className="w-5 h-5" />
            <span className="text-sm font-medium">X / Twitter</span>
          </a>
        </div>
      </div>
    </div>
  );
}
