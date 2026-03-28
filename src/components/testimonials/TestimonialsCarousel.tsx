import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Sarah",
    habit: "Exercise",
    quote: "ATOMIC helped me build a consistent gym routine. The financial accountability made all the difference!",
  },
  {
    name: "James",
    habit: "Reading",
    quote: "I've read more books in 3 months than the past year. Knowing my money goes to charity keeps me on track.",
  },
  {
    name: "Priya",
    habit: "Hydration",
    quote: "Simple concept, powerful results. I drink 2L of water daily now and haven't missed a single day.",
  },
  {
    name: "Tom",
    habit: "Sleep",
    quote: "The 1v1 challenges with my flatmate made it fun. We both fixed our sleep schedules in two weeks.",
  },
  {
    name: "Aisha",
    habit: "Exercise",
    quote: "Lost a few stakes early on, but it taught me discipline. Now I have a 45-day streak going!",
  },
];

interface TestimonialsCarouselProps {
  className?: string;
}

const TestimonialsCarousel = ({ className }: TestimonialsCarouselProps) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (dir: number) => {
    setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-xl glass-card p-5 min-h-[140px]">
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
              "{testimonials[current].quote}"
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {testimonials[current].name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold">{testimonials[current].name}</p>
                <p className="text-[10px] text-muted-foreground">{testimonials[current].habit}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-1/2 -translate-y-1/2 left-1 right-1 flex justify-between pointer-events-none">
          <button onClick={() => goTo(-1)} className="pointer-events-auto p-1 rounded-full bg-secondary/80 hover:bg-secondary">
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => goTo(1)} className="pointer-events-auto p-1 rounded-full bg-secondary/80 hover:bg-secondary">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "w-1.5 bg-secondary"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialsCarousel;
