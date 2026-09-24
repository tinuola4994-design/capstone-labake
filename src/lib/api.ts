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

export type JobCompletionInput = {
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  location_id: string;
  location_name: string;
  job: string;
};

export type FeedbackSubmissionInput = {
  customer_id: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  location_id: string | null;
  location_name?: string | null;
  job?: string | null;
  message: string;
};

async function findOrCreateCustomer(payload: {
  customer_id: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  feedback_request_sent?: boolean;
}): Promise<string> {
  if (payload.customer_id) return payload.customer_id;

  const customerEmail = (payload.customer_email ?? "").trim().toLowerCase();
  const customerPhone = (payload.customer_phone ?? "").trim();
  const customerName = (payload.customer_name ?? "").trim();

  if (customerEmail) {
    const { data: existingByEmail, error: emailError } = await supabase
      .from("customers")
      .select("id")
      .eq("email", customerEmail)
      .limit(1);

    if (emailError) throw emailError;
    if (existingByEmail && existingByEmail.length > 0) {
      return existingByEmail[0].id as string;
    }
  }

  if (customerPhone) {
    const { data: existingByPhone, error: phoneError } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", customerPhone)
      .limit(1);

    if (phoneError) throw phoneError;
    if (existingByPhone && existingByPhone.length > 0) {
      return existingByPhone[0].id as string;
    }
  }

  if (!customerName || (!customerEmail && !customerPhone)) {
    throw new Error("Customer name and at least one contact method are required.");
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: customerName,
      email: customerEmail || `${Date.now()}@guest.local`,
      phone: customerPhone || `guest-${Date.now()}`,
      location_id: payload.location_id ?? null,
      location_name: payload.location_name?.trim() ?? null,
      feedback_request_sent: payload.feedback_request_sent ?? false,
    })
    .select("id")
    .single();

  if (customerError) throw customerError;
  return customer.id as string;
}

export async function saveJobCompletion(
  payload: JobCompletionInput,
): Promise<{ id: string }> {
  const resolvedCustomerId = await findOrCreateCustomer({
    customer_id: payload.customer_id,
    customer_name: payload.customer_name,
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    location_id: payload.location_id,
    location_name: payload.location_name,
    feedback_request_sent: true,
  });

  const { data, error } = await supabase
    .from("job_completions")
    .insert({
      customer_id: resolvedCustomerId,
      customer_name: payload.customer_name.trim(),
      customer_email: payload.customer_email.trim().toLowerCase(),
      customer_phone: payload.customer_phone.trim(),
      location_id: payload.location_id,
      location_name: payload.location_name.trim(),
      job: payload.job.trim(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function saveFeedbackSubmission(
  payload: FeedbackSubmissionInput,
): Promise<{ id: string }> {
  const resolvedCustomerId = await findOrCreateCustomer({
    customer_id: payload.customer_id,
    customer_name: payload.customer_name ?? "",
    customer_email: payload.customer_email,
    customer_phone: payload.customer_phone,
    location_id: payload.location_id,
    location_name: payload.location_name,
    feedback_request_sent: false,
  });

  const locationId = payload.location_id?.trim();
  const jobText = payload.job?.trim();

  if (!locationId) {
    throw new Error("Location is required before submitting feedback.");
  }
  if (!jobText) {
    throw new Error("Service or job name is required before submitting feedback.");
  }

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      customer_id: resolvedCustomerId,
      location_id: locationId,
      job: jobText,
      message: payload.message.trim(),
      sentiment_score: 0,
      severity_score: 0,
      sentiment_label: "pending",
      reason: null,
      confidence: "high",
      routing_status: "needs_review",
      is_repeat_negative: false,
      ai_draft_response: null,
      draft_sent: false,
      alert_status: "none",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data as { id: string };
}

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
