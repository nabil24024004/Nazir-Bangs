import { SignIn, SignUp } from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Auth = () => {
  const location = useLocation();
  const isSignUp =
    location.pathname.includes("/auth/sign-up") ||
    new URLSearchParams(location.search).get("mode") === "sign-up";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isSignUp ? (
          <SignUp routing="path" path="/auth/sign-up" signInUrl="/auth" />
        ) : (
          <SignIn routing="path" path="/auth" signUpUrl="/auth/sign-up" />
        )}
      </div>
    </div>
  );
};

export default Auth;
