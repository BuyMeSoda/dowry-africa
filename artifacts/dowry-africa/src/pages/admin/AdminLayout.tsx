import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { isAdminLoggedIn, clearAdminSession, getAdminUser } from "@/lib/admin";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import {
  LayoutDashboard, Users, CreditCard,
  Activity, ShieldAlert, Settings, LogOut,
  MessageSquare, Mail, ShieldCheck, Menu, X,
} from "lucide-react";

const BASE_NAV = [
  { label: "Dashboard",       icon: LayoutDashboard, href: "/admin" },
  { label: "Users",           icon: Users,            href: "/admin/users" },
  { label: "Subscriptions",   icon: CreditCard,       href: "/admin/subscriptions" },
  { label: "Activity",        icon: Activity,         href: "/admin/activity" },
  { label: "Moderation",      icon: ShieldAlert,      href: "/admin/moderation" },
  { label: "Message Prompts", icon: MessageSquare,    href: "/admin/prompts" },
  { label: "Communications",  icon: Mail,             href: "/admin/communications" },
  { label: "Settings",        icon: Settings,         href: "/admin/settings" },
];

const SUPER_ADMIN_NAV = [
  { label: "Admin Access", icon: ShieldCheck, href: "/admin/access" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loggedIn = isAdminLoggedIn();
  const adminUser = getAdminUser();
  const isSuperAdmin = adminUser?.role === "super_admin";

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      setLocation("/admin/login");
    }
  }, [location]);

  // Close sidebar on route change (mobile navigation)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  if (!loggedIn) {
    setLocation("/admin/login");
    return null;
  }

  const nav = isSuperAdmin ? [...BASE_NAV, ...SUPER_ADMIN_NAV] : BASE_NAV;
  const currentPage = nav.find(n => n.href === location || (n.href !== "/admin" && location.startsWith(n.href)));

  const handleLogout = () => {
    clearAdminSession();
    setLocation("/admin/login");
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <SeriousBadgeIcon size={24} />
          <div>
            <p className="text-white font-bold text-sm">Dowry.Africa</p>
            <p className="text-gray-500 text-xs">Admin Panel</p>
          </div>
        </div>
        {adminUser && (
          <div className="mt-2 px-2 py-2 bg-gray-800/60 rounded-lg">
            <p className="text-white text-xs font-semibold truncate">{adminUser.name}</p>
            <p className="text-gray-400 text-xs truncate">{adminUser.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isSuperAdmin
                ? "bg-amber-500/20 text-amber-400"
                : "bg-gray-700 text-gray-400"
            }`}>
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ label, icon: Icon, href }) => {
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
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">

      {/* ── Mobile top bar ───────────────────────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <SeriousBadgeIcon size={20} />
          <span className="text-white font-bold text-sm">
            {currentPage?.label ?? "Admin"}
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── Mobile sidebar backdrop ──────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      {/* Desktop: always visible. Mobile: slide in from left as fixed drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        md:static md:w-64 md:translate-x-0 md:flex md:shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Mobile close button inside drawer */}
        <div className="md:hidden flex justify-end p-3 pb-0">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">
        {children}
      </main>

    </div>
  );
}
