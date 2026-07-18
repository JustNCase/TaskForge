-- Add sort_order to tasks for drag-and-drop reordering

alter table tasks add column if not exists sort_order integer default 0;

-- Set initial sort_order based on created_at (newest first gets order 0)
update tasks t
set sort_order = sub.rn
from (
  select id, row_number() over (partition by user_id order by created_at desc) - 1 as rn
  from tasks
) sub
where t.id = sub.id and t.sort_order = 0;

create index if not exists idx_tasks_sort_order on tasks(user_id, sort_order);
