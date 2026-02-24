import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, Eye as EyeIcon, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { EditPostDialog } from "./EditPostDialog";
import { useAuth } from "@/hooks/useAuth";
import { PostReactions } from "./PostReactions";
import { usePostViews } from "@/hooks/usePostViews";
import { ShareButtons } from "./ShareButtons";

interface BlogPostCardProps {
  post: {
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
  };
  onDelete?: () => void;
  featured?: boolean;
}

export const BlogPostCard = ({ post, onDelete, featured = false }: BlogPostCardProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { user, isAdmin } = useAuth();
  const { viewCount } = usePostViews(post.id);
  
  const isAuthor = user && post.author_id === user.id;
  const canEdit = isAuthor || isAdmin;
  
  const excerpt = post.content.length > 200 
    ? post.content.substring(0, 200) + "..." 
    : post.content;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this post?")) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } else {
      toast.success("Post deleted successfully");
      onDelete?.();
    }
  };

  const handleToggleHidden = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { error } = await supabase
      .from("posts")
      .update({ is_hidden: !post.is_hidden })
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to update post visibility");
      console.error(error);
    } else {
      toast.success(post.is_hidden ? "Post unhidden" : "Post hidden");
      onDelete?.();
    }
  };

  const authorName = post.author?.full_name || "Anonymous";

  return (
    <>
      <Link to={`/post/${post.id}`}>
        <article 
          className={`group border-b border-border py-8 hover:bg-card/50 transition-colors ${
            featured ? 'py-12' : ''
          }`}
        >
          <div className={`flex flex-col ${featured ? 'md:flex-row' : 'md:flex-row'} gap-6 md:gap-8`}>
            {/* Image */}
            {post.image_url && (
              <div className={`${featured ? 'md:w-1/2' : 'md:w-2/5'} flex-shrink-0`}>
                <div className={`aspect-[16/10] overflow-hidden rounded-lg bg-secondary ${
                  post.is_hidden && canEdit ? "opacity-60" : ""
                }`}>
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            )}
            
            {/* Content */}
            <div className={`flex-1 flex flex-col justify-center ${!post.image_url ? 'md:max-w-2xl' : ''}`}>
              {/* Category tag */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Article</span>
                {post.is_hidden && canEdit && (
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Hidden</span>
                )}
              </div>
              
              {/* Title */}
              <h3 className={`font-heading font-bold mb-3 group-hover:text-primary transition-colors leading-tight ${
                featured ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
              }`}>
                {post.title}
              </h3>
              
              {/* Excerpt */}
              <p className="text-muted-foreground mb-4 line-clamp-2 text-sm md:text-base">
                {excerpt}
              </p>
              
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{authorName}</span>
                </div>
                
                <span className="hidden sm:inline">•</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-3.5 h-3.5" />
                  {viewCount}
                </span>
                
                <div className="ml-auto flex items-center gap-2">
                  <ShareButtons postId={post.id} title={post.title} />
                  
                  {/* Edit/Delete buttons for author or admin */}
                  {canEdit && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleEdit}
                        className="h-8 w-8 hover:bg-secondary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleToggleHidden}
                          className="h-8 w-8 hover:bg-secondary"
                        >
                          {post.is_hidden ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDelete}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reactions */}
              <div onClick={(e) => e.preventDefault()} className="mt-4">
                <PostReactions postId={post.id} />
              </div>
            </div>
          </div>
        </article>
      </Link>
      
      <EditPostDialog
        post={post}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => onDelete?.()} 
      />
    </>
  );
};