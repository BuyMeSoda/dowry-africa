import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useLikeUser, usePassUser, useGetPaymentStatus, useGetLikedMe, type FeedCard } from "@workspace/api-client-react";
import { useNotifications } from "@/contexts/NotificationsContext";
import { CustomChipSelect } from "@/components/ui/CustomChipSelect";
import { useToast } from "@/hooks/use-toast";
import { Heart, X, Sparkles, MapPin, Search, Lock, Users, Loader2, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { API_BASE } from "@/lib/api-url";
import { COUNTRY_GROUPS } from "@/lib/country-options";

// "Open to all" = first chip, means no country filter applied
const FILTER_CULTURAL_PRESETS = ["Open to all"];

// "Open to all" = first chip in Faith list, means no filter
const FILTER_FAITH_PRESETS = ["Open to all", "Christian", "Muslim", "Traditional African"];

// ── Tag label formatting ─────────────────────────────────────────────────────
const TAG_LABELS: Record<string, string> = {
  marriage_ready:        "💍 Marriage Ready",
  serious_relationship:  "🌱 Serious",
  open_to_dating:        "✨ Open to Dating",
  christian:             "✝️ Christian",
  christianity:          "✝️ Christian",
  muslim:                "☪️ Muslim",
  islam:                 "☪️ Muslim",
  traditional:           "🌿 Traditional",
  spiritual:             "🔮 Spiritual",
  "spiritual but not religious": "🔮 Spiritual",
  "any / open":          "🤍 Any / Open",
  other:                 "🌍 Other",
  yes:                   "👶 Wants children",
  no:                    "🚫 No children",
  open:                  "🤍 Open",
  asap:                  "⚡ Ready now",
  "1_year":              "📅 Within 1 year",
  "2_years":             "📅 Within 2 years",
  "5_years":             "📅 Within 5 years",
  not_sure:              "🤔 Not sure yet",
};

function formatTag(raw: string): string {
  if (!raw) return raw;
  const key = raw.toLowerCase().trim();
  if (TAG_LABELS[key]) return TAG_LABELS[key];
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
// ─────────────────────────────────────────────────────────────────────────────

interface MatchModalProps {
  name: string;
  photoUrl: string | null;
  onClose: () => void;
}

function MatchModal({ name, photoUrl, onClose }: MatchModalProps) {
  const [, setLocation] = useLocation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="relative">
          {/* Hearts animation */}
          <div className="flex justify-center mb-6 relative">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ y: 0, opacity: 1, scale: 0 }}
                animate={{ y: -80 - i * 20, opacity: 0, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 1.2 }}
              >
                <Heart className="w-5 h-5 text-primary fill-primary" style={{ marginLeft: `${(i - 2) * 30}px` }} />
              </motion.div>
            ))}
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-primary shadow-xl shadow-primary/30 relative z-10">
              <UserAvatar name={name} photoUrl={photoUrl} className="w-full h-full" textClassName="text-5xl font-bold" />
            </div>
          </div>

          <div className="mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">It's a Match</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-3">
            You & {name}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            You both liked each other. Start the conversation and build something real.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { onClose(); setLocation("/messages"); }}
              className="w-full py-3.5 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5"
            >
              Send a Message
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Keep Discovering
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Likes You Panel ──────────────────────────────────────────────────────────
function LikesYouPanel() {
  const { data: likedMeData, isLoading } = useGetLikedMe();
  const { counts } = useNotifications();
  const likeMutation = useLikeUser();
  const { toast } = useToast();
  const [matchModal, setMatchModal] = useState<{ name: string; photoUrl: string | null } | null>(null);

  const likedBy = likedMeData?.likedBy ?? [];
  const count = likedMeData?.count ?? 0;

  if (isLoading || count === 0) return null;

  const isFree = likedBy[0]?.blurred;

  const handleLikeBack = (userId: string, name: string, photoUrl: string | null) => {
    likeMutation.mutate({ id: userId }, {
      onSuccess: (res: any) => {
        if (res.mutual) {
          setMatchModal({ name, photoUrl });
        } else {
          toast({ title: "Liked!", description: `You liked ${name} back.` });
        }
      }
    });
  };

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-xl">Likes You</h3>
          </div>
          <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">{count}</span>
        </div>

        {isFree ? (
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex -space-x-3 mb-4">
              {likedBy.slice(0, 4).map((_, i) => (
                <div key={i} className="w-14 h-14 rounded-full bg-secondary border-2 border-white overflow-hidden" style={{ filter: "blur(6px)" }}>
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10" />
                </div>
              ))}
              {count > 4 && (
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-bold text-primary">
                  +{count - 4}
                </div>
              )}
            </div>
            <p className="font-semibold text-foreground mb-1">{count} {count === 1 ? "person" : "people"} liked your profile</p>
            <p className="text-sm text-muted-foreground mb-4">Upgrade to Core to see who and like them back.</p>
            <Link href="/premium" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
              <Lock className="w-3.5 h-3.5" /> Upgrade to unlock
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {likedBy.map(({ user }: any) => (
              <div key={user.id} className="shrink-0 w-44 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="h-48 relative">
                  <UserAvatar name={user.name} photoUrl={user.photoUrl} className="w-full h-full" textClassName="text-4xl font-bold" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm truncate">{user.name}</p>
                    {user.city && <p className="text-white/70 text-xs truncate">{user.city}</p>}
                  </div>
                </div>
                <div className="p-3">
                  <button
                    onClick={() => handleLikeBack(user.id, user.name, user.photoUrl)}
                    disabled={likeMutation.isPending}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" /> Like Back
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {matchModal && (
          <MatchModal
            name={matchModal.name}
            photoUrl={matchModal.photoUrl}
            onClose={() => setMatchModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Paginated feed response type ──────────────────────────────────────────────
interface FeedPageResponse {
  feed: FeedCard[];
  total: number;
  hasMore: boolean;
  reachedTierLimit: boolean;
  tier: string;
}

export default function Discover() {
  const { data: paymentStatus } = useGetPaymentStatus();
  const { refresh: refreshNotifs } = useNotifications();
  const likeMutation = useLikeUser();
  const passMutation = usePassUser();
  const { toast } = useToast();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [filterCulture, setFilterCulture] = useState<string[]>([]);
  const [filterFaith, setFilterFaith] = useState<string[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  // Draft state for mobile sheet (applied on "Apply" tap)
  const [draftCulture, setDraftCulture] = useState<string[]>([]);
  const [draftFaith, setDraftFaith] = useState<string[]>([]);

  const handleCultureToggle = (value: string) => {
    setFilterCulture(prev => {
      if (value === "Open to all") return prev.includes("Open to all") ? [] : ["Open to all"];
      if (prev.includes("Open to all")) return [value];
      return prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
    });
  };
  const handleFaithToggle = (value: string) => {
    setFilterFaith(prev => {
      if (value === "Open to all") return prev.includes("Open to all") ? [] : ["Open to all"];
      if (prev.includes("Open to all")) return [value];
      return prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
    });
  };
  const clearFilters = () => { setFilterCulture([]); setFilterFaith([]); };

  const openFilterSheet = () => {
    setDraftCulture([...filterCulture]);
    setDraftFaith([...filterFaith]);
    setFilterSheetOpen(true);
  };

  const applyFilterSheet = () => {
    setFilterCulture(draftCulture);
    setFilterFaith(draftFaith);
    setFilterSheetOpen(false);
  };

  const clearFilterSheet = () => {
    setDraftCulture([]);
    setDraftFaith([]);
  };

  const draftFiltersActive = draftCulture.filter(v => v !== "Open to all").length > 0 ||
                              draftFaith.filter(v => v !== "Open to all").length > 0;

  // Effective filters: "Open to all" = no filter on that dimension
  const effectiveCultureFilter = filterCulture.filter(v => v !== "Open to all");
  const effectiveFaithFilter   = filterFaith.filter(v => v !== "Open to all");
  const filtersActive = effectiveCultureFilter.length > 0 || effectiveFaithFilter.length > 0;

  // ── Infinite-scroll feed state ──────────────────────────────────────────────
  const [feed, setFeed]                       = useState<FeedCard[]>([]);
  const [matchModal, setMatchModal]           = useState<{ name: string; photoUrl: string | null } | null>(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [isLoadingMore, setIsLoadingMore]     = useState(false);
  const [hasMore, setHasMore]                 = useState(false);
  const [reachedTierLimit, setReachedTierLimit] = useState(false);
  const [feedTier, setFeedTier]               = useState("free");
  const sentinelRef  = useRef<HTMLDivElement>(null);
  const offsetRef    = useRef(0);
  const fetchingRef  = useRef(false);

  // Always-fresh refs so async callbacks never close over stale filter arrays
  const cultureRef = useRef(effectiveCultureFilter);
  const faithRef   = useRef(effectiveFaithFilter);
  cultureRef.current = effectiveCultureFilter;
  faithRef.current   = effectiveFaithFilter;

  const fetchPage = useCallback(async (reset: boolean) => {
    if (fetchingRef.current && !reset) return;
    fetchingRef.current = true;

    const offset = reset ? 0 : offsetRef.current;
    if (reset) {
      offsetRef.current = 0;
      setFeed([]);
      setHasMore(false);
      setReachedTierLimit(false);
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const heritage = cultureRef.current;
      const faith    = faithRef.current;
      const params   = new URLSearchParams({ offset: String(offset), limit: "10" });
      if (heritage.length) params.set("heritage", heritage.join(","));
      if (faith.length)    params.set("faith",    faith.join(","));

      const token = localStorage.getItem("da_token");
      const res = await fetch(`${API_BASE}/api/matches/feed?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Feed fetch failed");

      const data: FeedPageResponse = await res.json();
      setFeed(prev => reset ? data.feed : [...prev, ...data.feed]);
      setHasMore(data.hasMore);
      setReachedTierLimit(data.reachedTierLimit);
      setFeedTier(data.tier);
      offsetRef.current = offset + (data.feed?.length ?? 0);
    } catch {
      // keep current feed on error
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      fetchingRef.current = false;
    }
  }, []); // reads latest filters via refs — no stale-closure risk

  // Initial load on mount
  useEffect(() => { fetchPage(true); }, []);

  // Reset + reload whenever filters change
  const filterKey = effectiveCultureFilter.slice().sort().join(",") + "|" + effectiveFaithFilter.slice().sort().join(",");
  const prevFilterKey = useRef<string | null>(null);
  useEffect(() => {
    if (prevFilterKey.current === null) { prevFilterKey.current = filterKey; return; }
    if (prevFilterKey.current === filterKey) return;
    prevFilterKey.current = filterKey;
    fetchPage(true);
  }, [filterKey]);

  // IntersectionObserver: load next page when sentinel scrolls into view
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading && !reachedTierLimit) {
          fetchPage(false);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, reachedTierLimit, fetchPage]);

  const handleAction = (id: string, action: 'like' | 'pass', card: FeedCard) => {
    setFeed(prev => prev.filter(c => c.user.id !== id));
    
    if (action === 'like') {
      likeMutation.mutate({ id }, {
        onSuccess: (res: any) => {
          refreshNotifs();
          if (res.mutual) {
            setMatchModal({ name: card.user.name, photoUrl: card.user.photoUrl ?? null });
          } else {
            toast({ title: "Like sent!", description: "We'll let you know if they like you back." });
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
           <div className="sticky top-28 bg-white p-6 rounded-3xl border border-border shadow-sm space-y-6">
              <h3 className="font-display font-bold text-xl">Discover Filters</h3>

              {/* Country preference filter */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2.5">Country preference</label>
                <CustomChipSelect
                  selected={filterCulture}
                  onChange={() => {}}
                  onToggleValue={handleCultureToggle}
                  presets={FILTER_CULTURAL_PRESETS}
                  groups={COUNTRY_GROUPS}
                  fieldType="heritage"
                  multiSelect
                  allowCustom
                  customPlaceholder="e.g. Congolese, Cape Verdean..."
                />
              </div>

              <hr className="border-border" />

              {/* Faith filter */}
              <div>
                <label className="text-sm font-semibold text-foreground block mb-2.5">Faith preference</label>
                <CustomChipSelect
                  selected={filterFaith}
                  onChange={() => {}}
                  onToggleValue={handleFaithToggle}
                  presets={FILTER_FAITH_PRESETS}
                  fieldType="faith"
                  multiSelect
                  allowCustom
                  customPlaceholder="e.g. Anglican, Sunni..."
                />
              </div>

              {(filterCulture.length > 0 || filterFaith.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1 text-center"
                >
                  Clear all filters
                </button>
              )}
              
              {(!paymentStatus || paymentStatus.tier === 'free') ? (
                <div className="bg-gradient-to-br from-primary/10 to-transparent p-5 rounded-2xl border border-primary/20">
                  <div className="flex items-center gap-2 text-primary font-bold mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Serious Badge</span>
                  </div>
                  <p className="text-sm text-foreground/80 mb-4">Upgrade to Core or Badge to see who liked you and get priority matching.</p>
                  <Link href="/premium" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">View Plans</Link>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-yellow-50 to-transparent p-5 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2 font-bold mb-1 text-yellow-700">
                    <Sparkles className="w-4 h-4" />
                    <span>{paymentStatus.tier === 'badge' ? 'Serious Badge' : 'Core Member'}</span>
                  </div>
                  <p className="text-sm text-foreground/70">
                    {paymentStatus.tier === 'badge'
                      ? 'Priority matching, exclusive badge pool, and unlimited access active.'
                      : 'Full messaging access and unlimited matches active.'}
                  </p>
                </div>
              )}
           </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full">

          {/* ── Mobile filter pill button ─────────────────────────── */}
          <div className="flex items-center gap-3 mb-4 lg:hidden">
            <button
              onClick={openFilterSheet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-white shadow-sm text-sm font-semibold hover:border-primary/40 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filters
              {filtersActive && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold leading-none">
                  {effectiveCultureFilter.length + effectiveFaithFilter.length}
                </span>
              )}
            </button>
            {filtersActive && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 text-primary">
               <Heart className="w-12 h-12 animate-pulse mb-4" />
               <p className="font-display text-xl animate-pulse">Finding your best matches...</p>
             </div>
          ) : (
            <div className="space-y-0 pb-24">
              {/* Likes You section */}
              <LikesYouPanel />

              {feed.length === 0 && !isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-border text-center shadow-sm">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">
                    {filtersActive ? "No profiles match your filters" : "You're all caught up!"}
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    {filtersActive
                      ? "Try removing some filters to see more profiles, or add a custom value."
                      : "We're searching for more high-quality matches for you. Check back later."}
                  </p>
                  {filtersActive ? (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
                    >
                      Clear all filters
                    </button>
                  ) : (
                    <button onClick={() => fetchPage(true)} className="px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors">Refresh Feed</button>
                  )}
                </div>
              ) : (
                <div className="space-y-12">
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
                          <UserAvatar name={card.user.name} photoUrl={card.user.photoUrl} className="w-full h-full" textClassName="text-8xl font-bold" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 md:opacity-100 transition-opacity"></div>
                          
                          <div className="absolute bottom-6 left-6 right-6 md:hidden">
                            <h2 className="text-3xl font-display font-bold text-white drop-shadow-md">{card.user.name}, {card.user.age}</h2>
                          </div>
                        </div>
                        
                        {/* Info Side */}
                        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between bg-white relative">
                          
                          <div>
                            <div className="hidden md:flex justify-between items-start mb-1">
                              <h2 className="text-3xl font-display font-bold text-foreground">{card.user.name}, {card.user.age}</h2>
                              {card.user.hasBadge && (
                                <SeriousBadgeIcon size={34} title="Serious Badge Verified" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-6">
                              <MapPin className="w-4 h-4" />
                              <span className="font-medium">{card.user.city}, {card.user.country}</span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                              {card.user.intent && (
                                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg border border-border/50">{formatTag(card.user.intent)}</span>
                              )}
                              {card.user.faith && (
                                <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg border border-border/50">{formatTag(card.user.faith)}</span>
                              )}
                              {card.user.heritage?.map(h => (
                                <span key={h} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg border border-border/50">{formatTag(h)}</span>
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
                              onClick={() => handleAction(card.user.id, 'pass', card)}
                              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white border-2 border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-all shadow-sm"
                            >
                              <X className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                            <button 
                              onClick={() => handleAction(card.user.id, 'like', card)}
                              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Heart className="w-6 h-6 md:w-8 md:h-8 fill-white" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* ── Infinite scroll sentinel + bottom states ────────────── */}
                  <div ref={sentinelRef} className="h-4" />

                  {/* Loading more spinner */}
                  {isLoadingMore && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                    </div>
                  )}

                  {/* Free-tier: show upgrade prompt whenever they reach the end of their feed */}
                  {feedTier === "free" && !hasMore && !isLoadingMore && (reachedTierLimit || feed.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-primary/10 via-background to-transparent border border-primary/20 rounded-3xl p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-display font-bold mb-2">You've seen your 5 free profiles today</h3>
                      <p className="text-muted-foreground mb-6">Upgrade to Core or Badge to unlock unlimited daily discoveries and see who liked you.</p>
                      <Link href="/premium" className="inline-block px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                        Upgrade Now
                      </Link>
                    </motion.div>
                  )}

                  {/* All caught up (paid tier only, no more profiles) */}
                  {!hasMore && feedTier !== "free" && !isLoadingMore && feed.length > 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <p className="font-display text-lg mb-1">You're all caught up!</p>
                      <p className="text-sm">We're finding more high-quality matches for you. Check back later.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Filter Bottom Sheet ─────────────────────────────────────── */}
      <AnimatePresence>
        {filterSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterSheetOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            />
            {/* Sheet */}
            <motion.div
              key="filter-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden"
              style={{ maxHeight: "82dvh", display: "flex", flexDirection: "column" }}
            >
              {/* Handle + header */}
              <div className="shrink-0 flex items-center justify-between px-6 pt-4 pb-4 border-b border-border">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-border rounded-full" />
                <h3 className="font-display font-bold text-xl mt-1">Filters</h3>
                {draftFiltersActive && (
                  <button onClick={clearFilterSheet} className="text-sm text-primary font-semibold">
                    Clear all
                  </button>
                )}
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2.5">Country preference</label>
                  <CustomChipSelect
                    selected={draftCulture}
                    onChange={() => {}}
                    onToggleValue={v => {
                      setDraftCulture(prev => {
                        if (v === "Open to all") return prev.includes("Open to all") ? [] : ["Open to all"];
                        if (prev.includes("Open to all")) return [v];
                        return prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v];
                      });
                    }}
                    presets={FILTER_CULTURAL_PRESETS}
                    groups={COUNTRY_GROUPS}
                    fieldType="heritage"
                    multiSelect
                    allowCustom
                    customPlaceholder="e.g. Congolese, Cape Verdean..."
                  />
                </div>
                <hr className="border-border" />
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-2.5">Faith preference</label>
                  <CustomChipSelect
                    selected={draftFaith}
                    onChange={() => {}}
                    onToggleValue={v => {
                      setDraftFaith(prev => {
                        if (v === "Open to all") return prev.includes("Open to all") ? [] : ["Open to all"];
                        if (prev.includes("Open to all")) return [v];
                        return prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v];
                      });
                    }}
                    presets={FILTER_FAITH_PRESETS}
                    fieldType="faith"
                    multiSelect
                    allowCustom
                    customPlaceholder="e.g. Anglican, Sunni..."
                  />
                </div>
              </div>

              {/* Apply button */}
              <div className="shrink-0 px-6 py-4 border-t border-border bg-white"
                   style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
                <button
                  onClick={applyFilterSheet}
                  className="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Match celebration modal */}
      <AnimatePresence>
        {matchModal && (
          <MatchModal
            name={matchModal.name}
            photoUrl={matchModal.photoUrl}
            onClose={() => setMatchModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
