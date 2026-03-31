import { useState, useEffect, useRef } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
  useUnmatch,
  useBlockUser,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useToast } from "@/hooks/use-toast";
import {
  Send, MessageCircle, ChevronLeft, Heart, Sparkles,
  MoreVertical, X, ShieldOff, AlertCircle, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
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
            className="flex-1 py-2.5 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const { refresh: refreshNotifs } = useNotifications();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/messages/:id");
  const activeUserId = match ? params?.id : null;
  const queryClient = useQueryClient();

  const { data: convosData, isLoading: convosLoading, refetch: refetchConvos } = useGetConversations();
  const { data: msgsData, isLoading: msgsLoading, refetch } = useGetMessages(activeUserId || "", { query: { enabled: !!activeUserId } });
  const sendMutation  = useSendMessage();
  const unmatchMutation = useUnmatch();
  const blockMutation   = useBlockUser();

  const [text, setText] = useState("");
  const [localMsgs, setLocalMsgs] = useState<any[]>([]);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgsData?.messages) {
      setLocalMsgs(msgsData.messages);
      refreshNotifs();
      refetchConvos();
    }
  }, [msgsData]);

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

  // Close menu when changing conversations
  useEffect(() => { setShowHeaderMenu(false); }, [activeUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;

    const newText = text;
    setText("");

    const tempId = Date.now().toString();
    setLocalMsgs(prev => [...prev, { id: tempId, text: newText, fromId: user?.id, createdAt: new Date().toISOString() }]);

    sendMutation.mutate({ userId: activeUserId, data: { text: newText } }, {
      onSuccess: () => refetch(),
      onError: () => setLocalMsgs(localMsgs),
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

  const conversations = convosData?.conversations || [];
  const activeConvo = conversations.find(c => c.userId === activeUserId);

  const withMessages = conversations.filter(c => c.lastMessage);
  const freshMatches = conversations.filter(c => !c.lastMessage);

  return (
    <div className="bg-background flex flex-col overflow-hidden h-[calc(100dvh-3rem)] md:h-[100dvh]">
      <Navbar />

      {/* Confirmation dialogs */}
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
      </AnimatePresence>

      <main className="flex-1 w-full flex bg-white overflow-hidden
                       md:container md:mx-auto md:max-w-6xl md:my-8 md:rounded-3xl md:shadow-xl md:border md:border-border/50"
            style={{ height: "inherit", maxHeight: "calc(100dvh - 64px)" }}>

        {/* Left List */}
        <div className={`${activeUserId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-96 flex-col border-r border-border`}>
          <div className="p-6 border-b border-border bg-secondary/10">
            <h2 className="text-2xl font-display font-bold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
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
                {/* Fresh Matches (no messages yet) */}
                {freshMatches.length > 0 && (
                  <div className="border-b border-border/50">
                    <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">New Matches</span>
                    </div>
                    <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-none" style={{ scrollbarWidth: "none" }}>
                      {freshMatches.map((c) => (
                        <Link key={c.userId} href={`/members/${c.userId}?from=messages`}>
                          <div className="flex flex-col items-center gap-2 cursor-pointer group w-16 shrink-0">
                            <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${activeUserId === c.userId ? 'border-primary' : 'border-primary/40 group-hover:border-primary'}`}>
                              <UserAvatar name={c.name} photoUrl={c.photoUrl} className="w-full h-full" textClassName="text-xl font-bold" />
                            </div>
                            <span className="text-xs text-center text-foreground font-medium truncate w-full text-center leading-tight">{c.name.split(' ')[0]}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversations with messages */}
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
                          <Link
                            href={`/members/${c.userId}?from=messages`}
                            onClick={e => e.stopPropagation()}
                            className="relative shrink-0"
                          >
                            <UserAvatar name={c.name} photoUrl={c.photoUrl} size={56} className="rounded-full hover:opacity-90 transition-opacity" textClassName="text-xl font-bold" />
                            {c.unread > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {c.unread > 9 ? "9+" : c.unread}
                              </span>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <Link
                                href={`/members/${c.userId}?from=messages`}
                                onClick={e => e.stopPropagation()}
                                className={`truncate hover:text-primary transition-colors ${c.unread > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}
                              >
                                {c.name}
                              </Link>
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
          </div>
        </div>

        {/* Right Chat Area */}
        <div className={`${!activeUserId ? 'hidden md:flex' : 'flex'} flex-1 min-w-0 flex-col bg-background/50`}>
          {!activeUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
               <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                 <Heart className="w-10 h-10 text-primary" />
               </div>
               <h2 className="text-3xl font-display font-bold text-foreground mb-2">Intentional Connections</h2>
               <p className="text-muted-foreground max-w-md">Select a conversation to start messaging. Remember, Dowry.Africa encourages deep, meaningful dialogue.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b border-border bg-white flex items-center px-6 gap-4">
                <Link href="/messages" className="md:hidden w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-secondary">
                  <ChevronLeft className="w-6 h-6" />
                </Link>
                <Link href={`/members/${activeUserId}?from=messages`} className="shrink-0 hover:opacity-90 transition-opacity">
                  <UserAvatar name={activeConvo?.name ?? ""} photoUrl={activeConvo?.photoUrl} size={48} className="rounded-full" textClassName="text-lg font-bold" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/members/${activeUserId}?from=messages`} className="hover:text-primary transition-colors">
                    <h3 className="font-display font-bold text-lg truncate">{activeConvo?.name || 'Match'}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground">Tap name to view profile</p>
                </div>

                {/* Three-dots menu */}
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
                        <Link
                          href={`/members/${activeUserId}?from=messages`}
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors border-b border-border/50"
                          onClick={() => setShowHeaderMenu(false)}
                        >
                          <AlertCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">View profile</span>
                        </Link>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setConfirmUnmatch(true); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left border-b border-border/50"
                        >
                          <X className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Unmatch {activeConvo?.name}</span>
                        </button>
                        <button
                          onClick={() => { setShowHeaderMenu(false); setConfirmBlock(true); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-colors text-left"
                        >
                          <ShieldOff className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-red-500">Block {activeConvo?.name}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 bg-secondary/5">
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
              </div>

              {/* Guided Prompts (if any) */}
              {msgsData?.guidedPrompts && msgsData.guidedPrompts.length > 0 && localMsgs.length < 5 && (
                <div className="pl-6 pr-6 py-3 bg-white border-t border-border flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  {msgsData.guidedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setText(prompt)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-full border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-border">
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
