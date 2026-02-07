import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Layers, Upload, FileText, Video, AppWindow } from "lucide-react";
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

const contentTypeLabels: Record<string, { label: string; icon: typeof FileText; accept: string }> = {
  pdf: { label: "PDF", icon: FileText, accept: ".pdf" },
  video: { label: "Vídeo", icon: Video, accept: "video/*" },
  app: { label: "Aplicativo", icon: AppWindow, accept: ".apk,.ipa,.exe,.dmg,.zip" },
};

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [modulesProductId, setModulesProductId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", type: "simple", purchase_link: "", image_url: "", content_type: "pdf" });
  const [uploading, setUploading] = useState(false);
  const [uploadingContent, setUploadingContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `products/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(filePath, file);
      if (error) {
        console.error("Upload error:", error);
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast({ title: "Imagem enviada!" });
    } catch (err) {
      console.error("Upload exception:", err);
      toast({ title: "Erro inesperado no upload", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleContentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingContent(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `products/content/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(filePath, file);
      if (error) {
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, purchase_link: urlData.publicUrl }));
      toast({ title: "Arquivo enviado!" });
    } catch {
      toast({ title: "Erro inesperado no upload", variant: "destructive" });
    } finally {
      setUploadingContent(false);
      if (contentFileInputRef.current) contentFileInputRef.current.value = "";
    }
  };

  const defaultForm = { name: "", description: "", type: "simple", purchase_link: "", image_url: "", content_type: "pdf" };

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
    setForm(defaultForm);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Produto excluído" });
    fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || "", type: p.type, purchase_link: p.purchase_link || "", image_url: p.image_url || "", content_type: "pdf" });
    setDialogOpen(true);
  };

  if (modulesProductId) {
    return <AdminModules productId={modulesProductId} onBack={() => setModulesProductId(null)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Produtos</h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditProduct(null); setForm(defaultForm); } }}>
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
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Imagem do produto</label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="gap-1">
                    <Upload className="w-4 h-4" />{uploading ? "Enviando..." : "Upload imagem"}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <span className="text-xs text-muted-foreground self-center">ou cole a URL</span>
                </div>
                <Input placeholder="URL da imagem" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                {form.image_url && <img src={form.image_url} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />}
              </div>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, purchase_link: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simples</SelectItem>
                  <SelectItem value="modules">Com Módulos</SelectItem>
                </SelectContent>
              </Select>
              {form.type === "simple" && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <label className="text-xs font-medium text-muted-foreground">Conteúdo do produto</label>
                  <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(contentTypeLabels).map(([key, { label, icon: Icon }]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2"><Icon className="w-3 h-3" />{label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={uploadingContent} onClick={() => contentFileInputRef.current?.click()} className="gap-1">
                      <Upload className="w-4 h-4" />{uploadingContent ? "Enviando..." : "Upload arquivo"}
                    </Button>
                    <input ref={contentFileInputRef} type="file" accept={contentTypeLabels[form.content_type]?.accept || "*"} className="hidden" onChange={handleContentUpload} />
                    <span className="text-xs text-muted-foreground self-center">ou cole a URL</span>
                  </div>
                  <Input placeholder="URL do conteúdo" value={form.purchase_link} onChange={(e) => setForm({ ...form, purchase_link: e.target.value })} />
                </div>
              )}
              {form.type === "modules" && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  Após salvar, clique no ícone <Layers className="w-3 h-3 inline" /> para gerenciar módulos e conteúdos.
                </p>
              )}
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
