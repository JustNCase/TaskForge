-- TaskForge authentication foundation
-- Links application data to Supabase Auth users

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamp with time zone default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  difficulty integer default 1,
  reward integer default 10,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists economy (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer default 0,
  coins integer default 0,
  level integer default 1,
  updated_at timestamp with time zone default now()
);
