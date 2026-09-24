Yes. The easiest way to think about this project is:

> **n8n is the brain. The dashboard is the screen that shows what the brain is doing.**

The PDF wants the whole process to work from **customer visit → feedback → AI analysis → routing → alert/response → dashboard**.

### 1. The basic flow

```text
Customer visit completed
        ↓
n8n starts the workflow
        ↓
Send feedback request to customer
        ↓
Customer replies
        ↓
n8n receives the reply
        ↓
AI reads the feedback
        ↓
AI gives:
- Sentiment score
- Severity score
- Reason
        ↓
Check customer's previous complaints
        ↓
Decide what to do
   ↙          ↓           ↘
Positive   Negative     Serious/repeat
   ↓          ↓              ↓
Ready to    Private        Alert manager
post queue  queue           immediately
               ↓               ↓
          AI drafts reply   AI drafts reply
               ↓               ↓
              Dashboard shows everything
```

The important thing is that **n8n handles the actual workflow**.

---

# 2. Where does the dashboard come in?

This is the part she may be confused about.

**Don't build the dashboard inside n8n.**

Use something like **Lovable** to build the dashboard UI.

For example:

**Lovable → creates the website/dashboard**

It can look like:

```text
------------------------------------------------
 Reputation Dashboard

 Location: [All Locations ▼]

 Total Feedback     Positive     Negative
     245               180          65

------------------------------------------------
 Recent Feedback

 Customer     Location    Sentiment   Status
 John         Ibadan      +82          Ready to post
 Sarah        Lagos       -45          Private queue
 Mike         Abuja       -91          🚨 Escalated

------------------------------------------------
 Negative Feedback

 "My car was damaged..."

 AI Response:
 "We're sorry about your experience..."

 [Mark as handled]
------------------------------------------------
```

The PDF specifically wants managers to see feedback, location, sentiment, status, positive reviews, negative feedback, AI replies, and open/closed alerts in one place.

---

# 3. So does the dashboard use an n8n webhook?

**Yes, it can. But don't think of the webhook as the dashboard itself.**

Think:

```text
Dashboard
    ↕
API / Webhook
    ↕
n8n
    ↕
Database
```

For a simple capstone, they can do this:

### n8n

Processes the feedback and saves the results into a database.

For example:

```text
Supabase
```

The database stores:

```text
Customer
Location
Feedback
Sentiment
Severity
Status
AI response
Alert status
Date
```

### Dashboard

Lovable builds the frontend.

The dashboard reads the data from Supabase and displays it.

So:

```text
n8n → Supabase → Lovable Dashboard
```

That's probably the simplest setup.

---

# 4. What should n8n actually do?

She can make **one main n8n workflow**.

### Step 1 — Trigger

For the demo, don't overcomplicate the "visit completed" part.

She can use:

**Webhook / Manual Trigger**

Example:

```text
POST /visit-completed
```

with:

```json
{
  "customer": "John",
  "phone": "080...",
  "location": "Ibadan",
  "job": "Car service"
}
```

n8n receives this.

---

### Step 2 — Send feedback request

n8n sends something like:

> Hi John, thanks for visiting us. How was your experience?

For the capstone, this can be simulated with email, WhatsApp, or even a simple form.

The PDF mainly cares that the request is automatic after the visit is complete.

---

### Step 3 — Receive the customer's reply

Another webhook can receive:

```text
"My car service was good but the wait was too long."
```

---

### Step 4 — Send it to AI

Use OpenAI, Claude, Gemini, etc.

Ask the AI to return something structured like:

```json
{
  "sentiment_score": 35,
  "severity_score": 20,
  "sentiment": "negative",
  "reason": "Long waiting time"
}
```

The key is **score**, not simply "positive/negative." That's exactly what the brief asks for.

---

### Step 5 — Check customer history

n8n checks the database:

> Has John complained before?

If **no**:

```text
Negative + low severity
→ Private queue
```

If **yes**:

```text
Previous negative feedback
→ Manager alert
```

The repeat-customer rule is important in the brief.

---

### Step 6 — Generate AI response

For every negative complaint:

```text
Customer complaint
       ↓
AI
       ↓
Draft response
```

Example:

> "We're sorry that you had to wait so long for your service..."

But **n8n must NOT send it automatically**.

A human checks it first.

---

# 5. Then save everything

n8n puts the result into Supabase.

For example:

```text
feedback table

id
customer
location
message
sentiment_score
severity_score
status
ai_response
alert_status
created_at
```

Then Lovable reads that data.

---

# 6. What Lovable is responsible for

Lovable is mainly for the **front end**.

Tell Lovable something like:

> Build a management dashboard for a multi-location car repair company. Show all customer feedback, location, sentiment score, severity, status, AI-generated responses, and manager alerts. Add filters for location and status. Use Supabase as the database.

Then she can improve the design.

The dashboard doesn't need to contain the AI logic.

**n8n = automation**

**AI = analysis**

**Supabase = storage**

**Lovable = dashboard**

That's the easiest mental model.

---

# 7. The final architecture

I'd tell her to build it like this:

```text
                 ┌──────────────┐
                 │   Customer   │
                 └──────┬───────┘
                        │
                  Feedback reply
                        ↓
                 ┌──────────────┐
                 │     n8n      │
                 │   Workflow   │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              ↓                   ↓
          AI Analysis        Customer History
              │                   │
              └─────────┬─────────┘
                        ↓
                   Routing logic
                  /      |       \
                 /       |        \
          Positive    Negative    Serious/
                         |         Repeat
                         ↓            ↓
                    Private queue   Alert
                         |
                    AI response
                         |
                         ↓
                  ┌─────────────┐
                  │  Supabase   │
                  └──────┬──────┘
                         ↓
                  ┌─────────────┐
                  │   Lovable   │
                  │  Dashboard  │
                  └─────────────┘
```

### What she actually needs to build

**1. n8n workflow**

- Trigger visit completion
- Send feedback request
- Receive feedback
- AI scoring
- Check customer history
- Route feedback
- Generate response
- Send manager alert
- Save everything

**2. Supabase**

- Store customers
- Store feedback
- Store scores
- Store responses
- Store status/alerts

**3. Lovable dashboard**

- Overview
- Feedback list
- Positive queue
- Negative queue
- AI responses
- Alerts
- Location filter

**4. Demo 3 cases**

This is very important because the brief explicitly asks them to show:

```text
1. Positive customer
2. First-time negative customer
3. Repeat negative customer
```

and show that each takes a different path.

### One final thing

She **doesn't need to make this a huge real-world system**.

For the capstone, fake/sample customers and simulated feedback are fine. The goal is to prove the **full loop works**. The brief itself says they are not expected to connect to a real public review platform.

So I'd keep the stack simple:

**n8n + OpenAI/Gemini + Supabase + Lovable**

That's enough to demonstrate the whole project.
