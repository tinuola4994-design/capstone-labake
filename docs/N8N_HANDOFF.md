# n8n / Automation engineer handoff

This document is the **source of truth** for anyone building workflows in n8n.

The React app is a **management dashboard**. It does not require our frontend forms to work.

```text
Any intake (n8n Form, webhook, POS, email reply, …)
        ↓
       n8n
        ↓
  AI + routing logic
        ↓
     Supabase
        ↓
  Dashboard (Realtime)
```

## What the frontend owns vs what n8n owns

| Concern                                                                             | Owner                                                                            |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Display feedback, scores, queues, alerts                                            | Frontend dashboard                                                               |
| Mark draft sent / mark alert handled                                                | Frontend (updates `draft_sent`, `alert_status`)                                  |
| Job completed intake                                                                | **n8n** (n8n Form, webhook, or our optional `/complete-job` page)                |
| Customer feedback intake                                                            | **n8n** (n8n Form, Typeform, email reply, or our optional `/give-feedback` page) |
| Find/create customer, send email, AI score, route, insert `feedback`, manager alert | **n8n**                                                                          |

**Important:** If you use **n8n Forms**, you do **not** need our `/complete-job` or `/give-feedback` pages. Keep the same **final Supabase row shape** below and the dashboard will just work.

Our frontend pages are optional demo adapters that POST JSON into webhooks. Treat those payloads as _examples of field names_, not as a hard dependency.

---

## Seeded location IDs (use in form dropdowns)

| Name   | `location_id`                          |
| ------ | -------------------------------------- |
| Ibadan | `11111111-1111-1111-1111-111111111111` |
| Lagos  | `22222222-2222-2222-2222-222222222222` |
| Abuja  | `33333333-3333-3333-3333-333333333333` |

## Seeded demo customers (optional shortcuts)

| Name          | `customer_id`                          | Email            | Phone       |
| ------------- | -------------------------------------- | ---------------- | ----------- |
| John Adeyemi  | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | john@demo.local  | 08011110001 |
| Sarah Okonkwo | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` | sarah@demo.local | 08022220002 |
| Mike Bello    | `cccccccc-cccc-cccc-cccc-cccccccccccc` | mike@demo.local  | 08033330003 |
| Ada Nwosu     | `dddddddd-dddd-dddd-dddd-dddddddddddd` | ada@demo.local   | 08044440004 |
| Chidi Eze     | `eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee` | chidi@demo.local | 08055550005 |

For real demos with live email, use **real inboxes** and upsert customers by `email`.

---

## Path A — Use n8n Form for “Job completed” (recommended for automation team)

### Suggested n8n Form fields

| Form field label | Field name (recommended) | Type     | Notes                        |
| ---------------- | ------------------------ | -------- | ---------------------------- |
| Customer name    | `customer_name`          | text     | required                     |
| Customer email   | `customer_email`         | email    | required — lookup/create key |
| Customer phone   | `customer_phone`         | text     | required                     |
| Branch           | `location_id`            | dropdown | values = UUIDs above         |
| Job / service    | `job`                    | text     | required                     |

Optional hidden/default: `customer_id` if you pre-select a known customer.

### Workflow A steps after form submit

1. **Upsert customer** in Supabase by `email` (insert if missing; otherwise reuse `id`).
2. Resolve `location_name` from `location_id` if needed for the email copy.
3. **Send email** asking for feedback.
4. Feedback link can point to:
   - **n8n Form B** (preferred if automation owns intake), **or**
   - Frontend: `{PUBLIC_APP_URL}/give-feedback?customer_id=...&location_id=...&job=...`

Either link is fine. Pass `customer_id`, `location_id`, and `job` into Form B (URL query, hidden fields, or n8n form prefill).

Do **not** insert into `feedback` in Workflow A — only after the customer replies.

---

## Path B — Use n8n Form for “Customer feedback” (recommended for automation team)

### Suggested n8n Form fields

| Form field label | Field name (recommended) | Type           | Notes                               |
| ---------------- | ------------------------ | -------------- | ----------------------------------- |
| Feedback         | `message`                | textarea       | required — customer free text       |
| Customer ID      | `customer_id`            | hidden         | from email link / previous workflow |
| Location ID      | `location_id`            | hidden         | from email link                     |
| Job              | `job`                    | hidden or text | from email link                     |

### Workflow B steps after form submit

1. Load customer by `customer_id`.
2. Query prior negatives:

```sql
select id from public.feedback
where customer_id = :customer_id
  and sentiment_score < 0
limit 1;
```

Set `is_repeat_negative = true` if any row exists (and escalate regardless of mild severity — per brief).

3. AI analysis → structured JSON, for example:

```json
{
  "sentiment_score": -45,
  "severity_score": 20,
  "sentiment_label": "negative",
  "reason": "Long waiting time",
  "confidence": "high"
}
```

Scores: `sentiment_score` −100..100, `severity_score` 0..100, `confidence` `high` | `low`.

4. Routing rules:

| Condition                              | `routing_status` | `alert_status` | Draft? |
| -------------------------------------- | ---------------- | -------------- | ------ |
| `confidence = low` or unclear          | `needs_review`   | `none`         | no     |
| Positive (e.g. score > 0)              | `ready_to_post`  | `none`         | no     |
| Negative, first time, lower severity   | `private_queue`  | `none`         | yes    |
| Negative + repeat **or** high severity | `escalated`      | `open`         | yes    |

5. For negatives, generate `ai_draft_response` (personalized). **Do not email it to the customer automatically.**

6. **Insert** into `public.feedback` with the service role key (bypasses RLS).

7. If `alert_status = open`, email a manager.

---

## Canonical Supabase insert (`feedback`)

n8n must write rows that match this shape (column names matter):

```json
{
  "customer_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "location_id": "11111111-1111-1111-1111-111111111111",
  "job": "Full service & oil change",
  "message": "The service was excellent but the wait was long.",
  "sentiment_score": -45,
  "severity_score": 20,
  "sentiment_label": "negative",
  "reason": "Long waiting time",
  "confidence": "high",
  "routing_status": "private_queue",
  "is_repeat_negative": false,
  "ai_draft_response": "Dear Sarah, we're sorry about the wait…",
  "draft_sent": false,
  "alert_status": "none"
}
```

Allowed enums:

- `routing_status`: `ready_to_post` | `private_queue` | `escalated` | `needs_review`
- `alert_status`: `none` | `open` | `acted_on`
- `confidence`: `high` | `low`

### Customer upsert example

```json
{
  "name": "John Adeyemi",
  "email": "john@example.com",
  "phone": "08011110001"
}
```

Unique on `email` and `phone`. Prefer match-by-email for returning customers.

---

## Optional Path C — Frontend still calls your webhooks

If you keep our pages temporarily:

| Frontend page    | Env var                              | When                   |
| ---------------- | ------------------------------------ | ---------------------- |
| `/complete-job`  | `VITE_N8N_JOB_COMPLETED_WEBHOOK_URL` | Staff marks visit done |
| `/give-feedback` | `VITE_N8N_FEEDBACK_WEBHOOK_URL`      | Customer submits text  |

Those webhooks should run the **same** Workflow A / B logic as the n8n Form triggers. Prefer one shared sub-workflow so Form and Webhook stay in sync.

Example job-completed body from frontend:

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

Example feedback body from frontend:

```json
{
  "customer_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "location_id": "11111111-1111-1111-1111-111111111111",
  "job": "Full service & oil change",
  "message": "The service was excellent."
}
```

---

## Auth / keys for Supabase from n8n

- Use the **service role** key in n8n credentials for inserts/upserts (never put it in the Vite frontend).
- Dashboard uses the **anon** key + logged-in manager; RLS allows `select`/`update` only on `feedback` for authenticated users.
- Enable **Realtime** on `public.feedback` so the dashboard refreshes when n8n inserts.

---

## Demo checklist (three paths the brief requires)

Show that these end up as **different** dashboard rows:

1. Positive → `ready_to_post`
2. First-time negative → `private_queue` + draft, `alert_status = none`
3. Repeat negative → `escalated` + draft + `alert_status = open` + `is_repeat_negative = true`

Seed data already includes examples; new live submissions via n8n Forms should follow the same routing rules.
