import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CommunityPost {
  id: string;
  content: string;
  image_url: string | null;
  user_id: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  name: string | null;
  email: string | null;
}

const AdminCommunity = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ content: "", image_url: "", user_id: "" });
  const { toast } = useToast();

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, name, email");
    const list = data || [];
    setUsers(list);
    const map: Record<string, UserProfile> = {};
    list.forEach((u) => { map[u.user_id] = u; });
    setProfiles(map);
  };

  useEffect(() => {
    fetchPosts();
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!form.user_id || !form.content.trim()) {
      toast({ title: "Selecione um usuário e escreva o conteúdo", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("community_posts").insert({
      content: form.content,
      image_url: form.image_url || null,
      user_id: form.user_id,
    });
    if (error) {
      toast({ title: "Erro ao criar post", description: error.message, variant: "destructive" });
      return;
    }
    setDialogOpen(false);
    setForm({ content: "", image_url: "", user_id: "" });
    toast({ title: "Post criado na comunidade!" });
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("community_posts").delete().eq("id", id);
    toast({ title: "Post excluído" });
    fetchPosts();
  };

  const getUserLabel = (userId: string) => {
    const p = profiles[userId];
    if (!p) return userId.slice(0, 8);
    return p.name || p.email || userId.slice(0, 8);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Comunidade</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />Novo Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Post na Comunidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Publicar como</label>
                <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span>{u.name || u.email || u.user_id.slice(0, 8)}</span>
                          {u.name && u.email && (
                            <span className="text-xs text-muted-foreground">({u.email})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <textarea
                placeholder="Conteúdo do post..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Input
                placeholder="URL da imagem (opcional)"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
              <Button onClick={handleSave} className="w-full">Publicar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-semibold text-secondary-foreground">
                  {getUserLabel(p.user_id)[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-xs font-medium text-foreground">{getUserLabel(p.user_id)}</span>
            </div>
            <p className="text-sm text-card-foreground">{p.content}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                <span>❤️ {p.likes_count}</span>
                <span>💬 {p.comments_count}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCommunity;
