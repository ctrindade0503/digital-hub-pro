import { useNavigate } from "react-router-dom";
import { LogOut, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Perfil</h1>
      </header>

      <div className="px-4 mt-6">
        {/* User info */}
        <div className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-primary">
              {(user?.email?.[0] || "U").toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">
              {user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário"}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Admin link */}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-3 w-full bg-primary/5 rounded-xl border border-primary/20 p-4 mt-4 hover:bg-primary/10 transition-colors"
          >
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary flex-1 text-left">Painel Administrativo</span>
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full mt-8 h-12 rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
