-- Seed data for the three required demo paths + one needs_review case.
-- Run AFTER schema.sql.
--
-- DEMO MANAGER ACCOUNT (create in Supabase Auth → Users → Add user):
--   Email:    manager@demo.local
--   Password: DemoManager123!
-- Then sign in to the dashboard with those credentials.

-- Clear existing demo data (safe for fresh projects)
truncate table public.feedback restart identity cascade;
truncate table public.customers restart identity cascade;
truncate table public.locations restart identity cascade;

-- Locations
insert into public.locations (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Ibadan'),
  ('22222222-2222-2222-2222-222222222222', 'Lagos'),
  ('33333333-3333-3333-3333-333333333333', 'Abuja');

-- Customers
insert into public.customers (id, name, phone, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'John Adeyemi', '08011110001', 'john@demo.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sarah Okonkwo', '08022220002', 'sarah@demo.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mike Bello', '08033330003', 'mike@demo.local'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Ada Nwosu', '08044440004', 'ada@demo.local'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Chidi Eze', '08055550005', 'chidi@demo.local');

-- 1) POSITIVE → ready_to_post (John, Ibadan)
insert into public.feedback (
  id, customer_id, location_id, job, message,
  sentiment_score, severity_score, sentiment_label, reason, confidence,
  routing_status, is_repeat_negative, ai_draft_response, draft_sent, alert_status, created_at
) values (
  'f0000001-0001-0001-0001-000000000001',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Full service & oil change',
  'Excellent service! The team was professional and my car feels brand new. Highly recommend the Ibadan branch.',
  82, 0, 'positive', 'Strong praise for service quality and professionalism', 'high',
  'ready_to_post', false, null, false, 'none',
  now() - interval '2 hours'
);

-- Prior negative for Mike (so the next one is a repeat)
insert into public.feedback (
  id, customer_id, location_id, job, message,
  sentiment_score, severity_score, sentiment_label, reason, confidence,
  routing_status, is_repeat_negative, ai_draft_response, draft_sent, alert_status, created_at
) values (
  'f0000002-0002-0002-0002-000000000002',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'Brake pad replacement',
  'The wait was longer than promised and nobody updated me.',
  -40, 25, 'negative', 'Long wait and poor communication', 'high',
  'private_queue', false,
  'Dear Mike, we are sorry you had to wait longer than expected without an update. We are reviewing how we keep customers informed during jobs and would like to make this right. — Management',
  true, 'acted_on',
  now() - interval '14 days'
);

-- 2) FIRST-TIME NEGATIVE → private_queue (Sarah, Lagos)
insert into public.feedback (
  id, customer_id, location_id, job, message,
  sentiment_score, severity_score, sentiment_label, reason, confidence,
  routing_status, is_repeat_negative, ai_draft_response, draft_sent, alert_status, created_at
) values (
  'f0000003-0003-0003-0003-000000000003',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'Car wash & detailing',
  'It was fine, but a bit slow. I waited almost an hour for a simple wash.',
  -45, 20, 'negative', 'Mild dissatisfaction about wait time', 'high',
  'private_queue', false,
  'Dear Sarah, thank you for sharing your feedback about the wait at our Lagos branch. An hour for a wash is longer than we aim for, and we are looking at how we schedule detailing slots so customers are not kept waiting. We appreciate you giving us the chance to improve. — Management',
  false, 'none',
  now() - interval '45 minutes'
);

-- 3) REPEAT NEGATIVE → escalated + open alert (Mike, Abuja)
insert into public.feedback (
  id, customer_id, location_id, job, message,
  sentiment_score, severity_score, sentiment_label, reason, confidence,
  routing_status, is_repeat_negative, ai_draft_response, draft_sent, alert_status, created_at
) values (
  'f0000004-0004-0004-0004-000000000004',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'Engine diagnostic',
  'You people ruined my car and wasted my whole day. This is the second time I am complaining and nothing changes.',
  -91, 88, 'negative', 'Severe complaint about damaged vehicle and wasted time; repeat customer', 'high',
  'escalated', true,
  'Dear Mike, we are truly sorry that your experience with the engine diagnostic left your car in worse condition and cost you a full day. We see this is the second time you have raised a concern with us, and a manager will contact you today to arrange inspection and a resolution. Your trust matters to us. — Management',
  false, 'open',
  now() - interval '20 minutes'
);

-- 4) UNCLEAR → needs_review (Ada, Lagos)
insert into public.feedback (
  id, customer_id, location_id, job, message,
  sentiment_score, severity_score, sentiment_label, reason, confidence,
  routing_status, is_repeat_negative, ai_draft_response, draft_sent, alert_status, created_at
) values (
  'f0000005-0005-0005-0005-000000000005',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '22222222-2222-2222-2222-222222222222',
  'Tyre rotation',
  'hmm idk maybe? same as last time whatever',
  0, 0, 'unclear', 'Message too vague to score confidently', 'low',
  'needs_review', false, null, false, 'none',
  now() - interval '10 minutes'
);

-- Extra positive for chart variety (Chidi, Abuja)
insert into public.feedback (
  id, customer_id, location_id, job, message,
  sentiment_score, severity_score, sentiment_label, reason, confidence,
  routing_status, is_repeat_negative, ai_draft_response, draft_sent, alert_status, created_at
) values (
  'f0000006-0006-0006-0006-000000000006',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '33333333-3333-3333-3333-333333333333',
  'AC recharge',
  'Quick turnaround and fair pricing. Will come back.',
  70, 0, 'positive', 'Positive about speed and pricing', 'high',
  'ready_to_post', false, null, false, 'none',
  now() - interval '5 hours'
);
