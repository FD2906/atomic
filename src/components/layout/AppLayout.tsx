import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
