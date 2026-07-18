-- TaskForge task categories

alter table tasks add column if not exists category text default 'general';
create index if not exists idx_tasks_category on tasks(category);
