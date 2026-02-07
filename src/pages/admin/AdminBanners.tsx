import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Banner { id: string; image_url: string; title: string | null; link: string | null; sort_order: number; active: boolean; }

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({ image_url: "", title: "", link: "", sort_order: 0 });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchBanners = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners(data || []);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(filePath, file);
      if (error) {
        toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast({ title: "Imagem enviada!" });
    } catch {
      toast({ title: "Erro inesperado no upload", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const payload = { image_url: form.image_url, title: form.title || null, link: form.link || null, sort_order: form.sort_order };
    if (editBanner) {
      await supabase.from("banners").update(payload).eq("id", editBanner.id);
    } else {
      await supabase.from("banners").insert(payload);
    }
    setDialogOpen(false); setEditBanner(null); setForm({ image_url: "", title: "", link: "", sort_order: 0 });
    toast({ title: "Banner salvo" }); fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("banners").update({ active: !b.active }).eq("id", b.id);
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    toast({ title: "Banner excluído" }); fetchBanners();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Banners</h2>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditBanner(null); setForm({ image_url: "", title: "", link: "", sort_order: 0 }); } }}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editBanner ? "Editar" : "Novo"} Banner</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="gap-1">
                    <Upload className="w-4 h-4" />{uploading ? "Enviando..." : "Upload"}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  <span className="text-xs text-muted-foreground self-center">ou cole a URL abaixo</span>
                </div>
                <Input placeholder="URL da imagem" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                {form.image_url && <img src={form.image_url} alt="Preview" className="w-full h-24 object-cover rounded-lg" />}
              </div>
              <Input placeholder="Título (opcional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Input placeholder="Link de destino" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              <Input type="number" placeholder="Ordem" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
            <img src={b.image_url} alt={b.title || "Banner"} className="w-16 h-10 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{b.title || "Sem título"}</p>
            </div>
            <Switch checked={b.active} onCheckedChange={() => toggleActive(b)} />
            <Button variant="ghost" size="icon" onClick={() => { setEditBanner(b); setForm({ image_url: b.image_url, title: b.title || "", link: b.link || "", sort_order: b.sort_order }); setDialogOpen(true); }}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBanners;
