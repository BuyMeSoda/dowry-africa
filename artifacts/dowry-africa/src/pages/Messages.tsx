import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useGetConversations, useGetMessages, useSendMessage } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Send, MessageCircle, ChevronLeft, Heart } from "lucide-react";
import { format } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const [match, params] = useRoute("/messages/:id");
  const activeUserId = match ? params?.id : null;
  
  const { data: convosData, isLoading: convosLoading } = useGetConversations();
  const { data: msgsData, isLoading: msgsLoading, refetch } = useGetMessages(activeUserId || "", { query: { enabled: !!activeUserId }});
  const sendMutation = useSendMessage();

  const [text, setText] = useState("");
  const [localMsgs, setLocalMsgs] = useState<any[]>([]);

  useEffect(() => {
    if (msgsData?.messages) {
      setLocalMsgs(msgsData.messages);
    }
  }, [msgsData]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeUserId) return;
    
    const newText = text;
    setText("");
    
    // Optimistic
    const tempId = Date.now().toString();
    setLocalMsgs([...localMsgs, { id: tempId, text: newText, fromId: user?.id, createdAt: new Date().toISOString() }]);

    sendMutation.mutate({ userId: activeUserId, data: { text: newText } }, {
      onSuccess: () => refetch(),
      onError: () => setLocalMsgs(localMsgs) // revert
    });
  };

  const conversations = convosData?.conversations || [];
  const activeConvo = conversations.find(c => c.userId === activeUserId);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1 container mx-auto max-w-6xl w-full flex bg-white my-4 sm:my-8 rounded-3xl shadow-xl border border-border/50 overflow-hidden h-[calc(100vh-12rem)]">
        
        {/* Left List */}
        <div className={`${activeUserId ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 lg:w-96 flex-col border-r border-border`}>
          <div className="p-6 border-b border-border bg-secondary/10">
            <h2 className="text-2xl font-display font-bold">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convosLoading ? (
              <div className="p-6 text-center text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <MessageCircle className="w-12 h-12 text-muted/50 mb-4" />
                <p className="text-muted-foreground font-medium">No matches yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Keep swiping to find your person.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {conversations.map((c) => (
                  <Link key={c.userId} href={`/messages/${c.userId}`}>
                    <div className={`p-4 flex gap-4 cursor-pointer hover:bg-secondary/30 transition-colors ${activeUserId === c.userId ? 'bg-secondary/50 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}>
                      <img src={c.photoUrl || "https://images.unsplash.com/photo-1531123897727-8f129e1bfd8c?w=100&q=80"} className="w-14 h-14 rounded-full object-cover" alt={c.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-foreground truncate">{c.name}</h4>
                          {c.lastMessageAt && <span className="text-xs text-muted-foreground">{format(new Date(c.lastMessageAt), 'MMM d')}</span>}
                        </div>
                        <p className={`text-sm truncate ${c.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {c.lastMessage || 'Say hello!'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className={`${!activeUserId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-background/50`}>
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
                <img src={activeConvo?.photoUrl || "https://images.unsplash.com/photo-1531123897727-8f129e1bfd8c?w=100&q=80"} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h3 className="font-display font-bold text-lg">{activeConvo?.name || 'Match'}</h3>
                  <p className="text-xs text-muted-foreground">Matched recently</p>
                </div>
              </div>
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/5">
                {msgsLoading ? (
                   <div className="text-center text-muted-foreground mt-10">Loading messages...</div>
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
                    )
                  })
                )}
              </div>

              {/* Guided Prompts (if any) */}
              {msgsData?.guidedPrompts && msgsData.guidedPrompts.length > 0 && localMsgs.length < 5 && (
                <div className="px-6 py-3 bg-white border-t border-border flex gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
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
