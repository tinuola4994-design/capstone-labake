export type JobCompletedPayload = {
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  location_id: string;
  location_name: string;
  job: string;
};

export type FeedbackSubmittedPayload = {
  customer_id: string;
  location_id: string;
  job: string;
  message: string;
};

async function postWebhook(
  url: string | undefined,
  body: unknown,
  label: string,
) {
  if (!url || url.includes("your-n8n.example")) {
    throw new Error(
      `${label} webhook URL is not configured. Set it in .env.local and restart the dev server.`,
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${label} webhook failed (${res.status})${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }

  return res;
}

export function postJobCompleted(payload: JobCompletedPayload) {
  return postWebhook(
    import.meta.env.VITE_N8N_JOB_COMPLETED_WEBHOOK_URL as string | undefined,
    payload,
    "Job completed",
  );
}

export function postFeedbackSubmitted(payload: FeedbackSubmittedPayload) {
  return postWebhook(
    import.meta.env.VITE_N8N_FEEDBACK_WEBHOOK_URL as string | undefined,
    payload,
    "Feedback",
  );
}

export function getPublicAppUrl() {
  return (
    (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(
      /\/$/,
      "",
    ) ?? window.location.origin
  );
}
