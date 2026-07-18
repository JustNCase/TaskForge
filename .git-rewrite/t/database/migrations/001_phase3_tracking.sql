-- TaskForge Phase 3 migration tracking foundation

create table if not exists migration_history (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  applied_at timestamp default now()
);

insert into migration_history (name)
values ('001_phase3_tracking')
on conflict do nothing;
