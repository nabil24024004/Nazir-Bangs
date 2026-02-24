import { useNavigate, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, ArrowLeft, PenLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NavbarProps {
  showWriteButton?: boolean;
  onWriteClick?: () => void;
  showBackButton?: boolean;
  logoText?: string;
}

export const Navbar = ({ 
  showWriteButton = false, 
  onWriteClick,
  showBackButton = false,
  logoText = "NazirBangs"
}: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleWriteClick = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create a post."
      });
      navigate("/auth");
      return;
    }
    if (onWriteClick) {
      onWriteClick();
    }
  };

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBackButton ? (
            <Button variant="ghost" onClick={() => navigate(-1)} size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          ) : (
            <h1 
              className="text-2xl font-heading font-bold text-foreground tracking-tight cursor-pointer"
              onClick={() => navigate("/")}
            >
              {logoText}
            </h1>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a 
            href="/" 
            className={`hover:text-foreground transition-colors ${location.pathname === "/" ? "text-foreground font-medium" : ""}`}
          >
            Home
          </a>
          <a 
            href="/archive" 
            className={`hover:text-foreground transition-colors ${location.pathname === "/archive" ? "text-foreground font-medium" : ""}`}
          >
            Archive
          </a>
          <a 
            href="/authors" 
            className={`hover:text-foreground transition-colors ${location.pathname === "/authors" ? "text-foreground font-medium" : ""}`}
          >
            Authors
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              {showWriteButton && (
                <Button onClick={handleWriteClick} size="sm" className="gap-2">
                  <PenLine className="w-4 h-4" />
                  Write
                </Button>
              )}
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
