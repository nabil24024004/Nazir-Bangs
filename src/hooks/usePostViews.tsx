import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const getVisitorId = () => {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
};

export function usePostViews(postId: string) {
  const [viewCount, setViewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViewCount = async () => {
      const { count, error } = await supabase
        .from("post_views")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      if (!error && count !== null) {
        setViewCount(count);
      }
      setIsLoading(false);
    };

    fetchViewCount();
  }, [postId]);

  return { viewCount, isLoading };
}

export function useTrackView(postId: string) {
  useEffect(() => {
    const trackView = async () => {
      const visitorId = getVisitorId();
      
      // Try to insert - will fail silently if already viewed (unique constraint)
      await supabase
        .from("post_views")
        .upsert(
          { post_id: postId, visitor_id: visitorId },
          { onConflict: "post_id,visitor_id", ignoreDuplicates: true }
        );
    };

    trackView();
  }, [postId]);
}
