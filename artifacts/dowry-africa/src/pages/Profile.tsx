import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck, LogOut, Settings, Edit3 } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
        <div className="bg-white rounded-[2rem] shadow-xl border border-border overflow-hidden">
          
          <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/40 relative">
            {user.hasBadge && (
              <div className="absolute top-6 right-6 bg-white p-3 rounded-2xl shadow-lg flex items-center gap-3">
                 <img src={`${import.meta.env.BASE_URL}images/trust-badge.png`} alt="Verified" className="w-10 h-10" />
                 <div>
                   <p className="font-bold text-sm">Serious Badge</p>
                   <p className="text-xs text-muted-foreground">Active</p>
                 </div>
              </div>
            )}
          </div>
          
          <div className="px-8 pb-12 relative">
            <div className="flex justify-between items-end mb-8">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-secondary -mt-16 overflow-hidden relative z-10">
                <img src={user.photoUrl || "https://images.unsplash.com/photo-1531123897727-8f129e1bfd8c?w=400&q=80"} className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3">
                <Link href="/onboarding" className="px-5 py-2.5 bg-secondary text-foreground rounded-full font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                  <Edit3 className="w-4 h-4" /> Edit Profile
                </Link>
                <button onClick={logout} className="px-5 py-2.5 border border-border text-muted-foreground rounded-full font-medium flex items-center gap-2 hover:text-destructive hover:border-destructive transition-colors">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-4xl font-display font-bold mb-1">{user.name}, {user.age}</h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                 {user.city}, {user.country}
                 <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                 {user.intent === 'marriage_ready' ? 'Marriage Ready' : user.intent}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mt-12">
              <div>
                <h3 className="text-xl font-display font-bold mb-4 border-b border-border pb-2">About Me</h3>
                <p className="text-foreground/80 leading-relaxed mb-6">
                  {user.bio || "No bio added yet."}
                </p>
                {user.quote && (
                  <blockquote className="border-l-2 border-primary pl-4 italic text-lg text-foreground/90 font-display">
                    "{user.quote}"
                  </blockquote>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-display font-bold mb-4 border-b border-border pb-2">Background</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heritage</span>
                      <span className="font-medium">{user.heritage?.join(", ") || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faith</span>
                      <span className="font-medium">{user.faith || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Languages</span>
                      <span className="font-medium">{user.languages?.join(", ") || 'English'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-display font-bold mb-4 border-b border-border pb-2">Life & Future</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Life Stage</span>
                      <span className="font-medium">{user.lifeStage || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timeline</span>
                      <span className="font-medium">{user.marriageTimeline || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
