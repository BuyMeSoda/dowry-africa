import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

// Inject Google Fonts into <head> once
function useBrandFonts() {
  useEffect(() => {
    const id = "dowry-brand-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

export default function PendingApproval() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  useBrandFonts();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && user.accountStatus === "approved") {
      setLocation("/discover");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#FAF7F2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "'Jost', sans-serif",
      }}
    >
      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes da-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        .da-pulse { animation: da-pulse 2s ease-in-out infinite; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo — above the card, centered */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Dowry.Africa"
            style={{ height: 48, objectFit: "contain" }}
          />
        </div>

        {/* Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            boxShadow:
              "0 4px 6px -1px rgba(26,16,8,0.06), 0 12px 40px -8px rgba(26,16,8,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Gradient accent bar */}
          <div
            style={{
              height: 5,
              background: "linear-gradient(90deg, #7A1535, #B5264E, #C9973A)",
            }}
          />

          <div style={{ padding: "36px 36px 32px" }}>

            {/* Heading */}
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 34,
                fontWeight: 600,
                color: "#1A1008",
                lineHeight: 1.2,
                margin: "0 0 14px",
              }}
            >
              Your application is under review
            </h1>

            {/* Subtext */}
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 15,
                fontWeight: 300,
                color: "#5C4A3A",
                lineHeight: 1.65,
                margin: "0 0 32px",
              }}
            >
              Thank you for joining Dowry.Africa,{" "}
              <strong style={{ fontWeight: 500, color: "#1A1008" }}>
                {firstName}
              </strong>
              . We review every application personally to ensure our community
              remains intentional and serious.
            </p>

            {/* Timeline */}
            <div style={{ position: "relative", marginBottom: 32 }}>
              {/* Vertical connecting line */}
              <div
                style={{
                  position: "absolute",
                  left: 19,
                  top: 20,
                  bottom: 20,
                  width: 1,
                  background:
                    "linear-gradient(180deg, #2D7A4F 0%, #2D7A4F 30%, #B8680A 55%, #E8DDD0 80%)",
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Step 1 — done */}
                <TimelineStep
                  icon={<CheckIcon />}
                  iconBg="#EBF5EF"
                  iconColor="#2D7A4F"
                  label="Account created"
                  labelColor="#1A1008"
                  labelWeight={400}
                  pulse={false}
                />
                {/* Step 2 — done */}
                <TimelineStep
                  icon={<CheckIcon />}
                  iconBg="#EBF5EF"
                  iconColor="#2D7A4F"
                  label="Email verified"
                  labelColor="#1A1008"
                  labelWeight={400}
                  pulse={false}
                />
                {/* Step 3 — in progress */}
                <TimelineStep
                  icon={<ClockIcon />}
                  iconBg="#FEF3E2"
                  iconColor="#B8680A"
                  label="Application under review (5–7 days)"
                  labelColor="#B8680A"
                  labelWeight={500}
                  pulse={true}
                />
                {/* Step 4 — locked */}
                <TimelineStep
                  icon={<LockIcon />}
                  iconBg="#F4F0EC"
                  iconColor="#C4B5A5"
                  label="Welcome to Dowry.Africa"
                  labelColor="#C4B5A5"
                  labelWeight={300}
                  pulse={false}
                />
              </div>
            </div>

            {/* Email notice */}
            <div
              style={{
                background: "#F9EEF1",
                border: "1px solid rgba(181,38,78,0.12)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 28,
              }}
            >
              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: 14,
                  fontWeight: 300,
                  color: "#5C4A3A",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                You will receive an email at{" "}
                <strong
                  style={{ fontWeight: 500, color: "#1A1008", wordBreak: "break-all" }}
                >
                  {user.email}
                </strong>{" "}
                once your application has been reviewed.
              </p>
            </div>

            {/* Divider */}
            <div
              style={{
                height: 1,
                background: "#E8DDD0",
                margin: "0 0 24px",
              }}
            />

            {/* Contact */}
            <p
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: 300,
                color: "#5C4A3A",
                marginBottom: 18,
              }}
            >
              Questions? Contact us at{" "}
              <a
                href="mailto:hello@dowry.africa"
                style={{
                  color: "#B5264E",
                  textDecoration: "none",
                  fontWeight: 400,
                }}
              >
                hello@dowry.africa
              </a>
            </p>

            {/* Social links */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                marginBottom: 28,
              }}
            >
              {[
                { label: "Instagram", href: "https://instagram.com/dowryafrica" },
                { label: "TikTok", href: "https://tiktok.com/@dowryafrica" },
                { label: "X / Twitter", href: "https://twitter.com/dowryafrica" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "#5C4A3A",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#B5264E";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#5C4A3A";
                  }}
                >
                  {s.label}
                </a>
              ))}
            </div>

            {/* Sign out */}
            <button
              onClick={logout}
              style={{
                width: "100%",
                padding: "12px 0",
                background: "transparent",
                border: "1px solid #E8DDD0",
                borderRadius: 10,
                fontSize: 14,
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                color: "#5C4A3A",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s, color 0.2s",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = "#B5264E";
                btn.style.background = "#F9EEF1";
                btn.style.color = "#B5264E";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = "#E8DDD0";
                btn.style.background = "transparent";
                btn.style.color = "#5C4A3A";
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: 300,
            color: "#C4B5A5",
            marginTop: 24,
            letterSpacing: "0.04em",
          }}
        >
          &copy; {new Date().getFullYear()} Dowry.Africa &mdash; Built for
          marriage. Not just matches.
        </p>
      </div>
    </div>
  );
}

function TimelineStep({
  icon,
  iconBg,
  iconColor,
  label,
  labelColor,
  labelWeight,
  pulse,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  labelColor: string;
  labelWeight: number;
  pulse: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
      <div
        className={pulse ? "da-pulse" : undefined}
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 14,
          fontWeight: labelWeight,
          color: labelColor,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8.5L6.5 12L13 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 5V8.5L10.5 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="3"
        y="7.5"
        width="10"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 7.5V5.5a3 3 0 016 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
