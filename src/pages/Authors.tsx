import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Author {
  user_id: string;
  full_name: string;
  post_count: number;
}

const Authors = () => {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        // Get all profiles with their post counts
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name");

        if (profilesError) throw profilesError;

        // Get post counts for each author
        const { data: posts, error: postsError } = await supabase
          .from("posts")
          .select("author_id")
          .eq("is_hidden", false);

        if (postsError) throw postsError;

        const postCounts = posts?.reduce((acc, post) => {
          if (post.author_id) {
            acc[post.author_id] = (acc[post.author_id] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>) || {};

        const authorsWithCounts = profiles
          ?.map(profile => ({
            user_id: profile.user_id,
            full_name: profile.full_name,
            post_count: postCounts[profile.user_id] || 0
          }))
          .filter(author => author.post_count > 0)
          .sort((a, b) => b.post_count - a.post_count) || [];

        setAuthors(authorsWithCounts);
      } catch (error) {
        console.error("Error fetching authors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar logoText="GangBang" />

      {/* Content */}
      <main className="container mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Authors</h2>
        <p className="text-muted-foreground mb-12 max-w-2xl">
          Meet the writers behind the stories. Each author brings their unique perspective and voice.
        </p>
        
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">
            <div className="animate-pulse">Loading authors...</div>
          </div>
        ) : authors.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No authors yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authors.map((author) => (
              <div
                key={author.user_id}
                className="p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/author/${author.user_id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(author.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">{author.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {author.post_count} {author.post_count === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
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

export default Authors;
