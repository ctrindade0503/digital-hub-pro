import { MessageSquare, Heart, Clock, FileText, Trash2 } from "lucide-react";
import { useUserActivity } from "@/hooks/useUserActivity";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const ActivityTab = () => {
  const { comments, likes, posts, history, isLoading } = useUserActivity();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) {
      toast({ title: "Erro ao excluir postagem", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["user_posts", user?.id] });
      toast({ title: "Postagem excluída" });
    }
  };

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Recent history */}
      {history.length > 0 && (
        <Section title="Últimos conteúdos acessados" icon={<Clock className="w-4 h-4" />}>
          {history.map((h: any) => (
            <div key={h.id} className="py-2 border-b border-border last:border-0">
              <p className="text-sm font-medium text-card-foreground">{h.content_title || "Conteúdo"}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(h.accessed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          ))}
        </Section>
      )}

      {/* My posts */}
      <Section title="Minhas postagens" icon={<FileText className="w-4 h-4" />}>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhuma postagem ainda</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="py-2 border-b border-border last:border-0 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-card-foreground line-clamp-2">{post.content}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR })} · ❤️ {post.likes_count} · 💬 {post.comments_count}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-destructive" onClick={() => handleDeletePost(post.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </Section>

      {/* Comments */}
      <Section title="Últimos comentários" icon={<MessageSquare className="w-4 h-4" />}>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhum comentário ainda</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="py-2 border-b border-border last:border-0">
              <p className="text-sm text-card-foreground line-clamp-2">{c.content}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          ))
        )}
      </Section>

      {/* Likes */}
      <Section title="Posts curtidos" icon={<Heart className="w-4 h-4" />}>
        {likes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Nenhuma curtida ainda</p>
        ) : (
          <p className="text-sm text-muted-foreground py-2">{likes.length} posts curtidos</p>
        )}
      </Section>
    </div>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-primary">{icon}</span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="bg-card border border-border rounded-xl p-3">{children}</div>
  </div>
);

export default ActivityTab;
