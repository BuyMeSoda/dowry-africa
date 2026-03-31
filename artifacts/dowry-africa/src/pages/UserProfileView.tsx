import { useRoute, useLocation } from "wouter";
import { useGetUserById, useGetConversations, useLikeUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { ChevronLeft, Heart, MessageCircle, MapPin, Loader2, Sparkles } from "lucide-react";
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

      <div className="max-w-2xl mx-auto px-4 pt-6 md:pt-10 pb-36">
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
            className="space-y-6"
          >
            {/* Photo + name hero */}
            <div className="bg-white rounded-3xl shadow-sm border border-border/50 overflow-hidden">
              <div className="aspect-[4/3] w-full relative">
                <UserAvatar
                  name={profile.name}
                  photoUrl={profile.photoUrl}
                  className="w-full h-full"
                  textClassName="text-[10rem] font-bold"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-end gap-3">
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

              {/* Tags */}
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
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

                {profile.quote && (
                  <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-4 text-xl font-display italic text-foreground/90">
                    "{profile.quote}"
                  </blockquote>
                )}

                {profile.bio && (
                  <div className="mt-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">About</h3>
                    <p className="text-foreground leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Details card */}
            {(profile.languages?.length || profile.hasBadge) && (
              <div className="bg-white rounded-3xl shadow-sm border border-border/50 p-6 space-y-4">
                {profile.hasBadge && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
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
          </motion.div>
        )}
      </div>

      {/* Sticky CTA bar */}
      {profile && !isLoading && me?.id !== userId && (
        <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl md:px-4 z-40">
          <div className="bg-white/95 backdrop-blur-sm border-t md:border md:rounded-2xl border-border/60 shadow-2xl px-6 py-4 flex gap-3">
            {isMatched ? (
              <>
                <button
                  onClick={handleLike}
                  disabled={liked || likeMutation.isPending}
                  className="flex-1 py-3.5 border-2 border-primary text-primary rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-40"
                >
                  <Heart className={`w-5 h-5 ${liked ? "fill-primary" : ""}`} />
                  {liked ? "Liked" : "Like"}
                </button>
                <button
                  onClick={handleMessage}
                  className="flex-1 py-3.5 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Message
                </button>
              </>
            ) : (
              <button
                onClick={handleLike}
                disabled={liked || likeMutation.isPending}
                className="flex-1 py-3.5 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {likeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Heart className={`w-5 h-5 ${liked ? "fill-white" : ""}`} />
                    {liked ? "Liked ✓" : "Like"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
