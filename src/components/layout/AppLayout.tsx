import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import RealtimeNotifications from "./RealtimeNotifications";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      <RealtimeNotifications />
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
