import { useNavigate } from "react-router-dom";
import { Package, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUserProducts } from "@/hooks/useUserProducts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MyProductsTab = () => {
  const { data: products, isLoading } = useUserProducts();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mb-3 opacity-50" />
        <p className="font-medium">Nenhum produto adquirido</p>
        <p className="text-sm mt-1">Seus produtos aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((item) => (
        <div
          key={item.id}
          onClick={() => navigate(`/product/${item.product_id}`)}
          className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        >
          {item.product.image_url ? (
            <img src={item.product.image_url} alt={item.product.name} className="w-14 h-14 rounded-lg object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-card-foreground truncate">{item.product.name}</p>
            <p className="text-xs text-muted-foreground">
              Adquirido em {format(new Date(item.granted_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs">Ativo</Badge>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyProductsTab;
