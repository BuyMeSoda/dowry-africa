import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Flame, MessageCircle, Star, User } from "lucide-react";

export function MobileBottomTabBar() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { counts } = useNotifications();

  if (!user) return null;
  if (location.startsWith("/admin")) return null;

  const msgBadge = counts.messages + counts.matches;

  const tabs = [
    { href: "/discover",  icon: Flame,          label: "Discover",  fill: true,  matchStart: false },
    { href: "/messages",  icon: MessageCircle,  label: "Messages",  fill: false, matchStart: true,  badge: msgBadge },
    { href: "/premium",   icon: Star,           label: "Premium",   fill: false, matchStart: false },
    { href: "/profile",   icon: User,           label: "Profile",   fill: false, matchStart: false },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border md:hidden"
         style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-stretch h-16">
        {tabs.map(({ href, icon: Icon, label, fill, matchStart, ...rest }) => {
          const badge = "badge" in rest ? rest.badge : undefined;
          const isActive = matchStart ? location.startsWith(href) : location === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              style={{ minHeight: 44 }}
            >
              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-colors ${isActive ? "text-primary" : "text-muted-foreground/60"}`}
                  fill={isActive && fill ? "currentColor" : "none"}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {badge != null && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isActive ? "text-primary" : "text-muted-foreground/60"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
