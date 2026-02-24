import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { BlogPostCard } from "@/components/BlogPostCard";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { Footer } from "@/components/Footer";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

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

const Index = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNewPost = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a post."
      });
      navigate("/auth");
      return;
    }
    setIsCreateOpen(true);
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) => post.title.toLowerCase().includes(query) || post.content.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase.
      from("posts").
      select(`
          *,
          author:profiles!posts_author_id_fkey(full_name)
        `).
      order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        variant: "destructive",
        title: "Error loading posts",
        description: "Failed to load blog posts. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showWriteButton onWriteClick={() => setIsCreateOpen(true)} />

      {/* Hero Section */}
      <section className="py-20 md:py-32 border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary text-sm font-medium tracking-wider uppercase mb-4">NAZIRS CHODNA SQUAD PRESENTS</p>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
            Stories. Worth. Sharing.<br />Through the Noise
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Meaningless stories. Real perspectives. A space for unfiltered thoughts, wild ideas, and stories that deserve to be told.
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 py-6 bg-input border-border rounded-full text-base" />

          </div>
        </div>
      </section>

      {/* Featured Carousel */}
      {!isLoading && posts.length > 0 &&
      <FeaturedCarousel posts={posts} />
      }

      {/* Posts Grid */}
      <main className="container mx-auto px-4 py-16">
        {isLoading ?
        <div className="text-center text-muted-foreground py-20">
            <div className="animate-pulse">Loading stories...</div>
          </div> :
        filteredPosts.length === 0 ?
        <div className="text-center py-20">
            <p className="text-muted-foreground mb-6 text-lg">
              {searchQuery ? "No posts match your search." : "No stories yet. Be the first to share!"}
            </p>
          {!searchQuery && user && (
            <Button onClick={handleNewPost} className="gap-2">
              <Plus className="w-4 h-4" />
              Write First Story
            </Button>
          )}
          {!searchQuery && !user && (
            <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2">
              Sign in to write
            </Button>
          )}
          </div> :

        <div className="space-y-0">
            {filteredPosts.map((post, index) =>
          <BlogPostCard key={post.id} post={post} onDelete={fetchPosts} featured={index === 0} />
          )}
          </div>
        }
      </main>

      <CreatePostDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={fetchPosts} />

      {/* Newsletter Section */}
      <section className="border-t border-border py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-heading font-bold mb-4">Updates, No Noise</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Meaningful insights and updates — shared with care.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input placeholder="Your email" className="flex-1 bg-input border-border" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>);

};

export default Index;
