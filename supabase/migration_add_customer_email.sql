-- Run this if you already applied the original schema without email.
-- Safe to re-run.

alter table public.customers
  add column if not exists email text;

update public.customers set email = 'john@demo.local'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and (email is null or email = '');

update public.customers set email = 'sarah@demo.local'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and (email is null or email = '');

update public.customers set email = 'mike@demo.local'
  where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and (email is null or email = '');

update public.customers set email = 'ada@demo.local'
  where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' and (email is null or email = '');

update public.customers set email = 'chidi@demo.local'
  where id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' and (email is null or email = '');

-- Any leftover rows without email get a unique placeholder
update public.customers
set email = 'customer+' || left(id::text, 8) || '@demo.local'
where email is null or email = '';

alter table public.customers
  alter column email set not null;

create unique index if not exists customers_email_key
  on public.customers (email);
