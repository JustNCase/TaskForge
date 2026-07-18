-- TaskForge extended task schema
-- Adds description to tasks, creates subtasks table

alter table tasks add column if not exists description text default '';

create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  completed boolean default false,
  created_at timestamp with time zone default now()
);

alter table subtasks enable row level security;

create policy "Users can view own subtasks"
  on subtasks for select
  using (auth.uid() = user_id);

create policy "Users can create subtasks"
  on subtasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subtasks"
  on subtasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own subtasks"
  on subtasks for delete
  using (auth.uid() = user_id);

create index idx_subtasks_task_id on subtasks(task_id);
create index idx_subtasks_user_id on subtasks(user_id);
