create table if not exists economy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  xp integer default 0,
  coins integer default 0,
  level integer default 1,
  updated_at timestamp default now()
);
