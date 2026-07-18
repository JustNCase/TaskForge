-- TaskForge analytics event tracking

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  metadata jsonb default '{}',
  created_at timestamp with time zone default now()
);

alter table analytics_events enable row level security;

-- Users can view their own events
create policy "Users can view own analytics"
  on analytics_events for select
  using (auth.uid() = user_id);

-- Users can insert their own events
create policy "Users can create analytics"
  on analytics_events for insert
  with check (auth.uid() = user_id);

-- Admins can view all (via service key)
create policy "Service can view all analytics"
  on analytics_events for select
  using (true);

create index idx_analytics_user on analytics_events(user_id);
create index idx_analytics_event on analytics_events(event);
create index idx_analytics_created on analytics_events(created_at);
