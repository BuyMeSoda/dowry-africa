import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export function MobileTopBar() {
  const { user } = useAuth();
  const [location] = useLocation();
  if (!user) return null;
  if (location.startsWith("/admin")) return null;

  return (
    <header className="md:hidden sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md border-b border-border/40 flex items-center px-4 h-12">
      <Link href="/discover" className="flex items-center gap-1.5">
        <div className="h-7 w-7 overflow-hidden flex-shrink-0">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="h-7 w-auto"
            style={{ maxWidth: "none" }}
          />
        </div>
        <span className="font-display font-bold text-primary text-lg leading-none tracking-tight">
          Dowry.Africa
        </span>
      </Link>
    </header>
  );
}
