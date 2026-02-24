import { useNavigate, useLocation, Link } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, ArrowLeft, PenLine, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Archive", href: "/archive" },
    { name: "Authors", href: "/authors" },
  ];

  const NavItems = ({ className = "" }: { className?: string }) => (
    <>
      {navLinks.map((link) => (
        <a 
          key={link.href}
          href={link.href} 
          className={`hover:text-foreground transition-colors ${className} ${
            location.pathname === link.href ? "text-foreground font-medium" : ""
          }`}
        >
          {link.name}
        </a>
      ))}
    </>
  );

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-background border-border">
                <SheetHeader className="mb-8">
                  <SheetTitle className="text-2xl font-heading font-bold text-foreground">
                    {logoText}
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-6 text-lg text-muted-foreground">
                  <NavItems className="py-2 border-b border-border/50" />
                  {showWriteButton && user && (
                    <Button onClick={handleWriteClick} className="w-full gap-2 mt-4">
                      <PenLine className="w-4 h-4" />
                      Write a Story
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

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
          <NavItems />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {showWriteButton && (
                <Button onClick={handleWriteClick} size="sm" className="hidden sm:flex gap-2">
                  <PenLine className="w-4 h-4" />
                  Write
                </Button>
              )}
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8 rounded-full border border-border"
                  }
                }}
              />
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
              <LogIn className="w-4 h-4" />
              <span className="hidden xmb:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
