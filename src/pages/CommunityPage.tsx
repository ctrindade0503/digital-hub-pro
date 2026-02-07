import { useState, useRef } from "react";
import { Heart, MessageCircle, Send, ShieldCheck, Upload, Trash2, CheckCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommentSection from "@/components/community/CommentSection";

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
  const [simulateUser, setSimulateUser] = useState(false);
  const [fakeName, setFakeName] = useState("");
  const [fakeAvatar, setFakeAvatar] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const fakeAvatarInputRef = useRef<HTMLInputElement>(null);

  const { data: requireApproval } = useQuery({
    queryKey: ["require_comment_approval"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "require_comment_approval").maybeSingle();
      return data?.value === "true";
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["community_profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, name, email, avatar_url");
      return data || [];
    },
  });

  const { data: adminIds } = useQuery({
    queryKey: ["admin_ids"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      return (data || []).map((r) => r.user_id);
    },
  });

  const { data: userLikes } = useQuery({
    queryKey: ["user_likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("community_post_likes")
        .select("post_id")
        .eq("user_id", user.id);
      return (data || []).map((l) => l.post_id);
    },
    enabled: !!user,
  });

  const likedSet = new Set(userLikes || []);

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

  const handleFakeAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `fake-avatars/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(path);
      setFakeAvatar(urlData.publicUrl);
    } catch {
      // silently fail
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    const shouldApprove = isAdmin ? true : !requireApproval;
    const insert: any = {
      content: newPost,
      user_id: user.id,
      approved: shouldApprove,
    };
    if (isAdmin && simulateUser && fakeName.trim()) {
      insert.display_name = fakeName.trim();
      insert.display_avatar_url = fakeAvatar || null;
    }
    await supabase.from("community_posts").insert(insert);
    setNewPost("");
    setFakeName("");
    setFakeAvatar("");
    setSimulateUser(false);
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    queryClient.invalidateQueries({ queryKey: ["user_likes", user?.id] });
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

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    // Delete related comments and likes first
    await supabase.from("community_post_comments").delete().eq("post_id", postId);
    await supabase.from("community_post_likes").delete().eq("post_id", postId);
    await supabase.from("community_posts").delete().eq("id", postId);
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const handleApprovePost = async (postId: string) => {
    await supabase.from("community_posts").update({ approved: true }).eq("id", postId);
    queryClient.invalidateQueries({ queryKey: ["community_posts"] });
  };

  const getPostDisplay = (post: any) => {
    // If display_name is set, it's a simulated user post
    if (post.display_name) {
      return {
        name: post.display_name,
        avatar: post.display_avatar_url,
        initial: post.display_name[0]?.toUpperCase() || "?",
        isAdmin: false,
      };
    }
    const p = profileMap[post.user_id];
    return {
      name: p?.name || p?.email || "Usuário",
      avatar: p?.avatar_url,
      initial: (p?.name?.[0] || p?.email?.[0] || "?").toUpperCase(),
      isAdmin: adminSet.has(post.user_id),
    };
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Comunidade</h1>
      </header>

      {/* New post */}
      <div className="px-4 mt-4 space-y-2">
        {isAdmin && (
          <div className="bg-card rounded-xl border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Simular usuário</Label>
              <Switch checked={simulateUser} onCheckedChange={setSimulateUser} />
            </div>
            {simulateUser && (
              <div className="space-y-2">
                <Input
                  placeholder="Nome do usuário fictício"
                  value={fakeName}
                  onChange={(e) => setFakeName(e.target.value)}
                  className="h-9 text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fakeAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFakeAvatarUpload}
                  />
                  {fakeAvatar ? (
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={fakeAvatar} />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    disabled={uploadingAvatar}
                    onClick={() => fakeAvatarInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingAvatar ? "Enviando..." : fakeAvatar ? "Trocar foto" : "Foto de perfil"}
                  </Button>
                </div>
              </div>
            )}
          </div>
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
          (posts || []).filter((post) => {
            if (isAdmin) return true;
            if (post.approved) return true;
            if (post.user_id === user?.id) return true;
            return false;
          }).map((post) => {
            const display = getPostDisplay(post);
            return (
              <article key={post.id} className={`bg-card rounded-xl border border-border p-4 shadow-sm ${!post.approved ? "opacity-70" : ""}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={display.avatar || undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
                      {display.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-card-foreground">{display.name}</p>
                      {display.isAdmin && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {!post.approved && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full">
                          <Clock className="w-2.5 h-2.5" /> Aguardando aprovação
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin && !post.approved && (
                      <button
                        onClick={() => handleApprovePost(post.id)}
                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                        title="Aprovar postagem"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {(isAdmin || post.user_id === user?.id) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        title="Excluir postagem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                    className="flex items-center gap-1.5 transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Heart className={`w-4 h-4 ${likedSet.has(post.id) ? "text-destructive fill-current" : ""}`} />
                    <span className="text-xs text-muted-foreground">{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => setExpandedComments((prev) => {
                      const next = new Set(prev);
                      next.has(post.id) ? next.delete(post.id) : next.add(post.id);
                      return next;
                    })}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs">{post.comments_count}</span>
                  </button>
                </div>
                {expandedComments.has(post.id) && (
                  <CommentSection
                    postId={post.id}
                    userId={user?.id}
                    isAdmin={isAdmin}
                    profileMap={profileMap}
                    requireApproval={!!requireApproval}
                  />
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
