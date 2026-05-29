import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

export type SubscriptionStatus = "free" | "active" | "canceled" | "past_due" | null;

interface Profile {
  subscription_status: SubscriptionStatus;
  subscription_tier: string;
}

interface UseProfileReturn {
  subscriptionStatus: SubscriptionStatus;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useProfile(userId: string | undefined): UseProfileReturn {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) {
      setSubscriptionStatus(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_tier")
      .eq("id", userId)
      .single<Profile>();

    setSubscriptionStatus((data?.subscription_status as SubscriptionStatus) ?? "free");
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { subscriptionStatus, loading, refetch: fetch };
}
