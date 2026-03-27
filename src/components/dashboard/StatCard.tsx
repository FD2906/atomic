import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const StatCard = ({
  icon: Icon,
  value,
  label,
  accent,
  warning,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  accent?: boolean;
  warning?: string | null;
}) => (
  <div className={cn("rounded-xl p-3 text-center space-y-1 relative", accent ? "bg-primary/10 border border-primary/20" : "bg-card border border-border/50", warning && "border-destructive/50")}>
    <Icon className={cn("w-4 h-4 mx-auto", accent ? "text-primary" : "text-muted-foreground")} />
    <p className={cn("text-lg font-bold font-heading", accent ? "text-primary" : "text-foreground")}>{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    {warning && (
      <div className="flex items-center justify-center gap-1 pt-0.5">
        <AlertTriangle className="w-3 h-3 text-destructive" />
        <p className="text-[9px] text-destructive font-medium leading-tight">{warning}</p>
      </div>
    )}
  </div>
);

export default StatCard;
