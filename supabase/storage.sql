-- ============================================================
-- EEIC E-Certificate — Supabase Storage Setup
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Create buckets
insert into storage.buckets (id, name, public)
values
  ('fonts',        'fonts',        false),
  ('templates',    'templates',    true),   -- public: needed for image previews
  ('signatures',   'signatures',  false),
  ('attachments',  'attachments',  false)
on conflict (id) do nothing;

-- ============================================================
-- Storage Policies
-- ============================================================

-- FONTS bucket
create policy "Authenticated can read fonts"
  on storage.objects for select
  using (bucket_id = 'fonts' and auth.role() = 'authenticated');

create policy "Authenticated can upload fonts"
  on storage.objects for insert
  with check (bucket_id = 'fonts' and auth.role() = 'authenticated');

create policy "Authenticated can delete fonts"
  on storage.objects for delete
  using (bucket_id = 'fonts' and auth.role() = 'authenticated');

-- TEMPLATES bucket (public read so preview images work without auth)
create policy "Public can read templates"
  on storage.objects for select
  using (bucket_id = 'templates');

create policy "Authenticated can upload templates"
  on storage.objects for insert
  with check (bucket_id = 'templates' and auth.role() = 'authenticated');

create policy "Authenticated can delete templates"
  on storage.objects for delete
  using (bucket_id = 'templates' and auth.role() = 'authenticated');

-- SIGNATURES bucket
create policy "Authenticated can read signatures"
  on storage.objects for select
  using (bucket_id = 'signatures' and auth.role() = 'authenticated');

create policy "Authenticated can upload signatures"
  on storage.objects for insert
  with check (bucket_id = 'signatures' and auth.role() = 'authenticated');

create policy "Authenticated can delete signatures"
  on storage.objects for delete
  using (bucket_id = 'signatures' and auth.role() = 'authenticated');

-- ATTACHMENTS bucket
create policy "Authenticated can read attachments"
  on storage.objects for select
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "Authenticated can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "Authenticated can delete attachments"
  on storage.objects for delete
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
