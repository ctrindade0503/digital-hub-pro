import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const FeedPage = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">M</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Admin</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
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
