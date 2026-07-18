create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan_id text not null,
  status text not null default 'incomplete',
  current_period_start timestamp,
  current_period_end timestamp,
  cancel_at_period_end boolean default false,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can update own subscription"
  on subscriptions for update
  using (auth.uid() = user_id);

create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_stripe_subscription_id on subscriptions(stripe_subscription_id);
