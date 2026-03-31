import { useRoute, useLocation } from "wouter";
import { useGetUserById, useGetConversations, useLikeUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { ChevronLeft, Heart, MessageCircle, MapPin, Loader2, Sparkles, Users, Baby, Clock, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTag } from "@/lib/format-tags";

function MatchBanner({ name, onClose, onMessage }: { name: string; onClose: () => void; onMessage: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-5 flex flex-col items-center gap-3 w-72 text-center"
    >
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <Heart key={i} className="w-4 h-4 text-primary fill-primary" />
        ))}
      </div>
      <p className="font-display font-bold text-lg">It's a Match!</p>
      <p className="text-sm text-muted-foreground">You and {name} liked each other.</p>
      <div className="flex gap-2 w-full">
        <button
          onClick={onMessage}
          className="flex-1 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          Message
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-2 border border-border rounded-full text-sm font-medium hover:bg-secondary transition-colors"
        >
          Stay Here
        </button>
      </div>
    </motion.div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground/70 shrink-0">{icon}</span>
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function UserProfileView() {
  const [, params] = useRoute("/members/:id");
  const [, setLocation] = useLocation();
  const { user: me } = useAuth();
  const { toast } = useToast();
  const userId = params?.id ?? "";

  const { data: profile, isLoading, isError } = useGetUserById(userId, { query: { enabled: !!userId } });
  const { data: convosData } = useGetConversations();
  const likeMutation = useLikeUser();

  const [matchBanner, setMatchBanner] = useState(false);
  const [liked, setLiked] = useState(false);

  const conversations = convosData?.conversations ?? [];
  const isMatched = conversations.some((c: any) => c.userId === userId);
  const isOwnProfile = me?.id === userId;

  const handleLike = () => {
    if (liked) return;
    likeMutation.mutate({ id: userId }, {
      onSuccess: (res: any) => {
        setLiked(true);
        if (res.mutual) {
          setMatchBanner(true);
        } else {
          toast({ title: "Liked!", description: `You liked ${profile?.name}.` });
        }
      },
      onError: () => {
        toast({ variant: "destructive", title: "Could not send like", description: "Please try again." });
      }
    });
  };

  const handleMessage = () => setLocation(`/messages/${userId}`);

  const goBack = () => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "messages") {
      setLocation("/messages");
    } else {
      setLocation("/discover");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <AnimatePresence>
        {matchBanner && (
          <MatchBanner
            name={profile?.name ?? ""}
            onClose={() => setMatchBanner(false)}
            onMessage={() => { setMatchBanner(false); handleMessage(); }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-10 pb-20">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
          </div>
        )}

        {isError && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium">Profile not found.</p>
            <button onClick={goBack} className="mt-4 text-primary hover:underline font-medium">Go Back</button>
          </div>
        )}

        {profile && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* ── Photo hero ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden">
              <div className="aspect-[4/3] w-full relative">
                <UserAvatar
                  name={profile.name}
                  photoUrl={profile.photoUrl}
                  className="w-full h-full"
                  textClassName="text-[10rem] font-bold"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Floating action button — top right of photo */}
                {!isOwnProfile && (
                  <div className="absolute top-4 right-4">
                    {isMatched ? (
                      <button
                        onClick={handleMessage}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-full font-semibold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    ) : (
                      <button
                        onClick={handleLike}
                        disabled={liked || likeMutation.isPending}
                        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60 disabled:scale-100 ${
                          liked
                            ? "bg-primary text-white"
                            : "bg-white/90 backdrop-blur-sm text-primary hover:bg-white"
                        }`}
                        title={liked ? "Liked" : "Like"}
                      >
                        {likeMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Name / location overlay */}
                <div className="absolute bottom-5 left-6 right-6">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h1 className="text-4xl font-display font-bold text-white drop-shadow-md">
                        {profile.name}{profile.age ? `, ${profile.age}` : ""}
                      </h1>
                      {(profile.city || profile.country) && (
                        <div className="flex items-center gap-1.5 text-white/80 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </div>
                    {profile.hasBadge && <SeriousBadgeIcon size={32} title="Serious Badge Verified" />}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tags ───────────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl shadow-sm border border-border/50 px-6 py-5">
              <div className="flex flex-wrap gap-2">
                {profile.intent && (
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full border border-primary/20">
                    {formatTag(profile.intent)}
                  </span>
                )}
                {profile.faith && (
                  <span className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-full border border-border/50">
                    {formatTag(profile.faith)}
                  </span>
                )}
                {profile.heritage?.map((h: string) => (
                  <span key={h} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-full border border-border/50">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Quote ──────────────────────────────────────────────────── */}
            {profile.quote && (
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 px-6 py-5">
                <blockquote className="border-l-4 border-primary/40 pl-4 py-1 text-xl font-display italic text-foreground/90">
                  "{profile.quote}"
                </blockquote>
              </div>
            )}

            {/* ── About / Bio (hidden if empty) ──────────────────────────── */}
            {profile.bio && profile.bio.trim() && (
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 px-6 py-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">About</h3>
                <p className="text-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* ── Background info ────────────────────────────────────────── */}
            {(profile.city || profile.country || profile.faith || profile.childrenPref || profile.marriageTimeline || profile.familyInvolvement) && (
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 px-6 py-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Background</h3>
                <div>
                  {(profile.city || profile.country) && (
                    <DetailRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="Location"
                      value={[profile.city, profile.country].filter(Boolean).join(", ")}
                    />
                  )}
                  {profile.faith && (
                    <DetailRow
                      icon={<Sparkles className="w-4 h-4" />}
                      label="Faith"
                      value={formatTag(profile.faith)}
                    />
                  )}
                  {profile.childrenPref && (
                    <DetailRow
                      icon={<Baby className="w-4 h-4" />}
                      label="Children"
                      value={formatTag(profile.childrenPref)}
                    />
                  )}
                  {profile.marriageTimeline && (
                    <DetailRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Timeline"
                      value={formatTag(profile.marriageTimeline)}
                    />
                  )}
                  {profile.familyInvolvement && (
                    <DetailRow
                      icon={<Home className="w-4 h-4" />}
                      label="Family involvement"
                      value={profile.familyInvolvement.charAt(0).toUpperCase() + profile.familyInvolvement.slice(1)}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Languages + Badge ──────────────────────────────────────── */}
            {(profile.languages?.length > 0 || profile.hasBadge) && (
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 px-6 py-5 space-y-4">
                {profile.hasBadge && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-700 text-sm">Serious Badge Verified</p>
                      <p className="text-xs text-muted-foreground">Demonstrated intent &amp; seriousness</p>
                    </div>
                  </div>
                )}
                {profile.languages?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((l: string) => (
                        <span key={l} className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Send Message CTA (when matched) ────────────────────────── */}
            {!isOwnProfile && isMatched && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleMessage}
                  className="px-8 py-3.5 bg-primary text-white rounded-full font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
              </div>
            )}

            {/* ── Report link ────────────────────────────────────────────── */}
            {!isOwnProfile && (
              <div className="flex justify-center pt-4 pb-2">
                <button
                  onClick={() => toast({ title: "Report submitted", description: "Thank you. Our team will review this profile." })}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline underline-offset-2"
                >
                  Report this profile
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
