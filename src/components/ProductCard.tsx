import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ProductCardData {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: string;
  purchase_link: string | null;
  purchased: boolean;
}

const ProductCard = ({ product }: { product: ProductCardData }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (product.purchased) {
      navigate(`/product/${product.id}`);
    } else if (product.purchase_link) {
      window.open(product.purchase_link, "_blank");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm border border-border hover:shadow-md transition-shadow text-left w-full"
    >
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {!product.purchased && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-card-foreground truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {product.description}
          </p>
        )}
      </div>
    </button>
  );
};

export default ProductCard;
