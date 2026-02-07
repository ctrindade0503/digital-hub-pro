import { Bell } from "lucide-react";
import { feedPosts } from "@/lib/mockData";

const FeedPage = () => {
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
          {feedPosts.map((post) => (
            <article
              key={post.id}
              className="bg-card rounded-xl border border-border p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">M</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {post.author}
                  </p>
                  <p className="text-xs text-muted-foreground">{post.date}</p>
                </div>
              </div>
              <p className="text-sm text-card-foreground leading-relaxed">
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
