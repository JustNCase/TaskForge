create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  status text default 'pending',
  xp_reward integer default 50,
  coin_reward integer default 25,
  created_at timestamp default now()
);
