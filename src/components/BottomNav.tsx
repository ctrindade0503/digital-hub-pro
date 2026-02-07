import { Home, MessageSquare, Users, User, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const baseTabs = [
  { path: "/home", icon: Home, label: "Início" },
  { path: "/feed", icon: MessageSquare, label: "Feed" },
  { path: "/community", icon: Users, label: "Comunidade" },
  { path: "/profile", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const tabs = isAdmin
    ? [...baseTabs, { path: "/admin", icon: Shield, label: "Admin" }]
    : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = tab.path === "/admin"
            ? location.pathname.startsWith("/admin")
            : location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
