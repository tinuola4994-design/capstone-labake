import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchCustomers, fetchFeedback, fetchLocations } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { DashboardFilters } from "@/hooks/use-dashboard-filters";

export const feedbackKeys = {
  all: ["feedback"] as const,
  list: (filters: DashboardFilters) => ["feedback", filters] as const,
  locations: ["locations"] as const,
  customers: ["customers"] as const,
};

export function useLocations() {
  return useQuery({
    queryKey: feedbackKeys.locations,
    queryFn: fetchLocations,
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: feedbackKeys.customers,
    queryFn: fetchCustomers,
  });
}

export function useFeedback(filters: DashboardFilters) {
  return useQuery({
    queryKey: feedbackKeys.list(filters),
    queryFn: () =>
      fetchFeedback({
        locationId: filters.locationId,
        routingStatus: filters.routingStatus,
        alertStatus: filters.alertStatus,
        search: filters.search,
      }),
  });
}

export function useFeedbackRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("feedback-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        () => {
          void queryClient.invalidateQueries({ queryKey: feedbackKeys.all });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function applyClientFilters(
  rows: Awaited<ReturnType<typeof fetchFeedback>>,
  filters: DashboardFilters,
) {
  let result = rows;

  if (filters.sentimentBucket === "positive") {
    result = result.filter((r) => r.sentiment_score > 0);
  } else if (filters.sentimentBucket === "negative") {
    result = result.filter((r) => r.sentiment_score < 0);
  }

  return result;
}
