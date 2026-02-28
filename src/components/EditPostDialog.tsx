import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditPostDialogProps {
  post: {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditPostDialog = ({ post, open, onOpenChange, onSuccess }: EditPostDialogProps) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(post.title);
    setContent(post.content);
    setImagePreview(post.image_url);
    setImage(null);
  }, [post]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = post.image_url;

      if (image) {
        // 1. Get presigned URL from Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('r2-upload', {
          body: {
            fileName: image.name,
            fileType: image.type,
          }
        });

        if (functionError) throw functionError;

        const { signedUrl, fileName } = data;

        // 2. Upload directly to Cloudflare R2
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: image,
          headers: {
            'Content-Type': image.type,
          }
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image to Cloudflare R2');
        }

        // 3. Construct public URL using the environment variable
        const publicDomain = import.meta.env.VITE_CLOUDFLARE_R2_PUBLIC_URL;
        if (!publicDomain) {
          throw new Error("Missing VITE_CLOUDFLARE_R2_PUBLIC_URL in .env");
        }

        const baseUrl = publicDomain.endsWith('/') ? publicDomain.slice(0, -1) : publicDomain;
        imageUrl = `${baseUrl}/${fileName}`;
      }

      const { error } = await supabase
        .from("posts")
        .update({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
        })
        .eq("id", post.id);

      if (error) throw error;

      toast.success("Post updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-md object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
