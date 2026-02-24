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
                  
                  {user && (
                    <div className="flex flex-col gap-4 pt-4">
                      <p className="text-sm font-medium text-foreground px-2">Account Management</p>
                      <div className="flex items-center gap-3 px-2">
                        <UserButton 
                          afterSignOutUrl="/" 
                          appearance={{
                            elements: {
                              userButtonAvatarBox: "w-10 h-10 rounded-full border border-border"
                            }
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{user.user_metadata.full_name}</span>
                          <span className="text-xs text-muted-foreground">Manage your settings</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {showWriteButton && user && (
                    <Button onClick={handleWriteClick} className="w-full gap-2 mt-4 py-6 text-lg">
                      <PenLine className="w-5 h-5" />
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

        <div className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {showWriteButton && (
                <Button onClick={handleWriteClick} size="sm" className="hidden sm:flex gap-2">
                  <PenLine className="w-4 h-4" />
                  Write
                </Button>
              )}
              <div className="flex items-center justify-center p-1">
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-10 h-10 sm:w-8 sm:h-8 rounded-full border border-border transition-transform active:scale-95 touch-manipulation"
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-2">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
