import { Home, Swords, Plus, BarChart3, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Swords, label: "1v1", path: "/challenges" },
    { icon: Plus, label: "", path: "/create", isCenter: true },
    { icon: BarChart3, label: "History", path: "/history" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {tabs.map((tab) =>
          tab.isCenter ? (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative -top-5 flex items-center justify-center w-14 h-14 rounded-full bg-primary glow-primary transition-transform active:scale-95"
            >
              <Plus className="w-7 h-7 text-primary-foreground" />
            </button>
          ) : (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 transition-colors",
                location.pathname === tab.path
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default BottomNav;
