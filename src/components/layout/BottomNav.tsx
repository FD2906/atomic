import { Home, BarChart3, User, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: BarChart3, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around px-4 py-2 max-w-md mx-auto relative">
        {/* Home */}
        <NavItem
          icon={tabs[0].icon}
          label={tabs[0].label}
          active={location.pathname === tabs[0].path}
          onClick={() => navigate(tabs[0].path)}
        />

        {/* Create Button - Floating */}
        <button
          onClick={() => navigate("/create")}
          className="relative -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary glow-primary animate-pulse-glow transition-transform active:scale-95"
        >
          <Plus className="w-7 h-7 text-primary-foreground" />
        </button>

        {/* History */}
        <NavItem
          icon={tabs[1].icon}
          label={tabs[1].label}
          active={location.pathname === tabs[1].path}
          onClick={() => navigate(tabs[1].path)}
        />

        {/* Profile */}
        <NavItem
          icon={tabs[2].icon}
          label={tabs[2].label}
          active={location.pathname === tabs[2].path}
          onClick={() => navigate(tabs[2].path)}
        />
      </div>
    </div>
  );
};

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 py-2 px-3 transition-colors",
      active ? "text-primary" : "text-muted-foreground"
    )}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default BottomNav;
