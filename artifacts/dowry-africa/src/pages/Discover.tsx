import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useGetMatchFeed, useLikeUser, usePassUser, type FeedCard } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Heart, X, Sparkles, MapPin, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Discover() {
  const { data: feedData, isLoading, refetch } = useGetMatchFeed();
  const likeMutation = useLikeUser();
  const passMutation = usePassUser();
  const { toast } = useToast();
  
  const [feed, setFeed] = useState<FeedCard[]>([]);

  useEffect(() => {
    if (feedData?.feed) {
      setFeed(feedData.feed);
    }
  }, [feedData]);

  const handleAction = (id: string, action: 'like' | 'pass') => {
    // Optimistic UI update
    setFeed(prev => prev.filter(c => c.user.id !== id));
    
    if (action === 'like') {
      likeMutation.mutate({ id }, {
        onSuccess: (res) => {
          if (res.mutual) {
            toast({ title: "It's a Match! 🎉", description: "You and this person liked each other. Start a conversation now." });
          }
        }
      });
    } else {
      passMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 md:px-8 py-8 flex gap-8">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 shrink-0">
           <div className="sticky top-28 bg-white p-6 rounded-3xl border border-border shadow-sm">
              <h3 className="font-display font-bold text-xl mb-4">Discover Filters</h3>
              <div className="space-y-4">
                 <div>
                   <label className="text-sm font-medium text-muted-foreground block mb-2">Intent</label>
                   <div className="flex flex-wrap gap-2">
                     <span className="px-3 py-1 bg-primary text-white text-xs rounded-full cursor-pointer">Marriage Ready</span>
                     <span className="px-3 py-1 bg-secondary text-foreground text-xs rounded-full cursor-pointer hover:bg-secondary/80">Serious</span>
                   </div>
                 </div>
                 <hr className="border-border" />
                 <div>
                   <label className="text-sm font-medium text-muted-foreground block mb-2">Heritage</label>
                   <button className="w-full flex items-center justify-between px-3 py-2 border border-border rounded-xl text-sm hover:bg-secondary transition-colors">
                     <span>Any Heritage</span>
                     <Search className="w-4 h-4 text-muted-foreground" />
                   </button>
                 </div>
              </div>
              
              <div className="mt-8 bg-gradient-to-br from-primary/10 to-transparent p-5 rounded-2xl border border-primary/20">
                <div className="flex items-center gap-2 text-primary font-bold mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Serious Badge</span>
                </div>
                <p className="text-sm text-foreground/80 mb-4">Upgrade to Core or Badge tier to see who liked you and get priority matching.</p>
                <Link href="/premium" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">View Plans</Link>
              </div>
           </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 text-primary">
               <Heart className="w-12 h-12 animate-pulse mb-4" />
               <p className="font-display text-xl animate-pulse">Finding your best matches...</p>
             </div>
          ) : feed.length === 0 ? (
             <div className="bg-white p-12 rounded-3xl border border-border text-center shadow-sm">
               <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                 <Search className="w-8 h-8 text-muted-foreground" />
               </div>
               <h2 className="text-2xl font-display font-bold mb-2">You're all caught up!</h2>
               <p className="text-muted-foreground mb-8">We're searching for more high-quality matches for you. Check back later or expand your filters.</p>
               <button onClick={() => refetch()} className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors">Refresh Feed</button>
             </div>
          ) : (
            <div className="space-y-12 pb-24">
              <AnimatePresence>
                {feed.map((card) => (
                  <motion.div 
                    key={card.user.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="bg-white rounded-[2rem] shadow-xl border border-border/60 overflow-hidden flex flex-col md:flex-row group"
                  >
                    {/* Photo Side */}
                    <div className="w-full md:w-5/12 aspect-[4/5] md:aspect-auto md:h-[500px] relative shrink-0">
                      <img 
                        src={card.user.photoUrl || "https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=800"} 
                        alt={card.user.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 md:opacity-100 transition-opacity"></div>
                      
                      <div className="absolute bottom-6 left-6 right-6 md:hidden">
                        <h2 className="text-3xl font-display font-bold text-white drop-shadow-md">{card.user.name}, {card.user.age}</h2>
                      </div>
                    </div>
                    
                    {/* Info Side */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-white relative">
                      {card.freshBoost && (
                        <div className="absolute top-0 right-8 -translate-y-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> New Here
                        </div>
                      )}
                      
                      <div>
                        <div className="hidden md:flex justify-between items-start mb-1">
                          <h2 className="text-3xl font-display font-bold text-foreground">{card.user.name}, {card.user.age}</h2>
                          {card.user.hasBadge && (
                            <img src={`${import.meta.env.BASE_URL}images/trust-badge.png`} className="w-8 h-8" alt="Badge" title="Serious Badge Verified" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-6">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{card.user.city}, {card.user.country}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg border border-border/50">{card.user.intent}</span>
                          <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg border border-border/50">{card.user.faith}</span>
                          {card.user.heritage?.map(h => (
                            <span key={h} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg border border-border/50">{h}</span>
                          ))}
                        </div>

                        {card.user.quote && (
                          <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-6 text-xl font-display italic text-foreground/90">
                            "{card.user.quote}"
                          </blockquote>
                        )}
                        
                        {/* Compatibility Score */}
                        <div className="mt-8 bg-background p-4 rounded-2xl border border-border">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Compatibility</span>
                            <span className="font-bold text-primary text-lg">{card.score}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${card.score}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-4 mt-8">
                        <button 
                          onClick={() => handleAction(card.user.id, 'pass')}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-all shadow-sm"
                        >
                          <X className="w-6 h-6 md:w-8 md:h-8" />
                        </button>
                        <button 
                          onClick={() => handleAction(card.user.id, 'like')}
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Heart className="w-6 h-6 md:w-8 md:h-8 fill-white" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
