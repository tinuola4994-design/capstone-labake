# Reputation & Feedback Intelligence — Manager Dashboard

Management dashboard for a multi-location car care chain. Reads scored feedback from **Supabase** (written by n8n) and lets staff:

- Mark a visit complete (optional demo trigger → n8n; automation may use an n8n Form instead)
- View all feedback with sentiment/severity scores and routing status
- Copy positive reviews from the **Ready to post** queue
- Review AI draft replies in the **Negative queue** and mark them sent (human-only)
- Act on **manager alerts** for severe / repeat-negative cases
- Filter by location, status, and search

Customers submit feedback via **n8n** (n8n Form recommended) or our optional public page (`/give-feedback`). The dashboard only needs rows in Supabase.

## Stack

- Vite + React + TypeScript + Tailwind + shadcn-style UI
- Supabase Auth + Postgres + Realtime
- TanStack Query
- n8n webhooks (job completed + feedback submitted)

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/seed.sql`](supabase/seed.sql).
   - If you already ran an older schema without `customers.email`, run [`supabase/migration_add_customer_email.sql`](supabase/migration_add_customer_email.sql) instead of recreating tables, then re-run seed if needed.
3. **Database → Publications**: enable Realtime for the `feedback` table (or run [`supabase/realtime.sql`](supabase/realtime.sql)).
4. **Authentication → Users → Add user**:
   - Email: `manager@demo.local`
   - Password: `DemoManager123!`
5. Copy env vars:

```bash
cp .env.example .env.local
```

Fill in:

| Variable                             | Purpose                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`                  | Supabase project URL                                           |
| `VITE_SUPABASE_ANON_KEY`             | Supabase anon key                                              |
| `VITE_N8N_JOB_COMPLETED_WEBHOOK_URL` | n8n Workflow A webhook                                         |
| `VITE_N8N_FEEDBACK_WEBHOOK_URL`      | n8n Workflow B webhook                                         |
| `VITE_PUBLIC_APP_URL`                | Public base URL for email links (e.g. `http://localhost:5173`) |

6. Install and run:

```bash
npm install
npm run dev
```

## Demo seed paths

| Customer      | Email            | Path                | Routing                        |
| ------------- | ---------------- | ------------------- | ------------------------------ |
| John Adeyemi  | john@demo.local  | Positive            | Ready to post                  |
| Sarah Okonkwo | sarah@demo.local | First-time negative | Private queue + draft          |
| Mike Bello    | mike@demo.local  | Repeat negative     | Escalated + open alert + draft |
| Ada Nwosu     | ada@demo.local   | Unclear             | Needs review                   |

## End-to-end demo flow

**Preferred (automation-owned intake):**

```text
n8n Form (job completed) → email with link → n8n Form (feedback)
  → AI + route → Supabase → Dashboard (Realtime)
```

**Optional (our frontend as webhook adapters):**

```text
Staff → /complete-job → n8n (Workflow A) → email with link
  → Customer → /give-feedback → n8n (Workflow B) → AI + route → Supabase
  → Dashboard updates (Realtime)
```

Full field lists, enums, and Supabase insert shape: **[docs/N8N_HANDOFF.md](docs/N8N_HANDOFF.md)** (give this to the automation engineer).

### Staff: Complete job (`/complete-job`) — optional

Authenticated demo page. Selects customer (or new), location, job → **Mark job complete**.

You can skip this page entirely and use an **n8n Form** with the same fields (`customer_name`, `customer_email`, `customer_phone`, `location_id`, `job`).

If using this page, it POSTs to `VITE_N8N_JOB_COMPLETED_WEBHOOK_URL`:

```json
{
  "customer_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "customer_name": "John Adeyemi",
  "customer_email": "john@demo.local",
  "customer_phone": "08011110001",
  "location_id": "11111111-1111-1111-1111-111111111111",
  "location_name": "Ibadan",
  "job": "Full service & oil change"
}
```

For a brand-new customer, `customer_id` is `null`. n8n should find/create the customer by email, then send the feedback email.

### Customer: Give feedback (`/give-feedback`) — optional

Public demo page. Prefer an **n8n Form** linked from the email when automation owns intake.

If using this page, link:

```text
{VITE_PUBLIC_APP_URL}/give-feedback?customer_id=...&location_id=...&job=Full%20service%20%26%20oil%20change
```

Optional display params: `customer_name`, `location_name`.

POSTs to `VITE_N8N_FEEDBACK_WEBHOOK_URL`:

```json
{
  "customer_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "location_id": "11111111-1111-1111-1111-111111111111",
  "job": "Full service & oil change",
  "message": "The service was excellent."
}
```

The frontend does **not** score or route. n8n owns AI, history checks, drafts, and inserts into `feedback`.

## n8n contract

See **[docs/N8N_HANDOFF.md](docs/N8N_HANDOFF.md)** for Form field names, routing rules, and the canonical `feedback` insert.

### Workflow A — Job completed

1. Trigger: n8n Form **or** webhook JSON above.
2. Find customer in Supabase by `customer_email` (or use `customer_id`); create if missing.
3. Send email (Resend / Gmail) with a feedback link to an **n8n Form** or `/give-feedback?...`.

Suggested email subject: `How was your visit to our {location_name} branch?`

### Workflow B — Feedback submitted

1. Trigger: n8n Form **or** webhook JSON above.
2. Load customer + prior negative feedback (repeat check).
3. AI: sentiment score, severity, confidence, reason.
4. Route: `ready_to_post` | `private_queue` | `escalated` | `needs_review`.
5. For negatives: generate AI draft response (do **not** send to the customer automatically).
6. Insert into `feedback` (service role).
7. If escalated / open alert: email the manager.

The dashboard only **updates** `draft_sent` and `alert_status`.
