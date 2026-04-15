import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { XCircle, LogOut, Mail } from "lucide-react";

export default function RejectedPage() {
  const { user, isLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && user.accountStatus === "approved") {
      setLocation("/discover");
    } else if (!isLoading && user && user.accountStatus === "pending") {
      setLocation("/pending");
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

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100/80 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-gray-400 to-gray-300" />
          <div className="p-8 md:p-10">

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-gray-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
                Your application
              </h1>
            </div>

            <p className="text-gray-700 leading-relaxed mb-5">
              Hi <strong>{firstName}</strong>, thank you for your interest in Dowry.Africa.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              After careful review, we were unable to approve your application at this time.
            </p>

            {user.rejectionReason && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Note from our team</p>
                <p className="text-gray-700 text-sm leading-relaxed">{user.rejectionReason}</p>
              </div>
            )}

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  If you believe this is an error, please reach out to us at{" "}
                  <a href="mailto:hello@dowry.africa" className="text-rose-600 font-semibold hover:underline">
                    hello@dowry.africa
                  </a>{" "}
                  and we will be happy to review your case.
                </p>
              </div>
            </div>

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
