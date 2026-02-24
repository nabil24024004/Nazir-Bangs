import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: {
    full_name: string;
  } | null;
}

interface FeaturedCarouselProps {
  posts: Post[];
}

export const FeaturedCarousel = ({ posts }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  
  const featuredPosts = posts.slice(0, 5);
  
  useEffect(() => {
    if (featuredPosts.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredPosts.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredPosts.length]);
  
  if (featuredPosts.length === 0) return null;
  
  const currentPost = featuredPosts[currentIndex];
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredPosts.length) % featuredPosts.length);
  };
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredPosts.length);
  };
  
  return (
    <section className="relative border-b border-border overflow-hidden">
      <div className="relative h-[400px] md:h-[500px]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ 
            backgroundImage: currentPost.image_url 
              ? `url(${currentPost.image_url})` 
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12">
          <span className="text-primary text-sm font-medium tracking-wider uppercase mb-2">
            Featured Story
          </span>
          <h2 
            className="text-3xl md:text-5xl font-heading font-bold mb-4 max-w-3xl cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/post/${currentPost.id}`)}
          >
            {currentPost.title}
          </h2>
          <p className="text-muted-foreground mb-4 max-w-2xl line-clamp-2">
            {currentPost.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>By {currentPost.author?.full_name || 'Anonymous'}</span>
            <span>•</span>
            <span>{new Date(currentPost.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}</span>
          </div>
        </div>
        
        {/* Navigation Arrows */}
        {featuredPosts.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
              onClick={goToNext}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}
        
        {/* Dots */}
        {featuredPosts.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {featuredPosts.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-muted-foreground/50 hover:bg-muted-foreground'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
