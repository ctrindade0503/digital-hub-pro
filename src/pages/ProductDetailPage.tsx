import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, FileText, Video, Link as LinkIcon, Type } from "lucide-react";
import { products, modules } from "@/lib/mockData";

const moduleColors = [
  "from-primary/20 to-primary/30",
  "from-accent to-accent/80",
  "from-secondary to-secondary/80",
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);
  const productModules = modules.filter((m) => m.productId === id);

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-foreground">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      </header>

      <div className="px-4 mt-4">
        <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
        )}
      </div>

      {/* Modules grid */}
      {productModules.length > 0 ? (
        <div className="px-4 mt-6 grid grid-cols-3 gap-3">
          {productModules.map((mod, index) => (
            <button
              key={mod.id}
              className={`aspect-square rounded-xl bg-gradient-to-br ${
                moduleColors[index % moduleColors.length]
              } flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md transition-shadow`}
            >
              <span className="text-[10px] font-medium bg-card/60 px-2 py-0.5 rounded-full text-foreground">
                {mod.title.toUpperCase()}
              </span>
              <span className="text-3xl font-bold text-foreground/80">
                {mod.order}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Conteúdo será exibido diretamente ao acessar.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
