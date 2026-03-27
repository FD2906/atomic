import { useState, useMemo } from "react";
import { Check, Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Charity {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface CharitySelectorProps {
  charities: Charity[];
  selectedCharity: string;
  onSelect: (id: string) => void;
}

const CharitySelector = ({ charities, selectedCharity, onSelect }: CharitySelectorProps) => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(charities.map((c) => c.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [charities]);

  const filtered = useMemo(() => {
    return charities.filter((c) => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [charities, search, categoryFilter]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search charities..."
          className="bg-secondary border-border text-foreground pl-9"
        />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all",
              !categoryFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all capitalize",
                categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Charity list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No charities found</p>
        ) : (
          filtered.map((charity) => (
            <button
              key={charity.id}
              onClick={() => onSelect(charity.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                selectedCharity === charity.id
                  ? "bg-primary/10 border-2 border-primary"
                  : "glass-card hover:bg-secondary/80"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold font-heading text-sm">{charity.name}</p>
                <p className="text-xs text-muted-foreground truncate">{charity.description}</p>
                {charity.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground capitalize">
                    {charity.category}
                  </span>
                )}
              </div>
              {selectedCharity === charity.id && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default CharitySelector;
