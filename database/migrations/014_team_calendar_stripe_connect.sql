-- TaskForge team management, scheduling, and Stripe Connect

-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table teams enable row level security;

create policy "Owners can view their teams"
  on teams for select
  using (auth.uid() = owner_id);

create policy "Owners can create teams"
  on teams for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their teams"
  on teams for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their teams"
  on teams for delete
  using (auth.uid() = owner_id);

-- Team members
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text default 'pending' check (status in ('pending', 'active', 'removed')),
  hourly_rate integer default 0,
  invited_by uuid references auth.users(id),
  joined_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique (team_id, email)
);

alter table team_members enable row level security;

create policy "Team owners and admins can view members"
  on team_members for select
  using (
    exists (select 1 from teams where id = team_id and owner_id = auth.uid())
    or exists (select 1 from team_members tm where tm.team_id = team_members.team_id and tm.user_id = auth.uid() and tm.status = 'active')
  );

create policy "Team owners and admins can manage members"
  on team_members for insert
  with check (exists (select 1 from teams where id = team_id and owner_id = auth.uid()));

create policy "Team owners and admins can update members"
  on team_members for update
  using (exists (select 1 from teams where id = team_id and owner_id = auth.uid()));

create policy "Team owners can remove members"
  on team_members for delete
  using (exists (select 1 from teams where id = team_id and owner_id = auth.uid()));

create index if not exists idx_team_members_team on team_members(team_id);
create index if not exists idx_team_members_user on team_members(user_id);

-- Job assignments (assign team members to jobs)
create table if not exists job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  member_id uuid not null references team_members(id) on delete cascade,
  assigned_at timestamp with time zone default now(),
  unique (job_id, member_id)
);

alter table job_assignments enable row level security;

create policy "Team members can view assignments"
  on job_assignments for select
  using (exists (
    select 1 from team_members tm
    join jobs j on j.id = job_id
    where tm.user_id = auth.uid() and tm.team_id = j.user_id and tm.status = 'active'
  ));

create policy "Team owners and admins can manage assignments"
  on job_assignments for insert
  with check (exists (
    select 1 from team_members tm
    join jobs j on j.id = job_id
    where tm.user_id = auth.uid() and j.user_id = auth.uid()
  ));

-- Scheduled events (calendar)
create table if not exists scheduled_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  title text not null,
  description text default '',
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  all_day boolean default false,
  color text default '#3B82F6',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table scheduled_events enable row level security;

create policy "Users can view own events"
  on scheduled_events for select
  using (auth.uid() = user_id or exists (
    select 1 from team_members tm where tm.team_id = scheduled_events.team_id and tm.user_id = auth.uid() and tm.status = 'active'
  ));

create policy "Users can create own events"
  on scheduled_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on scheduled_events for update
  using (auth.uid() = user_id);

create policy "Users can delete own events"
  on scheduled_events for delete
  using (auth.uid() = user_id);

create index if not exists idx_scheduled_events_user on scheduled_events(user_id, start_time);
create index if not exists idx_scheduled_events_team on scheduled_events(team_id, start_time);
create index if not exists idx_scheduled_events_job on scheduled_events(job_id);

-- Stripe Connect (marketplace seller accounts)
create table if not exists stripe_connect (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text,
  onboarding_complete boolean default false,
  charges_enabled boolean default false,
  payouts_enabled boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table stripe_connect enable row level security;

create policy "Users can view own Stripe Connect"
  on stripe_connect for select
  using (auth.uid() = user_id);

create policy "Users can insert own Stripe Connect"
  on stripe_connect for insert
  with check (auth.uid() = user_id);

create policy "Users can update own Stripe Connect"
  on stripe_connect for update
  using (auth.uid() = user_id);

-- Marketplace payouts
create table if not exists marketplace_payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  stripe_transfer_id text,
  description text default '',
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone
);

alter table marketplace_payouts enable row level security;

create policy "Sellers can view own payouts"
  on marketplace_payouts for select
  using (auth.uid() = seller_id);

create policy "Sellers can insert own payouts"
  on marketplace_payouts for insert
  with check (auth.uid() = seller_id);

create index if not exists idx_marketplace_payouts_seller on marketplace_payouts(seller_id, created_at desc);
