import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

const StatCard = ({
  icon: Icon,
  value,
  label,
  accent,
  danger,
  onClick,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  accent?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) => {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "rounded-xl p-3 text-center space-y-1 w-full transition-colors",
        accent && "bg-primary/10 border border-primary/20",
        danger && "bg-destructive/10 border border-destructive/30",
        !accent && !danger && "bg-card border border-border/50",
        onClick && "cursor-pointer hover:opacity-80"
      )}
    >
      <div className="flex items-center justify-center gap-1">
        <Icon className={cn("w-4 h-4", danger ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground")} />
        {danger && <AlertTriangle className="w-3 h-3 text-destructive" />}
      </div>
      <p className={cn("text-lg font-bold font-heading", danger ? "text-destructive" : accent ? "text-primary" : "text-foreground")}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </Component>
  );
};

export default StatCard;
