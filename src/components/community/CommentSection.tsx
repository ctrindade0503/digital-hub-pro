import { useState } from "react";
import { Send, Trash2, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface CommentSectionProps {
  postId: string;
  userId: string | undefined;
  isAdmin: boolean;
  profileMap: Record<string, Profile>;
  requireApproval: boolean;
}

const CommentSection = ({ postId, userId, isAdmin, profileMap, requireApproval }: CommentSectionProps) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments } = useQuery({
    queryKey: ["community_comments", postId],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  const visibleComments = (comments || []).filter((c) => {
    if (isAdmin) return true;
    if (c.approved) return true;
    if (c.user_id === userId) return true;
    return false;
  });

  const handleComment = async () => {
    if (!newComment.trim() || !userId) return;
    const shouldApprove = requireApproval === true ? false : true;
    await supabase.from("community_post_comments").insert({
      post_id: postId,
      user_id: userId,
      content: newComment.trim(),
      approved: shouldApprove,
    });
    // Update comments_count
    const currentCount = visibleComments.filter((c) => c.approved).length;
    await supabase.from("community_posts").update({
      comments_count: currentCount + (requireApproval ? 0 : 1),
    }).eq("id", postId);
    setNewComment("");
    queryClient.invalidateQueries({ queryKey: ["community_comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const handleDelete = async (commentId: string, wasApproved: boolean) => {
    await supabase.from("community_post_comments").delete().eq("id", commentId);
    if (wasApproved) {
      const approvedCount = visibleComments.filter((c) => c.approved && c.id !== commentId).length;
      await supabase.from("community_posts").update({ comments_count: approvedCount }).eq("id", postId);
    }
    queryClient.invalidateQueries({ queryKey: ["community_comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const handleApprove = async (commentId: string) => {
    await supabase.from("community_post_comments").update({ approved: true }).eq("id", commentId);
    const approvedCount = visibleComments.filter((c) => c.approved).length + 1;
    await supabase.from("community_posts").update({ comments_count: approvedCount }).eq("id", postId);
    queryClient.invalidateQueries({ queryKey: ["community_comments", postId] });
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const getCommentDisplay = (comment: any) => {
    const p = profileMap[comment.user_id];
    return {
      name: p?.name || p?.email || "Usuário",
      avatar: p?.avatar_url,
      initial: (p?.name?.[0] || p?.email?.[0] || "?").toUpperCase(),
    };
  };

  return (
    <div className="mt-3 space-y-3">
      {visibleComments.map((comment) => {
        const display = getCommentDisplay(comment);
        const canDelete = isAdmin || comment.user_id === userId;
        return (
          <div
            key={comment.id}
            className={`flex gap-2 items-start ${!comment.approved ? "opacity-70" : ""}`}
          >
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
                {!comment.approved && (
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    <Clock className="w-2.5 h-2.5" /> Aguardando aprovação
                  </span>
                )}
              </div>
              <p className="text-xs text-card-foreground leading-relaxed">{comment.content}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && !comment.approved && (
                <button
                  onClick={() => handleApprove(comment.id)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Aprovar"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(comment.id, comment.approved)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  title="Apagar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {userId && (
        <div className="flex gap-2">
          <Input
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 h-8 text-xs rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && handleComment()}
          />
          <Button onClick={handleComment} size="icon" variant="ghost" className="h-8 w-8 shrink-0">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
