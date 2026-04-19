import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/contexts/NotificationsContext";
import { LogOut, User as UserIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { counts } = useNotifications();
  const getStartedHref = "/register";

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const msgBadge = counts.messages + counts.matches + counts.likes;

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md ${user ? "hidden md:block" : ""}`}>
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user ? "/discover" : "/"} className="flex items-center gap-2">
            <div className="h-11 w-11 overflow-hidden flex-shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt=""
                className="h-11 w-auto"
                style={{ maxWidth: "none" }}
              />
            </div>
            <span className="font-display font-bold text-primary text-2xl leading-none tracking-tight">
              Dowry.Africa
            </span>
          </Link>
          
          {user && (
            <nav className="hidden md:flex gap-6">
              <Link href="/discover" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/discover' ? 'text-primary' : 'text-muted-foreground'}`}>
                Discover
              </Link>
              <Link href="/messages" className={`relative text-sm font-medium transition-colors hover:text-primary ${location.startsWith('/messages') ? 'text-primary' : 'text-muted-foreground'}`}>
                Messages
                {msgBadge > 0 && (
                  <span className="absolute -top-1.5 -right-3.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {msgBadge > 99 ? "99+" : msgBadge}
                  </span>
                )}
              </Link>
              <Link href="/premium" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/premium' ? 'text-primary' : 'text-muted-foreground'}`}>
                Premium
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link href="/about" className={`hidden md:block text-sm font-medium transition-colors hover:text-primary ${location === '/about' ? 'text-primary' : 'text-muted-foreground'}`}>
                About
              </Link>
              <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Log in
              </Link>
              <Link href={getStartedHref} className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5">
                Get Started
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-border cursor-pointer hover:ring-2 ring-primary/20 transition-all">
                  <UserAvatar name={user.name} photoUrl={user.photoUrl} className="w-full h-full" textClassName="text-sm font-bold" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-border/50">
                <DropdownMenuLabel className="font-display text-lg">{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/profile')} className="cursor-pointer">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile & Preferences
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
