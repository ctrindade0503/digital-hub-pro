import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { communityPosts, type CommunityPost } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CommunityPage = () => {
  const [posts, setPosts] = useState<CommunityPost[]>(communityPosts);
  const [newPost, setNewPost] = useState("");

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: CommunityPost = {
      id: Date.now().toString(),
      userName: "Você",
      date: "Agora",
      content: newPost,
      likes: 0,
      comments: 0,
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  const handleLike = (id: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p)));
  };

  return (
    <div className="pb-32 min-h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
        <h1 className="text-lg font-bold text-foreground">Comunidade</h1>
      </header>

      {/* New post input */}
      <div className="px-4 mt-4 flex gap-2">
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

      {/* Posts */}
      <div className="px-4 mt-4 space-y-4">
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-card rounded-xl border border-border p-4 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-secondary-foreground">
                  {post.userName[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {post.userName}
                </p>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            </div>
            <p className="text-sm text-card-foreground leading-relaxed mb-3">
              {post.content}
            </p>
            <div className="flex items-center gap-4 pt-2 border-t border-border">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.comments}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
