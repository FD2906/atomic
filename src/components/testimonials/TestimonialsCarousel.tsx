import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Testimonial {
  id: string;
  first_name: string;
  habit_type: string;
  quote: string;
}

const CATEGORIES = ["All", "Exercise", "Reading", "Sleep", "Hydration"];

interface TestimonialsCarouselProps {
  className?: string;
}

const TestimonialsCarousel = ({ className }: TestimonialsCarouselProps) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("testimonials" as any).select("id, first_name, habit_type, quote");
      if (filter !== "All") {
        query = query.eq("habit_type", filter);
      }
      const { data } = await query;
      setTestimonials((data as any as Testimonial[]) || []);
      setCurrent(0);
      setLoading(false);
    };
    fetch();
  }, [filter]);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const goTo = (dir: number) => {
    if (testimonials.length === 0) return;
    setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  const t = testimonials[current];

  return (
    <div className={className}>
      {/* Category filter chips */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all",
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-xl glass-card p-5 min-h-[140px]">
        {loading ? (
          <div className="flex items-center justify-center h-[100px]">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No testimonials found.</p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <Quote className="w-5 h-5 text-primary/40" />
              <p className="text-sm text-foreground leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {t.first_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold">{t.first_name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.habit_type}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {testimonials.length > 1 && (
          <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 flex justify-between pointer-events-none">
            <button onClick={() => goTo(-1)} className="pointer-events-auto p-1 rounded-full bg-secondary/80 hover:bg-secondary">
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => goTo(1)} className="pointer-events-auto p-1 rounded-full bg-secondary/80 hover:bg-secondary">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Dots */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-1.5 bg-secondary"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestimonialsCarousel;
