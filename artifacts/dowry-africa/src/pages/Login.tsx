import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api-url";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login: setAuthToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        setAuthToken(data.token);
        toast({ title: "Welcome back", description: `Signed in as ${data.user.name}` });
        setLocation("/discover");
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Login failed", 
          description: err.message || "Please check your credentials." 
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  const setDemo = (e: string) => {
    setEmail(e);
    setPassword("demo");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-border/50">
          <h2 className="text-3xl font-display font-bold text-center mb-2">Welcome Back</h2>
          <p className="text-muted-foreground text-center mb-8">Sign in to continue your journey.</p>
          
          {/* Google OAuth */}
          <a
            href={`${API_BASE}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full py-3.5 border border-border rounded-xl bg-white font-semibold text-foreground hover:bg-secondary/60 active:scale-[0.99] transition-all shadow-sm"
          >
            <GoogleIcon />
            Sign in with Google
          </a>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground/80">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="w-full py-3.5 mt-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-70 disabled:transform-none flex justify-center items-center"
            >
              {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-center text-muted-foreground mb-4">Demo Accounts</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => setDemo('chidinma@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Chidinma (Serious Badge)</button>
              <button onClick={() => setDemo('emeka@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Emeka (Core)</button>
              <button onClick={() => setDemo('amara@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Amara (Serious Badge)</button>
              <button onClick={() => setDemo('kwame@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Kwame (Free)</button>
              <button onClick={() => setDemo('zara@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Zara (Core)</button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account? <Link href="/register" className="text-primary font-medium hover:underline">Apply here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
