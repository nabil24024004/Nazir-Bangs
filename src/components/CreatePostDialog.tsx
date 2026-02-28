import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Loader2 } from "lucide-react";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreatePostDialog = ({ open, onOpenChange, onSuccess }: CreatePostDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 470 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please compress your image to around 400KB before uploading.",
        });
        e.target.value = ""; // Clear the input
        return;
      }
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

    if (!user) {
      toast({
        variant: "destructive",
        title: "Not authenticated",
        description: "Please sign in to create a post.",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in both title and content.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

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

        // 2. Upload directly to Cloudflare R2 using the presigned URL
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

      const { error: insertError } = await supabase
        .from("posts")
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            image_url: imageUrl,
            author_id: user.id,
          },
        ]);

      if (insertError) throw insertError;

      toast({
        title: "Post published!",
        description: "Your story has been shared successfully.",
      });

      setTitle("");
      setContent("");
      setImage(null);
      setImagePreview(null);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create post. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Write a Story</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a title..."
              disabled={isSubmitting}
              className="bg-input border-border text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell your story..."
              rows={12}
              disabled={isSubmitting}
              className="bg-input border-border resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Cover Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                  className="flex-1 bg-input border-border"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("image")?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose
                </Button>
              </div>
              <div className="text-sm space-y-2">
                <p className="text-muted-foreground flex flex-wrap gap-1">
                  Limit the image size to around 400 kb.
                  <a
                    href="https://imagecompressor.11zon.com/en/image-compressor/compress-image-without-losing-quality"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    compress your image here.
                  </a>
                </p>
                <div className="bg-muted/50 p-3 rounded-md border border-border/50">
                  <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-2">Guidelines for compressing:</p>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                    <li>First add image</li>
                    <li>Select size and search for size 400 kb</li>
                    <li>Download the image and then add it here</li>
                  </ol>
                </div>
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Story"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};