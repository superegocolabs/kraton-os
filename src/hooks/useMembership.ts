import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MembershipData {
  is_active: boolean;
  plan_name: string;
  expires_at: string | null;
  granted_at: string | null;
}

export function useMembership(userId: string | undefined) {
  const { data: membership, isLoading } = useQuery({
    queryKey: ["membership", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const isMember =
    !!membership?.is_active &&
    (!membership.expires_at || new Date(membership.expires_at) > new Date());

  return { membership, isMember, isLoading };
}

export const FREE_LIMITS = {
  projects: 1,
  clients: 1,
  boards: 3,
};
