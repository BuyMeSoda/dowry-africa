import { useState, useEffect, useRef } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { TierBadge } from "@/components/ui/TierBadge";
import { Navbar } from "@/components/layout/Navbar";
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  useUnmatch,
  useBlockUser,
  useGetLikedMe,
  useLikeUser,
  usePassLiker,
  useGetSentLikes,
  useUnlikeUser,
  usePaymentStatusFull,
  useSubmitUpgradeInterest,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useToast } from "@/hooks/use-toast";
import {
  Send, MessageCircle, ChevronLeft, Heart, Sparkles,
  MoreVertical, X, ShieldOff, AlertCircle, Loader2,
  Clock, Undo2, Lock,
} from "lucide-react";
import { format } from "date-fns";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "matches" | "liked-you" | "pending";

// ── Shared confirm dialog ──────────────────────────────────────────────────
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClassName?: string;
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
            className={`flex-1 py-2.5 rounded-full text-sm font-bold text-white transition-colors disabled:opacity-60 ${confirmClassName ?? "bg-red-500 hover:bg-red-600"}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Match celebration modal ────────────────────────────────────────────────
function MatchModal({
  name,
  photoUrl,
  userId,
  onMessage,
  onClose,
}: {
  name: string;
  photoUrl: string | null;
  userId: string;
  onMessage: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm z-10 text-center"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary mx-auto mb-4 shadow-lg shadow-primary/20">
          <UserAvatar name={name} photoUrl={photoUrl} className="w-full h-full" textClassName="text-2xl font-bold" />
        </div>
        <div className="flex items-center justify-center gap-2 text-primary mb-2">
          <Heart className="w-5 h-5 fill-primary" />
          <span className="text-sm font-bold uppercase tracking-widest">It's a Match!</span>
          <Heart className="w-5 h-5 fill-primary" />
        </div>
        <h3 className="font-display font-bold text-2xl mb-2">You and {name}</h3>
        <p className="text-muted-foreground text-sm mb-6">Both liked each other. Start a meaningful conversation.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onMessage}
            className="w-full py-3 bg-primary text-white rounded-full font-bold shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all"
          >
            Send a message
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Keep discovering
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Messages page ─────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuth();
  const { refresh: refreshNotifs, markSeen } = useNotifications();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/messages/:id");
  const activeUserId = match ? params?.id : null;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("matches");
  const [matchModal, setMatchModal] = useState<{ userId: string; name: string; photoUrl: string | null } | null>(null);

  // ── Matches / conversations ──────────────────────────────────────────────
  const { data: convosData, isLoading: convosLoading, refetch: refetchConvos } = useGetConversations({ query: { refetchInterval: 15_000 } });
  const { data: msgsData, isLoading: msgsLoading, refetch } = useGetMessages(activeUserId || "", { query: { enabled: !!activeUserId, refetchInterval: activeUserId ? 5_000 : false } });
  const sendMutation    = useSendMessage();
  const unmatchMutation = useUnmatch();
  const blockMutation   = useBlockUser();

  const [text, setText] = useState("");
  const [localMsgs, setLocalMsgs] = useState<any[]>([]);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Scroll refs ───────────────────────────────────────────────────────────
  const bottomRef           = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef     = useRef(true);
  const justSentRef         = useRef(false);

  // ── Payment status / daily limits (free tier UX) ─────────────────────────
  const { data: paymentStatus, refetch: refetchPaymentStatus } = usePaymentStatusFull({ query: { refetchInterval: 60_000 } });
  const upgradeInterestMutation = useSubmitUpgradeInterest();
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  // ── Liked You (received) ─────────────────────────────────────────────────
  const { data: likedMeData, isLoading: likedMeLoading, refetch: refetchLikedMe } = useGetLikedMe({ query: { refetchInterval: 30_000 } });
  const likeMutation = useLikeUser();
  const passLikerMutation = usePassLiker();
  const [likingBackId, setLikingBackId] = useState<string | null>(null);
  const [passingId,    setPassingId]    = useState<string | null>(null);

  // ── Pending (sent) ───────────────────────────────────────────────────────
  const { data: sentData, isLoading: sentLoading, refetch: refetchSent } = useGetSentLikes({ query: { refetchInterval: 30_000 } });
  const withdrawMutation = useUnlikeUser();
  const [withdrawTarget, setWithdrawTarget] = useState<{ userId: string; name: string } | null>(null);

  // ── Tab counts for badges ────────────────────────────────────────────────
  const likedMeCount = likedMeData?.count ?? 0;
  const sentCount    = sentData?.count ?? 0;

  useEffect(() => {
    if (msgsData?.messages) {
      setLocalMsgs(msgsData.messages);
      refreshNotifs();
      refetchConvos();
    }
  }, [msgsData]);

  // Mark match notifications as seen as soon as the user views the Matches tab
  useEffect(() => {
    if (activeTab === "matches") {
      markSeen("match");
    }
  }, [activeTab]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setShowHeaderMenu(false); }, [activeUserId]);

  // Attach a passive scroll listener to track whether the user is near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  // When conversation changes, assume user is at the bottom so the first load auto-scrolls
  useEffect(() => {
    isNearBottomRef.current = true;
    justSentRef.current = false;
  }, [activeUserId]);

  // Auto-scroll when localMsgs change: always if the user just sent, otherwise only if near bottom
  useEffect(() => {
    if (!localMsgs.length) return;
    if (justSentRef.current || isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      justSentRef.current = false;
    }
  }, [localMsgs]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;
    const newText = text;
    setText("");
    justSentRef.current = true;
    const tempId = Date.now().toString();
    setLocalMsgs(prev => [...prev, { id: tempId, text: newText, fromId: user?.id, createdAt: new Date().toISOString() }]);
    sendMutation.mutate({ userId: activeUserId, data: { text: newText } }, {
      onSuccess: () => { refetch(); refetchPaymentStatus(); },
      onError: (err: any) => {
        setLocalMsgs(localMsgs);
        if (err?.status === 429) {
          refetchPaymentStatus();
          refetch();
          toast({
            variant: "destructive",
            title: "Daily message limit reached",
            description: "You've used all your free messages for today. Upgrade for unlimited.",
          });
        } else {
          toast({ variant: "destructive", title: "Could not send", description: "Please try again." });
        }
      },
    });
  };

  const handleUnmatch = () => {
    if (!activeUserId) return;
    unmatchMutation.mutate(activeUserId, {
      onSuccess: () => {
        setConfirmUnmatch(false);
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        refetchConvos();
        toast({ title: "Unmatched", description: `You've been unmatched with ${activeConvo?.name}.` });
        setLocation("/messages");
      },
      onError: () => toast({ variant: "destructive", title: "Could not unmatch", description: "Please try again." }),
    });
  };

  const handleBlock = () => {
    if (!activeUserId) return;
    blockMutation.mutate(activeUserId, {
      onSuccess: () => {
        setConfirmBlock(false);
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        refetchConvos();
        toast({ title: `${activeConvo?.name} blocked`, description: "You won't see each other anymore." });
        setLocation("/messages");
      },
      onError: () => toast({ variant: "destructive", title: "Could not block user", description: "Please try again." }),
    });
  };

  const handleLikeBack = (targetUserId: string, name: string, photoUrl: string | null) => {
    setLikingBackId(targetUserId);
    likeMutation.mutate({ id: targetUserId }, {
      onSuccess: (data: any) => {
        setLikingBackId(null);
        refetchLikedMe();
        refetchConvos();
        queryClient.invalidateQueries({ queryKey: ["/api/matches/sent"] });
        if (data?.mutual) {
          setMatchModal({ userId: targetUserId, name, photoUrl });
        } else {
          toast({ title: "Liked!", description: `You liked ${name} back.` });
        }
      },
      onError: (err: any) => {
        setLikingBackId(null);
        if (err?.status === 429) {
          refetchPaymentStatus();
          toast({
            variant: "destructive",
            title: "Daily like limit reached",
            description: "You've liked the maximum number of profiles today. Limit resets at midnight UTC.",
          });
        } else {
          toast({ variant: "destructive", title: "Could not like", description: "Please try again." });
        }
      },
    });
  };

  const handlePassLiker = (targetUserId: string) => {
    setPassingId(targetUserId);
    passLikerMutation.mutate(targetUserId, {
      onSuccess: () => {
        setPassingId(null);
        refetchLikedMe();
      },
      onError: () => {
        setPassingId(null);
        toast({ variant: "destructive", title: "Could not pass", description: "Please try again." });
      },
    });
  };

  const handleWithdraw = () => {
    if (!withdrawTarget) return;
    withdrawMutation.mutate(withdrawTarget.userId, {
      onSuccess: () => {
        setWithdrawTarget(null);
        refetchSent();
        toast({ title: "Like withdrawn", description: `Your like for ${withdrawTarget.name} has been removed.` });
      },
      onError: () => toast({ variant: "destructive", title: "Could not withdraw", description: "Please try again." }),
    });
  };

  const conversations = convosData?.conversations || [];
  const activeConvo   = conversations.find(c => c.userId === activeUserId);
  const withMessages  = conversations.filter(c => c.lastMessage);
  const freshMatches  = conversations.filter(c => !c.lastMessage);
  const likedBy       = likedMeData?.likedBy ?? [];
  const sentLikes     = sentData?.sent ?? [];

  const isFree = !user || (paymentStatus?.tier ?? (user as any).tier) === "free";
  const dailyLimits = paymentStatus?.dailyLimits ?? null;
  const messagesRemaining = dailyLimits?.messagesRemaining ?? null;
  const messagesLimit = dailyLimits?.messagesLimit ?? null;
  const limitReached = isFree && messagesRemaining !== null && messagesRemaining <= 0;
  const paymentsLive = paymentStatus?.paymentsLive ?? false;

  const handleNotifyMe = () => {
    upgradeInterestMutation.mutate("core", {
      onSuccess: (res) => {
        setInterestSubmitted(true);
        if (res.alreadyRegistered) {
          toast({ title: "You're already on the list", description: "We'll email you the moment payments open up." });
        } else {
          toast({ title: "You're on the list", description: "We'll email you the moment payments open up." });
        }
      },
      onError: () => toast({ variant: "destructive", title: "Could not save", description: "Please try again." }),
    });
  };

  return (
    <div className="bg-background flex flex-col overflow-hidden h-[calc(100dvh-3rem)] md:h-[100dvh]">
      <Navbar />

      {/* Global dialogs */}
      <AnimatePresence>
        {confirmUnmatch && (
          <ConfirmDialog
            title={`Unmatch with ${activeConvo?.name}?`}
            description="This will remove the match and delete all messages. This cannot be undone."
            confirmLabel="Unmatch"
            onConfirm={handleUnmatch}
            onCancel={() => setConfirmUnmatch(false)}
            loading={unmatchMutation.isPending}
          />
        )}
        {confirmBlock && (
          <ConfirmDialog
            title={`Block ${activeConvo?.name}?`}
            description="You won't see each other in the app. The match and all messages will be removed."
            confirmLabel="Block"
            onConfirm={handleBlock}
            onCancel={() => setConfirmBlock(false)}
            loading={blockMutation.isPending}
          />
        )}
        {withdrawTarget && (
          <ConfirmDialog
            title={`Withdraw like from ${withdrawTarget.name}?`}
            description="Your like will be removed. They may reappear in your Discover feed."
            confirmLabel="Withdraw"
            confirmClassName="bg-muted-foreground hover:bg-foreground"
            onConfirm={handleWithdraw}
            onCancel={() => setWithdrawTarget(null)}
            loading={withdrawMutation.isPending}
          />
        )}
        {matchModal && (
          <MatchModal
            name={matchModal.name}
            photoUrl={matchModal.photoUrl}
            userId={matchModal.userId}
            onMessage={() => {
              setMatchModal(null);
              setActiveTab("matches");
              setLocation(`/messages/${matchModal.userId}`);
            }}
            onClose={() => setMatchModal(null)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 w-full flex bg-white overflow-hidden
                       md:container md:mx-auto md:max-w-6xl md:my-8 md:rounded-3xl md:shadow-xl md:border md:border-border/50"
            style={{ height: "inherit", maxHeight: "calc(100dvh - 64px)" }}>

        {/* ── Left Panel ─────────────────────────────────────────────────── */}
        <div className={`${activeUserId && activeTab === "matches" ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-96 flex-col border-r border-border`}>

          {/* Header + tabs */}
          <div className="border-b border-border bg-secondary/10">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-2xl font-display font-bold">Messages</h2>
            </div>
            <div className="flex px-2 pb-0">
              {(["matches", "liked-you", "pending"] as Tab[]).map(tab => {
                const labels: Record<Tab, string> = { matches: "Matches", "liked-you": "Liked You", pending: "Pending" };
                const counts: Record<Tab, number> = { matches: 0, "liked-you": likedMeCount, pending: sentCount };
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); if (tab !== "matches") setLocation("/messages"); }}
                    className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                      isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {labels[tab]}
                    {counts[tab] > 0 && (
                      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold leading-none ${
                        isActive ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"
                      }`}>
                        {counts[tab] > 9 ? "9+" : counts[tab]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── MATCHES TAB ───────────────────────────────────────── */}
            {activeTab === "matches" && (
              <>
                {convosLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <MessageCircle className="w-12 h-12 text-muted/50 mb-4" />
                    <p className="text-muted-foreground font-medium">No matches yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Keep swiping to find your person.</p>
                    <Link href="/discover" className="mt-4 text-sm font-bold text-primary hover:underline">Go to Discover</Link>
                  </div>
                ) : (
                  <div>
                    {freshMatches.length > 0 && (
                      <div className="border-b border-border/50">
                        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold uppercase tracking-widest text-primary">New Matches</span>
                        </div>
                        <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                          {freshMatches.map((c) => (
                            <Link key={c.userId} href={`/messages/${c.userId}`}>
                              <div className="flex flex-col items-center gap-2 cursor-pointer group w-16 shrink-0">
                                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${activeUserId === c.userId ? 'border-primary' : 'border-primary/40 group-hover:border-primary'}`}>
                                  <UserAvatar name={c.name} photoUrl={c.photoUrl} className="w-full h-full" textClassName="text-xl font-bold" />
                                </div>
                                <span className="text-xs text-center font-medium truncate w-full leading-tight">{c.name.split(' ')[0]}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {withMessages.length > 0 && (
                      <div>
                        {freshMatches.length > 0 && (
                          <div className="px-4 pt-4 pb-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conversations</span>
                          </div>
                        )}
                        <div className="divide-y divide-border/50">
                          {withMessages.map((c) => (
                            <div
                              key={c.userId}
                              onClick={() => setLocation(`/messages/${c.userId}`)}
                              className={`p-4 flex gap-4 cursor-pointer hover:bg-secondary/30 transition-colors ${activeUserId === c.userId ? 'bg-secondary/50 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                            >
                              <Link href={`/members/${c.userId}?from=messages`} onClick={e => e.stopPropagation()} className="relative shrink-0">
                                <UserAvatar name={c.name} photoUrl={c.photoUrl} size={56} className="rounded-full hover:opacity-90 transition-opacity" textClassName="text-xl font-bold" />
                                {c.unread > 0 && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {c.unread > 9 ? "9+" : c.unread}
                                  </span>
                                )}
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <Link href={`/members/${c.userId}?from=messages`} onClick={e => e.stopPropagation()} className={`truncate hover:text-primary transition-colors ${c.unread > 0 ? 'font-bold' : 'font-semibold'}`}>
                                      {c.name}
                                    </Link>
                                    <TierBadge tier={(c as any).tier ?? "free"} hasBadge={(c as any).hasBadge} size="sm" />
                                  </div>
                                  {c.lastMessageAt && <span className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(c.lastMessageAt), 'MMM d')}</span>}
                                </div>
                                <p className={`text-sm truncate ${c.unread > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                  {c.lastMessage || 'Say hello!'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {freshMatches.length > 0 && withMessages.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground">You have {freshMatches.length} new {freshMatches.length === 1 ? 'match' : 'matches'}. Say hello!</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── LIKED YOU TAB ─────────────────────────────────────── */}
            {activeTab === "liked-you" && (
              <>
                {likedMeLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading...</div>
                ) : likedBy.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <Heart className="w-12 h-12 text-muted/40 mb-4" />
                    <p className="text-muted-foreground font-medium">No likes yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Keep your profile updated to attract meaningful connections.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {isFree && (
                      <div className="bg-gradient-to-br from-primary/8 to-transparent border border-primary/20 rounded-2xl p-4 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-primary">{likedMeData?.count} {likedMeData?.count === 1 ? "person" : "people"} liked your profile</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Upgrade to see who they are and like them back.</p>
                        <Link href="/premium" className="inline-block text-xs font-bold uppercase tracking-wider text-primary hover:underline">
                          View Plans →
                        </Link>
                      </div>
                    )}
                    {likedBy.map((item: any) => (
                      <LikedYouCard
                        key={item.user.id}
                        item={item}
                        isLikingBack={likingBackId === item.user.id}
                        isPassing={passingId === item.user.id}
                        onLikeBack={() => handleLikeBack(item.user.id, item.user.name, item.user.photoUrl ?? null)}
                        onPass={() => handlePassLiker(item.user.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── PENDING TAB ───────────────────────────────────────── */}
            {activeTab === "pending" && (
              <>
                {sentLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading...</div>
                ) : sentLikes.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center">
                    <Clock className="w-12 h-12 text-muted/40 mb-4" />
                    <p className="text-muted-foreground font-medium">No pending likes.</p>
                    <p className="text-sm text-muted-foreground mt-1">Profiles you like will appear here until they respond.</p>
                    <Link href="/discover" className="mt-4 text-sm font-bold text-primary hover:underline">Go to Discover</Link>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {sentLikes.map((item: any) => (
                      <PendingCard
                        key={item.user.id}
                        item={item}
                        isWithdrawing={withdrawMutation.isPending && withdrawTarget?.userId === item.user.id}
                        onWithdraw={() => setWithdrawTarget({ userId: item.user.id, name: item.user.name })}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* ── Right Chat Panel (Matches tab only) ───────────────────────────── */}
        <div className={`${(!activeUserId || activeTab !== "matches") ? 'hidden md:flex' : 'flex'} flex-1 min-w-0 flex-col bg-background/50`}>
          {!activeUserId || activeTab !== "matches" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Intentional Connections</h2>
              <p className="text-muted-foreground max-w-md">
                {activeTab === "liked-you"
                  ? "Like someone back to start a conversation."
                  : activeTab === "pending"
                  ? "Waiting for your likes to be returned."
                  : "Select a conversation to start messaging."}
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b border-border bg-white flex items-center px-6 gap-4">
                <button onClick={() => setLocation("/messages")} className="md:hidden w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <Link href={`/members/${activeUserId}?from=messages`} className="shrink-0 hover:opacity-90 transition-opacity">
                  <UserAvatar name={activeConvo?.name ?? ""} photoUrl={activeConvo?.photoUrl} size={48} className="rounded-full" textClassName="text-lg font-bold" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/members/${activeUserId}?from=messages`} className="hover:text-primary transition-colors">
                    <h3 className="font-display font-bold text-lg truncate">{activeConvo?.name || 'Match'}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground">Tap name to view profile</p>
                </div>

                <div className="relative shrink-0" ref={menuRef}>
                  <button
                    onClick={() => setShowHeaderMenu(v => !v)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
                    title="Options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {showHeaderMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        className="absolute top-12 right-0 bg-white rounded-2xl shadow-xl border border-border min-w-[200px] z-20 overflow-hidden"
                      >
                        <Link href={`/members/${activeUserId}?from=messages`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors border-b border-border/50" onClick={() => setShowHeaderMenu(false)}>
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">View profile</span>
                        </Link>
                        <button onClick={() => { setShowHeaderMenu(false); setConfirmUnmatch(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left border-b border-border/50">
                          <X className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Unmatch {activeConvo?.name}</span>
                        </button>
                        <button onClick={() => { setShowHeaderMenu(false); setConfirmBlock(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left">
                          <ShieldOff className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-red-500">Block {activeConvo?.name}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 bg-secondary/5">
                {msgsLoading ? (
                  <div className="text-center text-muted-foreground mt-10">Loading messages...</div>
                ) : localMsgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Heart className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-display font-bold text-lg mb-2">It's a match!</p>
                    <p className="text-muted-foreground text-sm max-w-xs">You and {activeConvo?.name} liked each other. Send the first message to start building something real.</p>
                  </div>
                ) : (
                  localMsgs.map((msg, idx) => {
                    const isMe = msg.fromId === user?.id;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-border shadow-sm rounded-bl-sm text-foreground'}`}>
                          <p className="leading-relaxed">{msg.text}</p>
                          <span className={`text-[10px] mt-2 block ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                            {msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : 'Now'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Guided Prompts */}
              {msgsData?.guidedPrompts && msgsData.guidedPrompts.length > 0 && localMsgs.length < 5 && (
                <div className="relative bg-white border-t border-border">
                  <div
                    className="prompts-container flex flex-nowrap gap-2 px-6 py-3 overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth"
                    style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
                  >
                    {msgsData.guidedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setText(prompt)}
                        style={{ flexShrink: 0 }}
                        className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-full border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  {/* Right-edge fade — hints that more prompts are off-screen */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
                </div>
              )}

              {/* Input — limit-reached panel for free users, full input otherwise */}
              {(isFree && (limitReached || msgsData?.canSend === false)) ? (
                <div className="p-5 bg-white border-t border-border">
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-display font-bold text-base mb-1">
                      You've used today's free messages
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      You can send {messagesLimit ?? 3} messages a day on the free plan. Your limit resets at midnight UTC.
                    </p>
                    {paymentsLive ? (
                      <Link
                        href="/premium"
                        className="inline-block px-6 py-2.5 rounded-full bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
                      >
                        Upgrade for unlimited messaging
                      </Link>
                    ) : interestSubmitted ? (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
                        <Heart className="w-4 h-4 fill-green-600 text-green-600" />
                        You're on the list — we'll email you
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={handleNotifyMe}
                          disabled={upgradeInterestMutation.isPending}
                          className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {upgradeInterestMutation.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : "Notify me when paid plans launch"}
                        </button>
                        <Link href="/premium" className="text-xs text-muted-foreground hover:text-foreground underline">
                          See all plans
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white border-t border-border">
                  {isFree && messagesRemaining !== null && messagesLimit !== null && (
                    <div className="flex items-center justify-between mb-2 px-2 text-xs">
                      <span className="text-muted-foreground">
                        {messagesRemaining} of {messagesLimit} free messages left today
                      </span>
                      {messagesRemaining <= 1 && !paymentsLive && (
                        <Link href="/premium" className="text-primary font-semibold hover:underline">
                          Get notified when paid plans launch →
                        </Link>
                      )}
                      {messagesRemaining <= 1 && paymentsLive && (
                        <Link href="/premium" className="text-primary font-semibold hover:underline">
                          Upgrade →
                        </Link>
                      )}
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex gap-4">
                    <input
                      type="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Write a thoughtful message..."
                      className="flex-1 bg-secondary/50 border border-border rounded-full px-6 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || sendMutation.isPending}
                      className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-md shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none transition-all"
                    >
                      <Send className="w-5 h-5 ml-0.5" />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Liked You card ─────────────────────────────────────────────────────────
function LikedYouCard({
  item,
  isLikingBack,
  isPassing,
  onLikeBack,
  onPass,
}: {
  item: any;
  isLikingBack: boolean;
  isPassing: boolean;
  onLikeBack: () => void;
  onPass: () => void;
}) {
  const { user } = item;
  const age = user.age ?? (user.birthYear ? new Date().getFullYear() - user.birthYear : null);
  const location = [user.city, user.country].filter(Boolean).join(", ");

  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <Link href={item.blurred ? "#" : `/members/${user.id}`} className="shrink-0">
        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 border-border ${item.blurred ? "blur-md pointer-events-none" : ""}`}>
          <UserAvatar name={user.name} photoUrl={item.blurred ? null : user.photoUrl} className="w-full h-full" textClassName="text-xl font-bold" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`font-semibold truncate ${item.blurred ? "blur-sm select-none" : ""}`}>
            {item.blurred ? "Hidden" : user.name}
          </span>
          {age && <span className="text-sm text-muted-foreground shrink-0">{age}</span>}
        </div>
        {location && (
          <p className={`text-xs text-muted-foreground truncate ${item.blurred ? "blur-sm select-none" : ""}`}>
            {item.blurred ? "Upgrade to see" : location}
          </p>
        )}
      </div>
      {!item.blurred ? (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onPass}
            disabled={isPassing || isLikingBack}
            className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-muted-foreground hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Pass"
          >
            {isPassing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button>
          <button
            onClick={onLikeBack}
            disabled={isLikingBack || isPassing}
            className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
            title="Like back"
          >
            {isLikingBack ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <Link href="/premium" className="shrink-0 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 hover:bg-primary hover:text-white transition-colors">
          Unlock
        </Link>
      )}
    </div>
  );
}

// ── Pending card ───────────────────────────────────────────────────────────
function PendingCard({
  item,
  isWithdrawing,
  onWithdraw,
}: {
  item: any;
  isWithdrawing: boolean;
  onWithdraw: () => void;
}) {
  const { user } = item;
  const age = user.age ?? (user.birthYear ? new Date().getFullYear() - user.birthYear : null);
  const location = [user.city, user.country].filter(Boolean).join(", ");

  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
      <Link href={`/members/${user.id}`} className="shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-border">
          <UserAvatar name={user.name} photoUrl={user.photoUrl} className="w-full h-full" textClassName="text-xl font-bold" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href={`/members/${user.id}`} className="font-semibold truncate hover:text-primary transition-colors">
            {user.name}
          </Link>
          {age && <span className="text-sm text-muted-foreground shrink-0">{age}</span>}
        </div>
        {location && <p className="text-xs text-muted-foreground truncate">{location}</p>}
        <div className="mt-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] font-semibold uppercase tracking-wide rounded-full">
            <Clock className="w-2.5 h-2.5" />
            Pending
          </span>
        </div>
      </div>
      <button
        onClick={onWithdraw}
        disabled={isWithdrawing}
        className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        title="Withdraw like"
      >
        {isWithdrawing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
