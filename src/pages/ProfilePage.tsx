import { useNavigate } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mockData";

const ProfilePage = () => {
  const navigate = useNavigate();
  const purchasedProducts = products.filter((p) => p.purchased);

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Perfil</h1>
      </header>

      <div className="px-4 mt-6">
        {/* User info */}
        <div className="flex items-center gap-4 bg-card rounded-xl border border-border p-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-primary">U</span>
          </div>
          <div>
            <h2 className="font-semibold text-card-foreground">Usuário</h2>
            <p className="text-sm text-muted-foreground">usuario@email.com</p>
          </div>
        </div>

        {/* Purchased products */}
        <h3 className="text-sm font-semibold text-foreground mt-6 mb-3">
          Meus Produtos ({purchasedProducts.length})
        </h3>
        <div className="space-y-2">
          {purchasedProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="flex items-center gap-3 w-full bg-card rounded-xl border border-border p-3 hover:shadow-sm transition-shadow"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <span className="text-sm font-medium text-card-foreground flex-1 text-left">
                {product.name}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full mt-8 h-12 rounded-xl gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => navigate("/")}
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
