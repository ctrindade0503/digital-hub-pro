import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, ShieldCheck, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Profile {
  user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const CommunityPage = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [postAsUserId, setPostAsUserId] = useState<string>("self");

  // Fetch all profiles for admin user selector & post display
  const { data: profiles } = useQuery({
    queryKey: ["community_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, name, email, avatar_url");
      return data || [];
    },
  });

  // Fetch admin user_ids
  const { data: adminIds } = useQuery({
    queryKey: ["admin_ids"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      return (data || []).map((r) => r.user_id);
    },
  });

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["community_posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const profileMap = (profiles || []).reduce<Record<string, Profile>>((acc, p) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  const adminSet = new Set(adminIds || []);

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    const targetUserId = postAsUserId === "self" ? user.id : postAsUserId;
    await supabase.from("community_posts").insert({
      content: newPost,
      user_id: targetUserId,
    });
    setNewPost("");
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from("community_post_likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("community_post_likes").delete().eq("id", existing.id);
      await supabase.from("community_posts").update({
        likes_count: Math.max(0, (posts?.find((p) => p.id === postId)?.likes_count || 1) - 1),
      }).eq("id", postId);
    } else {
      await supabase.from("community_post_likes").insert({ post_id: postId, user_id: user.id });
      await supabase.from("community_posts").update({
        likes_count: (posts?.find((p) => p.id === postId)?.likes_count || 0) + 1,
      }).eq("id", postId);
    }
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const getProfile = (userId: string) => profileMap[userId];
  const getInitial = (userId: string) => {
    const p = getProfile(userId);
    return (p?.name?.[0] || p?.email?.[0] || "?").toUpperCase();
  };
  const getName = (userId: string) => {
    const p = getProfile(userId);
    return p?.name || p?.email || "Usuário";
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Comunidade</h1>
      </header>

      {/* New post input */}
      <div className="px-4 mt-4 space-y-2">
        {isAdmin && (
          <Select value={postAsUserId} onValueChange={setPostAsUserId}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Postar como..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-primary" /> Postar como Admin
                </span>
              </SelectItem>
              {(profiles || [])
                .filter((p) => p.user_id !== user?.id)
                .map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.name || p.email || p.user_id.slice(0, 8)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Compartilhe algo..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="flex-1 h-10 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
          />
          <Button onClick={handlePost} size="icon" className="h-10 w-10 rounded-xl shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 mt-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Carregando...</div>
        ) : (
          (posts || []).map((post) => {
            const profile = getProfile(post.user_id);
            const isPostAdmin = adminSet.has(post.user_id);
            return (
              <article
                key={post.id}
                className="bg-card rounded-xl border border-border p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                      {getInitial(post.user_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-card-foreground">
                        {getName(post.user_id)}
                      </p>
                      {isPostAdmin && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-card-foreground leading-relaxed mb-3 whitespace-pre-line">
                  {post.content}
                </p>
                {post.image_url && (
                  <img src={post.image_url} alt="" className="rounded-lg w-full mb-3 object-cover max-h-64" />
                )}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">{post.likes_count}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">{post.comments_count}</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
