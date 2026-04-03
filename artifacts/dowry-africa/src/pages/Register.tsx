import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useRegister, type RegisterRequestGender } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "man" as RegisterRequestGender,
    birthYear: 1995
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const { login: setAuthToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        setAuthToken(data.token);
        toast({ title: "Account created", description: "Let's complete your profile." });
        setLocation("/onboarding");
      },
      onError: (err: any) => {
        toast({ 
          variant: "destructive", 
          title: "Registration failed", 
          description: err.message || "An error occurred." 
        });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ data: formData });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-border/50">
          <h2 className="text-3xl font-display font-bold text-center mb-2">Apply for Membership</h2>
          <p className="text-muted-foreground text-center mb-8">Join the exclusive matchmaking platform.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/80">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value as RegisterRequestGender})}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="man">Man</option>
                  <option value="woman">Woman</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/80">Birth Year</label>
                <input 
                  type="number" 
                  min="1950" max={new Date().getFullYear() - 18}
                  value={formData.birthYear}
                  onChange={e => setFormData({...formData, birthYear: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/80">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-secondary/50 border border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={registerMutation.isPending}
              className="w-full py-3.5 mt-6 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-70 disabled:transform-none flex justify-center items-center"
            >
              {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Profile"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already a member? <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
