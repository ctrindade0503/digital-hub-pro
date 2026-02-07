import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: string;
  purchase_link: string | null;
  sort_order: number;
}

interface Props {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onModules: (id: string) => void;
}

const SortableProductItem = ({ product, onEdit, onDelete, onModules }: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="w-5 h-5" />
      </button>
      {product.image_url && <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.type === "modules" ? "Com módulos" : "Simples"}</p>
      </div>
      {product.type === "modules" && (
        <Button variant="ghost" size="icon" onClick={() => onModules(product.id)}>
          <Layers className="w-4 h-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
};

export default SortableProductItem;
