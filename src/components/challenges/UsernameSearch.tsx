import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserResult {
  id: string;
  username: string;
  first_name: string | null;
  avatar_url: string | null;
}

interface UsernameSearchProps {
  currentUserId: string;
  onSelect: (user: UserResult) => void;
  selectedUser: UserResult | null;
}

const UsernameSearch = ({ currentUserId, onSelect, selectedUser }: UsernameSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles_public" as any)
        .select("id, username, first_name, avatar_url")
        .neq("id", currentUserId)
        .ilike("username", `%${query.trim()}%`)
        .limit(10);

      setResults((data as UserResult[]) || []);
      setOpen(true);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, currentUserId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selectedUser) {
    return (
      <button
        onClick={() => onSelect(null as any)}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border-2 border-primary text-left"
      >
        <Avatar className="h-9 w-9">
          {selectedUser.avatar_url ? (
            <AvatarImage src={selectedUser.avatar_url} />
          ) : null}
          <AvatarFallback className="bg-secondary text-xs">
            {selectedUser.username?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-heading">@{selectedUser.username}</p>
          {selectedUser.first_name && (
            <p className="text-xs text-muted-foreground">{selectedUser.first_name}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Change</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          placeholder="Search by username..."
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pl-9"
        />
      </div>

      {open && (query.trim().length > 0) && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onSelect(user);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 hover:bg-secondary/80 transition-colors text-left"
                )}
              >
                <Avatar className="h-9 w-9">
                  {user.avatar_url ? <AvatarImage src={user.avatar_url} /> : null}
                  <AvatarFallback className="bg-secondary text-xs">
                    {user.username?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-heading">@{user.username}</p>
                  {user.first_name && (
                    <p className="text-xs text-muted-foreground">{user.first_name}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UsernameSearch;
