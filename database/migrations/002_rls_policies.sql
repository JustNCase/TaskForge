-- TaskForge Row Level Security policies
-- Ensures users can only access their own application data.

alter table profiles enable row level security;
alter table tasks enable row level security;
alter table economy enable row level security;

-- Profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Tasks
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can create own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Economy
create policy "Users can view own economy"
  on economy for select
  using (auth.uid() = user_id);

create policy "Users can update own economy"
  on economy for update
  using (auth.uid() = user_id);

create policy "Users can create own economy"
  on economy for insert
  with check (auth.uid() = user_id);
