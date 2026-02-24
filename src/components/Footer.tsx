import { Heart } from "lucide-react";
import { Twitter, Instagram, Github } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Social Icons */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>
          
          {/* Copyright */}
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            © {new Date().getFullYear()}{" "}
            <span className="text-primary">Nazis Chodna Squad</span>{" "}
            all rights reserved.
            <Heart className="w-4 h-4 text-primary inline" />
          </p>
          
          {/* Developer Credit */}
          <p className="text-sm text-muted-foreground">
            Developed and managed by <span className="font-medium text-foreground">Sheikh Azwad Abrar</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
