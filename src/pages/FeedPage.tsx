import { useState } from "react";
import { Bell, ShieldCheck, Send, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FeedPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((p) => p.user_id).filter(Boolean))];

      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", userIds)
        : { data: [] };

      const { data: roles } = userIds.length
        ? await supabase.from("user_roles").select("user_id, role").in("user_id", userIds).eq("role", "admin")
        : { data: [] };

      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const adminSet = new Set((roles ?? []).map((r) => r.user_id));

      return data.map((post) => ({
        ...post,
        author_name: profileMap.get(post.user_id)?.name ?? "Usuário",
        author_avatar: profileMap.get(post.user_id)?.avatar_url,
        is_admin: adminSet.has(post.user_id),
      }));
    },
  });

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    await supabase.from("feed_posts").insert({ content: newPost, user_id: user.id });
    setNewPost("");
    queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
  };

  const handleDelete = async (postId: string) => {
    await supabase.from("feed_posts").delete().eq("id", postId);
    queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-primary">M</span>
        </div>
        <button className="w-10 h-10 flex items-center justify-center text-muted-foreground">
          <Bell className="w-5 h-5" />
        </button>
      </header>

      <div className="px-4 mt-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Atualizações</h2>

        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Escreva uma atualização..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="flex-1 h-10 rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
            />
            <Button onClick={handlePost} size="icon" className="h-10 w-10 rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            ))}

          {!isLoading && posts?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhuma atualização ainda.</p>
          )}

          {posts?.map((post) => (
            <article
              key={post.id}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                {post.author_avatar ? (
                  <img
                    src={post.author_avatar}
                    alt={post.author_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {post.author_name?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-card-foreground">
                      {post.author_name}
                    </p>
                    {post.is_admin && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                    title="Excluir postagem"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full rounded-lg mb-3 object-cover max-h-64"
                />
              )}
              <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">
                {post.content}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
