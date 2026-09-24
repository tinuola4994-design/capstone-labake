import { supabase } from "@/lib/supabase";
import type {
  AlertStatus,
  Customer,
  FeedbackWithRelations,
  Location,
  RoutingStatus,
} from "@/lib/types";

const feedbackSelect = `
  *,
  customers (*),
  locations (*)
`;

export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function fetchFeedback(filters?: {
  locationId?: string | null;
  routingStatus?: string | null;
  alertStatus?: string | null;
  search?: string | null;
}): Promise<FeedbackWithRelations[]> {
  let query = supabase
    .from("feedback")
    .select(feedbackSelect)
    .order("created_at", { ascending: false });

  if (filters?.locationId) {
    query = query.eq("location_id", filters.locationId);
  }
  if (filters?.routingStatus) {
    query = query.eq("routing_status", filters.routingStatus as RoutingStatus);
  }
  if (filters?.alertStatus && filters.alertStatus !== "all") {
    query = query.eq("alert_status", filters.alertStatus as AlertStatus);
  }

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as FeedbackWithRelations[];

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        row.customers.name.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q) ||
        row.locations.name.toLowerCase().includes(q) ||
        (row.job?.toLowerCase().includes(q) ?? false) ||
        (row.reason?.toLowerCase().includes(q) ?? false),
    );
  }

  return rows;
}

export async function markDraftSent(id: string) {
  const { data, error } = await supabase
    .from("feedback")
    .update({ draft_sent: true })
    .eq("id", id)
    .select(feedbackSelect)
    .single();

  if (error) throw error;
  return data as FeedbackWithRelations;
}

export async function markAlertHandled(id: string) {
  const { data, error } = await supabase
    .from("feedback")
    .update({ alert_status: "acted_on" as AlertStatus })
    .eq("id", id)
    .select(feedbackSelect)
    .single();

  if (error) throw error;
  return data as FeedbackWithRelations;
}
