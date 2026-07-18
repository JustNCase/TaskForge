-- TaskForge marketplace
-- Items users can buy with coins, and purchase tracking

create table if not exists marketplace_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price integer not null,
  category text default 'general',
  image_url text default '',
  created_at timestamp with time zone default now()
);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references marketplace_items(id) on delete cascade,
  purchased_at timestamp with time zone default now()
);

alter table marketplace_items enable row level security;
alter table purchases enable row level security;

-- Anyone can view marketplace items
create policy "Anyone can view marketplace items"
  on marketplace_items for select
  using (true);

-- Users can view their own purchases
create policy "Users can view own purchases"
  on purchases for select
  using (auth.uid() = user_id);

-- Users can create their own purchase records
create policy "Users can create own purchases"
  on purchases for insert
  with check (auth.uid() = user_id);

create index idx_purchases_user_id on purchases(user_id);
create index idx_purchases_item_id on purchases(item_id);
create index idx_marketplace_items_category on marketplace_items(category);

-- Seed default items
insert into marketplace_items (name, description, price, category) values
  ('XP Boost', 'Double XP for 24 hours', 50, 'boost'),
  ('Coin Multiplier', 'Earn 2x coins for 24 hours', 75, 'boost'),
  ('Priority Badge', 'Gold badge on your profile', 100, 'cosmetic'),
  ('Dark Theme', 'Unlock dark mode', 25, 'cosmetic'),
  ('Task Slots +5', 'Unlock 5 additional active task slots', 150, 'utility'),
  ('AI Priority Analysis', 'One-time AI priority scoring for all tasks', 40, 'utility')
on conflict do nothing;
