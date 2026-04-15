import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, Clock, Lock, LogOut, ExternalLink } from "lucide-react";

export default function PendingApproval() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && user.accountStatus === "approved") {
      setLocation("/discover");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return <div className="h-screen flex items-center justify-center bg-[#fdf8f4]" />;
  }

  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-700 to-rose-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
              Dowry.Africa
            </span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-xl border border-rose-100/60 overflow-hidden">

          {/* Header strip */}
          <div className="h-2 bg-gradient-to-r from-rose-700 via-rose-500 to-amber-400" />

          <div className="p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: "Georgia, serif" }}>
              Your application is under review
            </h1>
            <p className="text-gray-600 leading-relaxed mb-8">
              Thank you for joining Dowry.Africa, <strong className="text-gray-800">{firstName}</strong>. We review every application personally to ensure our community remains intentional and serious.
            </p>

            {/* Timeline */}
            <div className="space-y-3 mb-8">
              <TimelineStep
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Account created"
                status="done"
              />
              <TimelineStep
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Email verified"
                status="done"
              />
              <TimelineStep
                icon={<Clock className="w-5 h-5" />}
                label="Application under review (5–7 days)"
                status="active"
              />
              <TimelineStep
                icon={<Lock className="w-5 h-5" />}
                label="Welcome to Dowry.Africa"
                status="locked"
              />
            </div>

            {/* Info box */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-8">
              <p className="text-gray-700 text-sm leading-relaxed">
                You will receive an email at{" "}
                <strong className="text-gray-900">{user.email}</strong>{" "}
                once your application has been reviewed.
              </p>
            </div>

            {/* Contact */}
            <p className="text-center text-sm text-gray-500 mb-6">
              Questions? Contact us at{" "}
              <a href="mailto:hello@dowry.africa" className="text-rose-600 font-medium hover:underline">
                hello@dowry.africa
              </a>
            </p>

            {/* Social links */}
            <div className="flex items-center justify-center gap-5 mb-8">
              <a href="https://instagram.com/dowry.africa" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /><span>Instagram</span>
              </a>
              <a href="https://tiktok.com/@dowry.africa" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /><span>TikTok</span>
              </a>
              <a href="https://twitter.com/dowry_africa" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-600 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /><span>X / Twitter</span>
              </a>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 rounded-2xl text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Dowry.Africa &mdash; Built for marriage. Not just matches.
        </p>
      </div>
    </div>
  );
}

function TimelineStep({ icon, label, status }: {
  icon: React.ReactNode;
  label: string;
  status: "done" | "active" | "locked";
}) {
  const configs = {
    done: {
      iconClass: "bg-green-100 text-green-600",
      labelClass: "text-gray-700 font-medium",
      prefix: null,
    },
    active: {
      iconClass: "bg-amber-100 text-amber-600",
      labelClass: "text-amber-700 font-semibold",
      prefix: null,
    },
    locked: {
      iconClass: "bg-gray-100 text-gray-400",
      labelClass: "text-gray-400",
      prefix: null,
    },
  };
  const c = configs[status];

  return (
    <div className="flex items-center gap-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconClass}`}>
        {icon}
      </div>
      <span className={`text-sm ${c.labelClass}`}>{label}</span>
    </div>
  );
}
