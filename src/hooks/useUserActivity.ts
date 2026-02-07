import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserActivity = () => {
  const { user } = useAuth();

  const commentsQuery = useQuery({
    queryKey: ["user_comments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_post_comments")
        .select("id, content, created_at, post_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const likesQuery = useQuery({
    queryKey: ["user_likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_post_likes")
        .select("id, created_at, post_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const postsQuery = useQuery({
    queryKey: ["user_posts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_posts")
        .select("id, content, created_at, likes_count, comments_count, image_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const historyQuery = useQuery({
    queryKey: ["access_history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("access_history" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("accessed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  return {
    comments: commentsQuery.data || [],
    likes: likesQuery.data || [],
    posts: postsQuery.data || [],
    history: historyQuery.data || [],
    isLoading: commentsQuery.isLoading || likesQuery.isLoading || postsQuery.isLoading,
  };
};
