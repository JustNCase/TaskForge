-- TaskForge achievements and notifications

create table if not exists achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text default '',
  created_at timestamp with time zone default now()
);

create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at timestamp with time zone default now(),
  unique (user_id, achievement_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table notifications enable row level security;

-- Achievements are viewable by all
create policy "Anyone can view achievements"
  on achievements for select
  using (true);

-- Users can view their own achievements
create policy "Users can view own achievements"
  on user_achievements for select
  using (auth.uid() = user_id);

create policy "Users can insert own achievements"
  on user_achievements for insert
  with check (auth.uid() = user_id);

-- Notifications
create policy "Users can view own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can create own notifications"
  on notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create index idx_user_achievements_user on user_achievements(user_id);
create index idx_notifications_user on notifications(user_id);

-- Seed achievements
insert into achievements (id, title, description, icon) values
  ('first-task', 'First Task Complete', 'Complete your first task', '🎯'),
  ('task-master', 'Task Master', 'Complete 50 tasks', '👑'),
  ('level-5', 'Getting Started', 'Reach level 5', '⭐'),
  ('level-10', 'Power User', 'Reach level 10', '🔥'),
  ('shopper', 'Market Shopper', 'Buy your first marketplace item', '🛍️'),
  ('streak-7', 'Weekly Warrior', 'Complete tasks 7 days in a row', '📅')
on conflict (id) do nothing;
