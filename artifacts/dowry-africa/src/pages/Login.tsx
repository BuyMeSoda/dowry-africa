import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";

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
              <button onClick={() => setDemo('chidinma@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Chidinma (W)</button>
              <button onClick={() => setDemo('emeka@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Emeka (M)</button>
              <button onClick={() => setDemo('kwame@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Kwame (Free)</button>
              <button onClick={() => setDemo('zara@demo.com')} className="text-xs px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors">Zara (Free)</button>
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
