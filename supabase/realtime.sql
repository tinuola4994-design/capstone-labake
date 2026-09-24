-- Optional: enable Realtime for live dashboard updates when n8n inserts feedback.
-- Run in SQL Editor if you did not enable the table in the Dashboard UI.

alter publication supabase_realtime add table public.feedback;
