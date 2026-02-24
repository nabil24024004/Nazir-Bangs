import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import PostView from "./pages/PostView";
import Auth from "./pages/Auth";
import Archive from "./pages/Archive";
import Authors from "./pages/Authors";
import AuthorProfile from "./pages/AuthorProfile";
import NotFound from "./pages/NotFound";
import { ClerkProvider, useSession } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useEffect } from "react";
import { setClerkTokenGetter } from "@/integrations/supabase/client";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. Authentication will not work.");
}

function SupabaseTokenProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();

  useEffect(() => {
    setClerkTokenGetter(async () => {
      if (!session) return null;
      return await session.getToken({ template: 'supabase' });
    });
  }, [session]);

  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY || "pk_test_sample"}
      appearance={{
        baseTheme: dark
      }}
    >
      <SupabaseTokenProvider>
        <ThemeProvider defaultTheme="dark" storageKey="blog-theme" attribute="class" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/post/:id" element={<PostView />} />
                <Route path="/auth/*" element={<Auth />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="/author/:authorId" element={<AuthorProfile />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </SupabaseTokenProvider>
    </ClerkProvider>
  </QueryClientProvider>
);

export default App;
