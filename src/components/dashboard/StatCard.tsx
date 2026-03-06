import { cn } from "@/lib/utils";

const StatCard = ({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  accent?: boolean;
}) => (
  <div className={cn("rounded-xl p-3 text-center space-y-1", accent ? "bg-primary/10 border border-primary/20" : "bg-card border border-border/50")}>
    <Icon className={cn("w-4 h-4 mx-auto", accent ? "text-primary" : "text-muted-foreground")} />
    <p className={cn("text-lg font-bold font-heading", accent ? "text-primary" : "text-foreground")}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default StatCard;
