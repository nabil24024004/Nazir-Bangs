import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser, useAuth as useClerkAuth, useSession } from "@clerk/clerk-react";

export const useAuth = () => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { session } = useSession();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  // Map Clerk user to look similar enough to Supabase user for our app
  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress,
    user_metadata: {
      full_name: clerkUser.fullName || clerkUser.username || "Anonymous"
    }
  } : null;

  useEffect(() => {
    const syncProfileAndCheckAdmin = async (userId: string, fullName: string) => {
      console.log("Starting syncProfileAndCheckAdmin for:", userId);
      if (!session) {
        console.log("No Clerk session found, aborting sync.");
        return;
      }
      
      setDbLoading(true);
      try {
        console.log("Fetching Supabase token from Clerk...");
        const token = await session.getToken({ template: 'supabase' });
        console.log("Token retrieved:", token ? "Yes (hidden for security)" : "No");
        
        if (!token) throw new Error("Could not retrieve Supabase token from Clerk");

        // 1. Ensure the profile exists in Supabase so foreign keys (like user_roles) don't fail
        console.log("Attempting to upsert profile to Supabase...");
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            { user_id: userId, full_name: fullName },
            { onConflict: 'user_id' }
          );

        if (upsertError) {
          console.error("Failed to upsert profile:", upsertError);
        } else {
          console.log("Profile upsert successful!");
        }

        // 2. Check if they have the admin role
        console.log("Checking admin role...");
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle(); // Use maybeSingle to avoid 406 error if zero rows

        if (error) {
           console.error("Failed to fetch admin role:", error);
        }

        setIsAdmin(!!data && !error);
        console.log("Admin check complete. Is Admin?", !!data && !error);
      } catch (error) {
        console.error("Auth sync fatal error:", error);
        setIsAdmin(false);
      } finally {
        setDbLoading(false);
      }
    };

    if (clerkUser && session) {
      console.log("Clerk User and Session are ready. Triggering sync.");
      const fullName = clerkUser.fullName || clerkUser.username || "Anonymous";
      syncProfileAndCheckAdmin(clerkUser.id, fullName);
    } else {
      console.log("Waiting for Clerk User and Session to load...");
      setIsAdmin(false);
    }
  }, [clerkUser, session]);

  return {
    user,
    session: clerkUser ? {} : null, // Mocks session existence
    isAdmin,
    isLoading: !isClerkLoaded || dbLoading,
    signOut: () => clerkSignOut(),
  };
};
