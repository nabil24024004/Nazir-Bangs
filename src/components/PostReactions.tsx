import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

interface ReactionCount {
  type: ReactionType;
  count: number;
}

interface PostReactionsProps {
  postId: string;
}

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "like", emoji: "👍", label: "Like" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "haha", emoji: "😂", label: "Haha" },
  { type: "wow", emoji: "😮", label: "Wow" },
  { type: "sad", emoji: "😢", label: "Sad" },
  { type: "angry", emoji: "😠", label: "Angry" },
];

export const PostReactions = ({ postId }: PostReactionsProps) => {
  const [reactionCounts, setReactionCounts] = useState<ReactionCount[]>([]);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const { user } = useAuth();

  const visitorId = user?.id ?? null;

  const fetchReactions = useCallback(async () => {
    const { data: reactions, error } = await supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId);

    if (error) {
      console.error("Error fetching reactions:", error);
      return;
    }

    // Count reactions by type
    const counts: Record<ReactionType, number> = {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    };

    reactions?.forEach((r) => {
      counts[r.reaction_type as ReactionType]++;
    });

    setReactionCounts(
      Object.entries(counts)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => ({ type: type as ReactionType, count }))
    );
    if (!visitorId) {
      setUserReaction(null);
      return;
    }

    const { data: ownReaction, error: ownReactionError } = await supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .eq("visitor_id", visitorId)
      .maybeSingle();

    if (ownReactionError) {
      console.error("Error fetching your reaction:", ownReactionError);
      return;
    }

    setUserReaction((ownReaction?.reaction_type as ReactionType) ?? null);
  }, [postId, visitorId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const handleReaction = async (reactionType: ReactionType) => {
    if (isLoading) return;
    if (!visitorId) {
      toast.error("Sign in to react");
      return;
    }

    setIsLoading(true);
    setShowPicker(false);

    try {
      if (userReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", postId)
          .eq("visitor_id", visitorId);

        if (error) throw error;
        setUserReaction(null);
        toast.success("Reaction removed");
      } else if (userReaction) {
        // Update existing reaction
        const { error } = await supabase
          .from("post_reactions")
          .update({ reaction_type: reactionType })
          .eq("post_id", postId)
          .eq("visitor_id", visitorId);

        if (error) throw error;
        setUserReaction(reactionType);
        toast.success("Reaction updated");
      } else {
        // Add new reaction
        const { error } = await supabase
          .from("post_reactions")
          .insert({
            post_id: postId,
            reaction_type: reactionType,
            visitor_id: visitorId,
          });

        if (error) throw error;
        setUserReaction(reactionType);
        toast.success("Reaction added");
      }

      await fetchReactions();
    } catch (error) {
      console.error("Error handling reaction:", error);
      toast.error("Failed to update reaction");
    } finally {
      setIsLoading(false);
    }
  };

  const totalReactions = reactionCounts.reduce((sum, r) => sum + r.count, 0);
  const currentUserEmoji = userReaction
    ? REACTIONS.find((r) => r.type === userReaction)?.emoji
    : null;

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Reaction button with picker */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            onMouseEnter={() => setShowPicker(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200",
              userReaction
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border hover:bg-accent hover:border-accent"
            )}
            disabled={isLoading}
          >
            <span className="text-lg">{currentUserEmoji || "👍"}</span>
            <span className="text-sm font-medium">
              {userReaction ? "Reacted" : "React"}
            </span>
          </button>

          {/* Reaction picker */}
          {showPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-card border border-border rounded-full shadow-lg z-10"
              onMouseLeave={() => setShowPicker(false)}
            >
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  className={cn(
                    "text-2xl p-2 rounded-full transition-transform hover:scale-125 hover:bg-accent",
                    userReaction === reaction.type && "bg-primary/20"
                  )}
                  title={reaction.label}
                  disabled={isLoading}
                >
                  {reaction.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reaction summary */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {reactionCounts.slice(0, 3).map((rc) => (
                <span
                  key={rc.type}
                  className="text-lg bg-card border border-border rounded-full w-7 h-7 flex items-center justify-center"
                >
                  {REACTIONS.find((r) => r.type === rc.type)?.emoji}
                </span>
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
