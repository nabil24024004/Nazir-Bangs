import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostCard } from "@/components/BlogPostCard";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, LogOut, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

interface Profile {
  user_id: string;
  full_name: string;
  created_at: string;
}

const AuthorProfile = () => {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchAuthorData = async () => {
      if (!authorId) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", authorId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch author's posts
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(full_name)
          `)
          .eq("author_id", authorId)
          .eq("is_hidden", false)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);
      } catch (error) {
        console.error("Error fetching author data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorData();
  }, [authorId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchPosts = async () => {
    if (!authorId) return;
    const { data, error } = await supabase
      .from("posts")
      .select(`*, author:profiles!posts_author_id_fkey(full_name)`)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });
    if (!error) setPosts(data || []);
  };

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
            <a href="/archive" className="hover:text-foreground transition-colors">Archive</a>
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
        <Button 
          variant="ghost" 
          className="mb-8 gap-2"
          onClick={() => navigate("/authors")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Authors
        </Button>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">
            <div className="animate-pulse">Loading author profile...</div>
          </div>
        ) : !profile ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Author not found.</p>
          </div>
        ) : (
          <>
            {/* Author Header */}
            <div className="flex items-center gap-6 mb-12 pb-8 border-b border-border">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                  {profile.full_name}
                </h2>
                <p className="text-muted-foreground">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'} · 
                  Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Author's Posts */}
            <h3 className="text-2xl font-heading font-semibold mb-8">Posts by {profile.full_name}</h3>
            {posts.length === 0 ? (
              <p className="text-muted-foreground">No posts yet.</p>
            ) : (
              <div className="space-y-0">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} onDelete={fetchPosts} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AuthorProfile;
