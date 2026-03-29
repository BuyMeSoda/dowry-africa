import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { isAdminLoggedIn, clearAdminSecret } from "@/lib/admin";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import {
  LayoutDashboard, Users, ListChecks, CreditCard,
  Activity, ShieldAlert, Settings, LogOut
} from "lucide-react";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Waitlist", icon: ListChecks, href: "/admin/waitlist" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Subscriptions", icon: CreditCard, href: "/admin/subscriptions" },
  { label: "Activity", icon: Activity, href: "/admin/activity" },
  { label: "Moderation", icon: ShieldAlert, href: "/admin/moderation" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      setLocation("/admin/login");
    }
  }, []);

  const handleLogout = () => {
    clearAdminSecret();
    setLocation("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <SeriousBadgeIcon size={28} />
            <div>
              <p className="text-white font-bold text-sm">Dowry.Africa</p>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = location === href || (href !== "/admin" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
