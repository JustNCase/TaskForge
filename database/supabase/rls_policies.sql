alter table tasks enable row level security;
alter table economy enable row level security;

create policy "users manage own tasks"
on tasks
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own economy"
on economy
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
