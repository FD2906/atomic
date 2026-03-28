import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChallengeChatProps {
  challengeId: string;
  userId: string;
  isActive: boolean;
}

const ChallengeChat = ({ challengeId, userId, isActive }: ChallengeChatProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!challengeId || !userId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages" as any)
        .select("id, sender_id, content, created_at, is_read")
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: true });
      const msgs = (data as any as Message[]) || [];
      setMessages(msgs);
      setUnread(msgs.filter((m) => m.sender_id !== userId && !m.is_read).length);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${challengeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `challenge_id=eq.${challengeId}` },
        (payload) => {
          const newMsg = payload.new as any as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_id !== userId) {
            if (!open) setUnread((u) => u + 1);
            else markRead(newMsg.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [challengeId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open && unread > 0) {
      // Mark all unread as read
      const unreadIds = messages.filter((m) => m.sender_id !== userId && !m.is_read).map((m) => m.id);
      if (unreadIds.length > 0) {
        supabase
          .from("messages" as any)
          .update({ is_read: true } as any)
          .in("id", unreadIds)
          .then(() => {
            setUnread(0);
            setMessages((prev) => prev.map((m) => unreadIds.includes(m.id) ? { ...m, is_read: true } : m));
          });
      }
    }
  }, [open]);

  const markRead = async (id: string) => {
    await supabase.from("messages" as any).update({ is_read: true } as any).eq("id", id);
  };

  const handleSend = async () => {
    if (!draft.trim() || sending || draft.length > 200) return;
    setSending(true);
    await supabase.from("messages" as any).insert({
      challenge_id: challengeId,
      sender_id: userId,
      content: draft.trim(),
    } as any);
    setDraft("");
    setSending(false);
  };

  if (!isActive) return null;

  return (
    <>
      {/* Floating chat button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border flex flex-col" style={{ height: "50vh", maxHeight: "400px" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold font-heading">Chat</span>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Say hi! 👋</p>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_id === userId;
              return (
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                  )}>
                    <p className="break-words">{msg.content}</p>
                    <p className={cn("text-[9px] mt-0.5", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 200))}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="absolute right-2 bottom-1 text-[9px] text-muted-foreground">{draft.length}/200</span>
            </div>
            <Button size="sm" disabled={!draft.trim() || sending} onClick={handleSend} className="rounded-xl h-10 w-10 p-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChallengeChat;
