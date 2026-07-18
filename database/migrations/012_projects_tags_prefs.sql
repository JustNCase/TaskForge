-- TaskForge projects, tags, and notification preferences

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id),
  joined_at timestamp with time zone default now(),
  unique (project_id, user_id)
);

alter table projects enable row level security;
alter table project_members enable row level security;

-- Project RLS: members can view, owners/admins can update/delete
create policy "Members can view projects"
  on projects for select
  using (exists (select 1 from project_members where project_id = id and user_id = auth.uid()));

create policy "Owners and admins can update projects"
  on projects for update
  using (exists (select 1 from project_members where project_id = id and user_id = auth.uid() and role in ('owner', 'admin')));

create policy "Owners can delete projects"
  on projects for delete
  using (exists (select 1 from project_members where project_id = id and user_id = auth.uid() and role = 'owner'));

create policy "Members can view project members"
  on project_members for select
  using (user_id = auth.uid() or exists (select 1 from project_members where project_id = project_members.project_id and user_id = auth.uid()));

create policy "Owners and admins can manage members"
  on project_members for insert
  with check (exists (select 1 from project_members where project_id = project_members.project_id and user_id = auth.uid() and role in ('owner', 'admin')));

create policy "Owners and admins can update members"
  on project_members for update
  using (exists (select 1 from project_members where project_id = project_members.project_id and user_id = auth.uid() and role in ('owner', 'admin')));

-- Add tags to tasks and project reference
alter table tasks add column if not exists tags text[] default '{}';
alter table tasks add column if not exists project_id uuid references projects(id) on delete set null;

create index if not exists idx_tasks_tags on tasks using gin(tags);
create index if not exists idx_tasks_project_id on tasks(project_id);

-- Notification preferences (stored as JSON per user)
create table if not exists notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  task_completed boolean default true,
  achievement_unlocked boolean default true,
  project_invite boolean default true,
  mention boolean default true,
  updated_at timestamp with time zone default now()
);

alter table notification_preferences enable row level security;

create policy "Users can view own notification preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on notification_preferences for insert
  with check (auth.uid() = user_id);
