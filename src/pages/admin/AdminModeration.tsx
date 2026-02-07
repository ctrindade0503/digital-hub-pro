import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Trash2, MessageCircle, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const AdminModeration = () => {
  const queryClient = useQueryClient();
  const [approvingAll, setApprovingAll] = useState(false);

  const { data: profiles } = useQuery({
    queryKey: ["moderation_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, name, email, avatar_url");
      return data || [];
    },
  });

  const profileMap = (profiles || []).reduce<Record<string, Profile>>((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const { data: pendingPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ["pending_posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_posts")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: pendingComments, isLoading: loadingComments } = useQuery({
    queryKey: ["pending_comments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_post_comments")
        .select("*")
        .eq("approved", false)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["pending_posts"] });
    queryClient.invalidateQueries({ queryKey: ["pending_comments"] });
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const handleApprovePost = async (postId: string) => {
    await supabase.from("community_posts").update({ approved: true }).eq("id", postId);
    invalidateAll();
  };

  const handleDeletePost = async (postId: string) => {
    await supabase.from("community_post_comments").delete().eq("post_id", postId);
    await supabase.from("community_post_likes").delete().eq("post_id", postId);
    await supabase.from("community_posts").delete().eq("id", postId);
    invalidateAll();
  };

  const handleApproveComment = async (commentId: string, postId: string) => {
    await supabase.from("community_post_comments").update({ approved: true }).eq("id", commentId);
    // Update comment count
    const { data: approved } = await supabase
      .from("community_post_comments")
      .select("id")
      .eq("post_id", postId)
      .eq("approved", true);
    await supabase.from("community_posts").update({ comments_count: approved?.length || 0 }).eq("id", postId);
    invalidateAll();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("community_post_comments").delete().eq("id", commentId);
    invalidateAll();
  };

  const handleApproveAll = async () => {
    setApprovingAll(true);
    try {
      // Approve all pending posts
      if (pendingPosts?.length) {
        await supabase.from("community_posts").update({ approved: true }).eq("approved", false);
      }
      // Approve all pending comments
      if (pendingComments?.length) {
        await supabase.from("community_post_comments").update({ approved: true }).eq("approved", false);
        // Recalculate comment counts for affected posts
        const postIds = [...new Set(pendingComments.map((c) => c.post_id))];
        for (const postId of postIds) {
          const { data: approved } = await supabase
            .from("community_post_comments")
            .select("id")
            .eq("post_id", postId)
            .eq("approved", true);
          await supabase.from("community_posts").update({ comments_count: approved?.length || 0 }).eq("id", postId);
        }
      }
      invalidateAll();
    } finally {
      setApprovingAll(false);
    }
  };

  const getDisplay = (userId: string) => {
    const p = profileMap[userId];
    return {
      name: p?.name || p?.email || "Usuário",
      avatar: p?.avatar_url,
      initial: (p?.name?.[0] || p?.email?.[0] || "?").toUpperCase(),
    };
  };

  const totalPending = (pendingPosts?.length || 0) + (pendingComments?.length || 0);
  const isLoading = loadingPosts || loadingComments;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Moderação</h2>
        {totalPending > 0 && (
          <Button onClick={handleApproveAll} size="sm" disabled={approvingAll}>
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {approvingAll ? "Aprovando..." : `Aprovar tudo (${totalPending})`}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : totalPending === 0 ? (
        <div className="text-center text-muted-foreground py-12 bg-card rounded-xl border border-border">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-primary/40" />
          <p className="font-medium">Nenhum item pendente</p>
          <p className="text-xs mt-1">Todos os posts e comentários estão aprovados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Posts */}
          {(pendingPosts?.length || 0) > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Posts pendentes ({pendingPosts?.length})
              </h3>
              <div className="space-y-3">
                {pendingPosts?.map((post) => {
                  const display = getDisplay(post.user_id);
                  return (
                    <div key={post.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={display.avatar || undefined} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                            {display.initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-card-foreground">{display.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleApprovePost(post.id)} title="Aprovar">
                            <CheckCircle className="w-4 h-4 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeletePost(post.id)} title="Excluir">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-card-foreground whitespace-pre-line">{post.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Comments */}
          {(pendingComments?.length || 0) > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" />
                Comentários pendentes ({pendingComments?.length})
              </h3>
              <div className="space-y-3">
                {pendingComments?.map((comment) => {
                  const display = getDisplay(comment.user_id);
                  return (
                    <div key={comment.id} className="bg-card rounded-xl border border-border p-3 flex items-start gap-3">
                      <Avatar className="w-7 h-7 mt-0.5">
                        <AvatarImage src={display.avatar || undefined} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-[10px] font-semibold">
                          {display.initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-card-foreground">{display.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs text-card-foreground leading-relaxed">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleApproveComment(comment.id, comment.post_id)} title="Aprovar">
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteComment(comment.id)} title="Excluir">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminModeration;
