import { useRoute, useLocation } from "wouter";
import {
  useGetUserById,
  useGetConversations,
  useLikeUser,
  useGetMatchStatus,
  useUnlikeUser,
  useUnmatch,
  useBlockUser,
  useSubmitReport,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SeriousBadgeIcon } from "@/components/ui/SeriousBadgeIcon";
import { TierBadge } from "@/components/ui/TierBadge";
import {
  ChevronLeft, Heart, MessageCircle, MapPin, Globe, Loader2, Sparkles,
  Baby, Clock, Home, MoreVertical, X, AlertCircle, ShieldOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatTag } from "@/lib/format-tags";
import { useQueryClient } from "@tanstack/react-query";

const REPORT_REASONS = [
  { value: "fake_profile",          label: "Fake or misleading profile" },
  { value: "harassment",            label: "Harassment or threats" },
  { value: "inappropriate_content", label: "Inappropriate photos or content" },
  { value: "scam",                  label: "Scam or fraud" },
  { value: "spam",                  label: "Spam" },
  { value: "underage",              label: "Appears to be underage" },
  { value: "other",                 label: "Other" },
];

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

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10"
      >
        <h3 className="font-display font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-5">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-border rounded-full text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-colors disabled:opacity-60 ${confirmClass ?? "bg-red-500 hover:bg-red-600"}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReportModal({
  name,
  userId,
  onClose,
  onBlock,
}: {
  name: string;
  userId: string;
  onClose: () => void;
  onBlock: () => void;
}) {
  const { toast } = useToast();
  const reportMutation = useSubmitReport();
  const blockMutation = useBlockUser();

  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    try {
      await reportMutation.mutateAsync({ reportedUserId: userId, reason, details: details.trim() || undefined });
      if (alsoBlock) {
        await blockMutation.mutateAsync(userId);
        onBlock();
        return;
      }
      toast({ title: "Report submitted", description: "Thank you. Our team will review this." });
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Could not submit report", description: "Please try again." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md z-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Report {name}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white"
            >
              <option value="">Select a reason…</option>
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Additional details (optional)</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Tell us more about what happened…"
              rows={3}
              maxLength={500}
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={alsoBlock}
              onChange={e => setAlsoBlock(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-sm font-medium">Also block {name}</span>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-full text-sm font-medium hover:bg-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || reportMutation.isPending || blockMutation.isPending}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-bold disabled:opacity-60 transition-colors"
            >
              {reportMutation.isPending || blockMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                : "Submit Report"
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
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
  const queryClient = useQueryClient();
  const userId = params?.id ?? "";

  const { data: profile, isLoading, isError } = useGetUserById(userId, { query: { enabled: !!userId } });
  const { data: convosData, refetch: refetchConvos } = useGetConversations();
  const { data: statusData, refetch: refetchStatus } = useGetMatchStatus(userId);
  const likeMutation    = useLikeUser();
  const unlikeMutation  = useUnlikeUser();
  const unmatchMutation = useUnmatch();
  const blockMutation   = useBlockUser();

  const [matchBanner, setMatchBanner] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const conversations = convosData?.conversations ?? [];
  const isMatched = conversations.some((c: any) => c.userId === userId);
  const isOwnProfile = me?.id === userId;
  const alreadyLiked = statusData?.liked ?? false;

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLike = () => {
    if (alreadyLiked) return;
    likeMutation.mutate({ id: userId }, {
      onSuccess: (res: any) => {
        refetchStatus();
        if (res.mutual) {
          refetchConvos();
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

  const handleUnlike = () => {
    unlikeMutation.mutate(userId, {
      onSuccess: () => {
        refetchStatus();
        toast({ title: "Like removed" });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Could not remove like", description: "Please try again." });
      }
    });
  };

  const handleUnmatch = () => {
    unmatchMutation.mutate(userId, {
      onSuccess: () => {
        setConfirmUnmatch(false);
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        refetchConvos();
        refetchStatus();
        toast({ title: "Unmatched", description: `You've been unmatched with ${profile?.name}.` });
        goBack();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Could not unmatch", description: "Please try again." });
      }
    });
  };

  const handleBlock = () => {
    blockMutation.mutate(userId, {
      onSuccess: () => {
        setConfirmBlock(false);
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        refetchConvos();
        toast({ title: `${profile?.name} blocked`, description: "You won't see each other anymore." });
        goBack();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Could not block user", description: "Please try again." });
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

      {/* Modals */}
      <AnimatePresence>
        {confirmUnmatch && (
          <ConfirmDialog
            title={`Unmatch with ${profile?.name}?`}
            description="This will remove the match and delete all messages between you. This cannot be undone."
            confirmLabel="Unmatch"
            onConfirm={handleUnmatch}
            onCancel={() => setConfirmUnmatch(false)}
            loading={unmatchMutation.isPending}
          />
        )}
        {confirmBlock && (
          <ConfirmDialog
            title={`Block ${profile?.name}?`}
            description="You won't see each other in the app. The match and all messages will be removed."
            confirmLabel="Block"
            onConfirm={handleBlock}
            onCancel={() => setConfirmBlock(false)}
            loading={blockMutation.isPending}
          />
        )}
        {showReport && (
          <ReportModal
            name={profile?.name ?? "this user"}
            userId={userId}
            onClose={() => setShowReport(false)}
            onBlock={() => {
              setShowReport(false);
              queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
              refetchConvos();
              toast({ title: `${profile?.name} blocked`, description: "You won't see each other anymore." });
              goBack();
            }}
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

                {/* Three-dots menu — top left of photo */}
                {!isOwnProfile && (
                  <div className="absolute top-4 left-4" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(v => !v)}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                      title="Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          className="absolute top-12 left-0 bg-white rounded-2xl shadow-xl border border-border min-w-[180px] z-20 overflow-hidden"
                        >
                          {isMatched && (
                            <button
                              onClick={() => { setShowMenu(false); setConfirmUnmatch(true); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left border-b border-border/50"
                            >
                              <X className="w-4 h-4 text-orange-500" />
                              <span className="font-medium">Unmatch</span>
                            </button>
                          )}
                          <button
                            onClick={() => { setShowMenu(false); setConfirmBlock(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left border-b border-border/50"
                          >
                            <ShieldOff className="w-4 h-4 text-red-500" />
                            <span className="font-medium">Block {profile.name}</span>
                          </button>
                          <button
                            onClick={() => { setShowMenu(false); setShowReport(true); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left"
                          >
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="font-medium text-muted-foreground">Report {profile.name}</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Heart / Message button — top right of photo */}
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
                    ) : alreadyLiked ? (
                      <button
                        onClick={handleUnlike}
                        disabled={unlikeMutation.isPending}
                        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60 bg-primary text-white"
                        title="Unlike"
                      >
                        {unlikeMutation.isPending
                          ? <Loader2 className="w-5 h-5 animate-spin" />
                          : <Heart className="w-5 h-5 fill-white" />
                        }
                      </button>
                    ) : (
                      <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-60 bg-white/90 backdrop-blur-sm text-primary hover:bg-white"
                        title="Like"
                      >
                        {likeMutation.isPending
                          ? <Loader2 className="w-5 h-5 animate-spin" />
                          : <Heart className="w-5 h-5" />
                        }
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
                    <TierBadge tier={profile.tier ?? "free"} hasBadge={profile.hasBadge} size="md" />
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
            {(profile.city || profile.country || (profile.heritage?.length > 0) || profile.faith || profile.childrenPref || profile.marriageTimeline || profile.familyInvolvement) && (
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
                  {profile.heritage?.length > 0 && (
                    <DetailRow
                      icon={<Globe className="w-4 h-4" />}
                      label="Country of origin"
                      value={(profile.heritage as string[]).join(", ")}
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
            {(profile.languages?.length > 0 || profile.hasBadge || profile.tier === "core") && (
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
                {!profile.hasBadge && profile.tier === "core" && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                      <TierBadge tier="core" hasBadge={false} size="sm" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-700 text-sm">Core Member</p>
                      <p className="text-xs text-muted-foreground">Premium access &amp; full messaging</p>
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

            {/* ── Report / safety footer ──────────────────────────────────── */}
            {!isOwnProfile && (
              <div className="flex justify-center pt-4 pb-2">
                <button
                  onClick={() => setShowReport(true)}
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
