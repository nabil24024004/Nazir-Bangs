import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostCard } from "@/components/BlogPostCard";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, PenLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  is_hidden: boolean;
  author_id: string | null;
  author?: {
    full_name: string;
  } | null;
}

const Archive = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Group posts by month/year
  const groupedPosts = posts.reduce((acc, post) => {
    const date = new Date(post.created_at);
    const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {} as Record<string, Post[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 
            className="text-2xl font-heading font-bold text-foreground tracking-tight cursor-pointer"
            onClick={() => navigate("/")}
          >
            GangBang
          </h1>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground transition-colors">Home</a>
            <a href="/archive" className="text-foreground transition-colors">Archive</a>
            <a href="/authors" className="hover:text-foreground transition-colors">Authors</a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-12">Archive</h2>
        
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">
            <div className="animate-pulse">Loading archive...</div>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedPosts).map(([monthYear, monthPosts]) => (
              <div key={monthYear}>
                <h3 className="text-xl font-heading font-semibold text-primary mb-6 border-b border-border pb-2">
                  {monthYear}
                </h3>
                <div className="space-y-4">
                  {monthPosts.map((post) => (
                    <div 
                      key={post.id}
                      className="flex items-center gap-4 py-3 border-b border-border/50 hover:bg-muted/50 px-2 -mx-2 rounded cursor-pointer transition-colors"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <span className="text-sm text-muted-foreground w-24 shrink-0">
                        {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <h4 className="font-medium text-foreground flex-1">{post.title}</h4>
                      <span className="text-sm text-muted-foreground">{post.author?.full_name || 'Anonymous'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Archive;
