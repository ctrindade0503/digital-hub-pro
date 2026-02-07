import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminModules from "./AdminModules";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  type: string;
  purchase_link: string | null;
  sort_order: number;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modulesProductId, setModulesProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", type: "simple", purchase_link: "", image_url: "" });
  const { toast } = useToast();

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").order("sort_order");
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSave = async () => {
    const payload = {
      name: form.name,
      description: form.description || null,
      type: form.type,
      purchase_link: form.purchase_link || null,
      image_url: form.image_url || null,
    };

    if (editProduct) {
      await supabase.from("products").update(payload).eq("id", editProduct.id);
      toast({ title: "Produto atualizado" });
    } else {
      await supabase.from("products").insert(payload);
      toast({ title: "Produto criado" });
    }
    setDialogOpen(false);
    setEditProduct(null);
    setForm({ name: "", description: "", type: "simple", purchase_link: "", image_url: "" });
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Produto excluído" });
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || "", type: p.type, purchase_link: p.purchase_link || "", image_url: p.image_url || "" });
    setDialogOpen(true);
  };

  if (modulesProductId) {
    return <AdminModules productId={modulesProductId} onBack={() => setModulesProductId(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Produtos</h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditProduct(null); setForm({ name: "", description: "", type: "simple", purchase_link: "", image_url: "" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" />Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="URL da imagem" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simples</SelectItem>
                  <SelectItem value="modules">Com Módulos</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Link de compra" value={form.purchase_link} onChange={(e) => setForm({ ...form, purchase_link: e.target.value })} />
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum produto cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.type === "modules" ? "Com módulos" : "Simples"}</p>
              </div>
              {p.type === "modules" && (
                <Button variant="ghost" size="icon" onClick={() => setModulesProductId(p.id)}>
                  <Layers className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
