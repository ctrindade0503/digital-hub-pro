import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, ChevronLeft, FileText, Video, Link as LinkIcon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Module { id: string; title: string; sort_order: number; }
interface ModuleContent { id: string; module_id: string; type: string; title: string; url: string | null; content: string | null; sort_order: number; }

const contentTypeIcons: Record<string, typeof FileText> = { pdf: FileText, video: Video, link: LinkIcon, text: Type };

const AdminModules = ({ productId, onBack }: { productId: string; onBack: () => void }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [contents, setContents] = useState<ModuleContent[]>([]);
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [modForm, setModForm] = useState({ title: "", sort_order: 0 });
  const [contentForm, setContentForm] = useState({ title: "", type: "text", url: "", content: "" });
  const [editMod, setEditMod] = useState<Module | null>(null);
  const { toast } = useToast();

  const fetch = async () => {
    const { data: mods } = await supabase.from("modules").select("*").eq("product_id", productId).order("sort_order");
    setModules(mods || []);
    const { data: conts } = await supabase.from("module_contents").select("*").in("module_id", (mods || []).map(m => m.id)).order("sort_order");
    setContents(conts || []);
  };

  useEffect(() => { fetch(); }, [productId]);

  const saveModule = async () => {
    const payload = { title: modForm.title, sort_order: modForm.sort_order, product_id: productId };
    if (editMod) {
      await supabase.from("modules").update({ title: modForm.title, sort_order: modForm.sort_order }).eq("id", editMod.id);
    } else {
      await supabase.from("modules").insert(payload);
    }
    setModDialogOpen(false); setEditMod(null); setModForm({ title: "", sort_order: 0 });
    toast({ title: "Módulo salvo" }); fetch();
  };

  const deleteModule = async (id: string) => {
    await supabase.from("modules").delete().eq("id", id);
    toast({ title: "Módulo excluído" }); fetch();
  };

  const saveContent = async () => {
    if (!selectedModule) return;
    await supabase.from("module_contents").insert({
      module_id: selectedModule, title: contentForm.title, type: contentForm.type,
      url: contentForm.url || null, content: contentForm.content || null,
    });
    setContentDialogOpen(false); setContentForm({ title: "", type: "text", url: "", content: "" });
    toast({ title: "Conteúdo adicionado" }); fetch();
  };

  const deleteContent = async (id: string) => {
    await supabase.from("module_contents").delete().eq("id", id);
    toast({ title: "Conteúdo excluído" }); fetch();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-bold text-foreground">Módulos</h2>
      </div>

      <Dialog open={modDialogOpen} onOpenChange={(o) => { setModDialogOpen(o); if (!o) setEditMod(null); }}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1 mb-4"><Plus className="w-4 h-4" />Novo Módulo</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMod ? "Editar" : "Novo"} Módulo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" value={modForm.title} onChange={(e) => setModForm({ ...modForm, title: e.target.value })} />
            <Input type="number" placeholder="Ordem" value={modForm.sort_order} onChange={(e) => setModForm({ ...modForm, sort_order: Number(e.target.value) })} />
            <Button onClick={saveModule} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {modules.map((mod) => (
        <div key={mod.id} className="mb-4">
          <div className="flex items-center gap-2 bg-card rounded-xl border border-border p-3">
            <span className="text-sm font-semibold text-card-foreground flex-1">{mod.title}</span>
            <Button variant="ghost" size="icon" onClick={() => { setEditMod(mod); setModForm({ title: mod.title, sort_order: mod.sort_order }); setModDialogOpen(true); }}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => deleteModule(mod.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedModule(mod.id); setContentDialogOpen(true); }}>
              <Plus className="w-3 h-3 mr-1" />Conteúdo
            </Button>
          </div>
          <div className="ml-4 mt-1 space-y-1">
            {contents.filter(c => c.module_id === mod.id).map((c) => {
              const Icon = contentTypeIcons[c.type] || Type;
              return (
                <div key={c.id} className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-foreground flex-1">{c.title}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteContent(c.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Dialog open={contentDialogOpen} onOpenChange={setContentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Conteúdo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título" value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} />
            <Select value={contentForm.type} onValueChange={(v) => setContentForm({ ...contentForm, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
            {(contentForm.type === "pdf" || contentForm.type === "video" || contentForm.type === "link") && (
              <Input placeholder="URL" value={contentForm.url} onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })} />
            )}
            {contentForm.type === "text" && (
              <textarea placeholder="Conteúdo" value={contentForm.content} onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })} className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            )}
            <Button onClick={saveContent} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModules;
