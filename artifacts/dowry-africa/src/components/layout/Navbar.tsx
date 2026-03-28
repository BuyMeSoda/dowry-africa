import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { LogOut, User as UserIcon } from "lucide-react";
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

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Dowry.Africa"
              className="h-14 w-auto max-w-[220px] object-contain"
            />
          </Link>
          
          {user && (
            <nav className="hidden md:flex gap-6">
              <Link href="/discover" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/discover' ? 'text-primary' : 'text-muted-foreground'}`}>
                Discover
              </Link>
              <Link href="/messages" className={`text-sm font-medium transition-colors hover:text-primary ${location === '/messages' ? 'text-primary' : 'text-muted-foreground'}`}>
                Messages
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
              <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Log in
              </Link>
              <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5">
                Get Started
              </Link>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-border flex items-center justify-center cursor-pointer hover:ring-2 ring-primary/20 transition-all">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  )}
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
