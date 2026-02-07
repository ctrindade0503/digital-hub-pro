import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Package, Image, Layers, Rss, Users, Settings, ChevronLeft, Shield, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/admin/products", icon: Package, label: "Produtos" },
  { path: "/admin/banners", icon: Image, label: "Banners" },
  { path: "/admin/feed", icon: Rss, label: "Feed" },
  { path: "/admin/users", icon: Users, label: "Usuários" },
  { path: "/admin/colors", icon: Paintbrush, label: "Cores" },
  { path: "/admin/settings", icon: Settings, label: "Config." },
];

const AdminLayout = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold text-foreground">Painel Admin</h1>
      </header>

      {/* Nav tabs */}
      <nav className="bg-card border-b border-border overflow-x-auto">
        <div className="flex px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 pb-20 max-w-4xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
