import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface FeedPost { id: string; content: string; image_url: string | null; created_at: string; }

const AdminFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ content: "", image_url: "" });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    const { data } = await supabase.from("feed_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSave = async () => {
    await supabase.from("feed_posts").insert({ content: form.content, image_url: form.image_url || null, user_id: user?.id } as any);
    setDialogOpen(false); setForm({ content: "", image_url: "" });
    toast({ title: "Post criado" }); fetchPosts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("feed_posts").delete().eq("id", id);
    toast({ title: "Post excluído" }); fetchPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Feed</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" />Novo Post</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Post</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <textarea placeholder="Conteúdo do post..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Input placeholder="URL da imagem (opcional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              <Button onClick={handleSave} className="w-full">Publicar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-card-foreground">{p.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFeed;
