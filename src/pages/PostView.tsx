import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { usePostViews, useTrackView } from "@/hooks/usePostViews";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommentsSection } from "@/components/CommentsSection";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ShareButtons";

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

const PostView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { viewCount } = usePostViews(id || "");

  useTrackView(id || "");

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      if (authLoading) return;

      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            author:profiles!posts_author_id_fkey(full_name)
          `)
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.is_hidden && !isAdmin && data?.author_id !== user?.id) {
          navigate("/404");
          return;
        }
        
        setPost(data);
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, authLoading, isAdmin, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading story...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Story not found</h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Button>
      </div>
    );
  }

  const authorName = post.author?.full_name || "Anonymous";

  return (
    <div className="min-h-screen bg-background">
      <Navbar showBackButton />

      {/* Article */}
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Category */}
        <div className="mb-6">
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Article</span>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 leading-tight">
          {post.title}
        </h1>
        
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-foreground">{authorName}</span>
          </div>
          
          <span>•</span>
          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          
          <span>•</span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {viewCount} views
          </span>
          
          <div className="ml-auto">
            <ShareButtons postId={post.id} title={post.title} />
          </div>
        </div>

        {/* Featured Image */}
        {post.image_url && (
          <div className="mb-10 rounded-xl overflow-hidden">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg prose-invert max-w-none mb-12">
          {post.content.split('\n').map((paragraph, index) => (
            paragraph.trim() && (
              <p key={index} className="text-foreground/90 leading-relaxed mb-6">
                {paragraph}
              </p>
            )
          ))}
        </div>

        {/* Comments */}
        <CommentsSection postId={post.id} />
      </article>

      <Footer />
    </div>
  );
};

export default PostView;