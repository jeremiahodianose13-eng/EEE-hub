create table if not exists public.materials (
  id text primary key,
  title text not null,
  description text not null,
  level text not null default '200',
  semester text not null default 'first',
  course text not null default 'EEE101',
  file text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  title text not null,
  description text not null,
  level text not null default '200',
  semester text not null default 'first',
  file text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id text primary key check (id = 'main'),
  password_hash text not null
);

alter table public.materials enable row level security;
alter table public.questions enable row level security;
alter table public.admin_settings enable row level security;

grant all on table public.materials to service_role;
grant all on table public.questions to service_role;
grant all on table public.admin_settings to service_role;

insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = excluded.public;