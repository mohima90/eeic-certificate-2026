-- ============================================================
-- EEIC E-Certificate — Supabase Schema
-- Run this in Supabase SQL Editor (Settings > SQL Editor)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- User profiles (extends Supabase Auth users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Students
create table if not exists students (
  id bigserial primary key,
  name text not null,
  email text not null,
  uuid text not null,         -- national ID or passport
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_email_unique unique (email),
  constraint students_uuid_unique unique (uuid),
  constraint students_phone_unique unique (phone)
);

-- Courses
create table if not exists courses (
  id bigserial primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_name_unique unique (name)
);

-- Groups
create table if not exists groups (
  id bigserial primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_name_unique unique (name)
);

-- Templates
create table if not exists templates (
  id bigserial primary key,
  name text not null,
  image text not null,        -- Supabase Storage path: templates/{filename}
  options jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_name_unique unique (name)
);

-- Fonts
create table if not exists fonts (
  id bigserial primary key,
  name text not null,         -- friendly display name
  path text not null,         -- Supabase Storage path: fonts/{filename}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Attachments (generated PDF certificates)
create table if not exists attachments (
  id bigserial primary key,
  student_id bigint references students(id) on delete cascade,
  path text not null,         -- Supabase Storage path: attachments/{filename}
  student_name text,
  course_id bigint references courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enrollments (student enrolled in course within a group)
create table if not exists enrollments (
  id bigserial primary key,
  group_id bigint not null references groups(id) on delete cascade,
  student_id bigint not null references students(id) on delete cascade,
  course_id bigint not null references courses(id) on delete cascade,
  student_name text not null default '',  -- name used on the certificate
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enrollment Templates (assigns a template to a group)
create table if not exists enrollment_templates (
  id bigserial primary key,
  template_id bigint not null references templates(id) on delete cascade,
  group_id bigint not null references groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_enrollments_group_id    on enrollments(group_id);
create index if not exists idx_enrollments_student_id  on enrollments(student_id);
create index if not exists idx_enrollments_course_id   on enrollments(course_id);
create index if not exists idx_attachments_student_id  on attachments(student_id);
create index if not exists idx_attachments_course_id   on attachments(course_id);
create index if not exists idx_et_group_id             on enrollment_templates(group_id);
create index if not exists idx_et_template_id          on enrollment_templates(template_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at          before update on profiles          for each row execute procedure handle_updated_at();
create trigger students_updated_at          before update on students          for each row execute procedure handle_updated_at();
create trigger courses_updated_at           before update on courses           for each row execute procedure handle_updated_at();
create trigger groups_updated_at            before update on groups            for each row execute procedure handle_updated_at();
create trigger templates_updated_at         before update on templates         for each row execute procedure handle_updated_at();
create trigger fonts_updated_at             before update on fonts             for each row execute procedure handle_updated_at();
create trigger attachments_updated_at       before update on attachments       for each row execute procedure handle_updated_at();
create trigger enrollments_updated_at       before update on enrollments       for each row execute procedure handle_updated_at();
create trigger enrollment_templates_updated before update on enrollment_templates for each row execute procedure handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles            enable row level security;
alter table students            enable row level security;
alter table courses             enable row level security;
alter table groups              enable row level security;
alter table templates           enable row level security;
alter table fonts               enable row level security;
alter table attachments         enable row level security;
alter table enrollments         enable row level security;
alter table enrollment_templates enable row level security;

-- Helper: is current user an admin?
create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- profiles
create policy "Own profile readable" on profiles for select using (auth.uid() = id);
create policy "Admin full access to profiles" on profiles for all using (is_admin());

-- students
create policy "Authenticated can read students"  on students for select using (auth.role() = 'authenticated');
create policy "Admin can manage students"        on students for all    using (is_admin());

-- courses
create policy "Authenticated can read courses"  on courses for select using (auth.role() = 'authenticated');
create policy "Admin can manage courses"        on courses for all    using (is_admin());

-- groups
create policy "Authenticated can read groups"   on groups for select using (auth.role() = 'authenticated');
create policy "Admin can manage groups"         on groups for all    using (is_admin());

-- templates
create policy "Authenticated can read templates" on templates for select using (auth.role() = 'authenticated');
create policy "Admin can manage templates"       on templates for all    using (is_admin());

-- fonts
create policy "Authenticated can read fonts"    on fonts for select using (auth.role() = 'authenticated');
create policy "Admin can manage fonts"          on fonts for all    using (is_admin());

-- attachments
create policy "Authenticated can read attachments" on attachments for select using (auth.role() = 'authenticated');
create policy "Admin can manage attachments"       on attachments for all    using (is_admin());

-- enrollments
create policy "Authenticated can read enrollments"  on enrollments for select using (auth.role() = 'authenticated');
create policy "Admin can manage enrollments"        on enrollments for all    using (is_admin());

-- enrollment_templates
create policy "Authenticated can read enrollment_templates" on enrollment_templates for select using (auth.role() = 'authenticated');
create policy "Admin can manage enrollment_templates"       on enrollment_templates for all    using (is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- (Run via Supabase Dashboard > Storage > New Bucket, or use API)
-- ============================================================

-- insert into storage.buckets (id, name, public) values ('fonts',       'fonts',       false);
-- insert into storage.buckets (id, name, public) values ('templates',   'templates',   false);
-- insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false);
-- insert into storage.buckets (id, name, public) values ('signatures',  'signatures',  false);

-- Storage policies (admin upload, authenticated read)
-- create policy "Admin can upload fonts"
--   on storage.objects for insert
--   with check (bucket_id = 'fonts' and is_admin());
-- ... (repeat pattern for all buckets)
