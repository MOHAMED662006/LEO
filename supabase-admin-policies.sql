-- NEXORA Admin security policies
-- 1) Replace admin@example.com with the exact email you will use for the admin login.
-- 2) Disable public sign-ups in Supabase Authentication settings.
-- 3) Create the admin user yourself from Supabase Dashboard > Authentication > Users.
-- Never put a service_role / secret key in frontend code.

alter table public.contact_requests enable row level security;

-- Public visitors can submit a contact request, but cannot read or delete requests.
drop policy if exists "Allow public contact submissions" on public.contact_requests;
create policy "Allow public contact submissions"
on public.contact_requests
for insert
to anon
with check (true);

-- Only the designated admin email can view requests.
drop policy if exists "Admin can read contact requests" on public.contact_requests;
create policy "Admin can read contact requests"
on public.contact_requests
for select
to authenticated
using ((auth.jwt() ->> 'email') = 'maassyy4@gmail.com');

-- Only the designated admin email can delete requests.
drop policy if exists "Admin can delete contact requests" on public.contact_requests;
create policy "Admin can delete contact requests"
on public.contact_requests
for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'maassyy4@gmail.com');
