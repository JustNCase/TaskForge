-- TaskForge wallet, referrals, and withdrawals

-- Wallet: tracks user balance
create table if not exists wallet (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  balance integer default 0,
  total_earned integer default 0,
  total_withdrawn integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table wallet enable row level security;

create policy "Users can view own wallet"
  on wallet for select
  using (auth.uid() = user_id);

create policy "Users can insert own wallet"
  on wallet for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wallet"
  on wallet for update
  using (auth.uid() = user_id);

-- Wallet transactions: ledger of all balance changes
create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null check (type in ('earn', 'withdrawal', 'refund', 'bonus')),
  description text default '',
  reference_id uuid,
  created_at timestamp with time zone default now()
);

alter table wallet_transactions enable row level security;

create policy "Users can view own wallet transactions"
  on wallet_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own wallet transactions"
  on wallet_transactions for insert
  with check (auth.uid() = user_id);

create index if not exists idx_wallet_transactions_user on wallet_transactions(user_id, created_at desc);

-- Referrals
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid references auth.users(id) on delete set null,
  code text unique not null,
  status text default 'pending' check (status in ('pending', 'completed', 'expired')),
  reward_granted boolean default false,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

alter table referrals enable row level security;

create policy "Users can view own referrals"
  on referrals for select
  using (auth.uid() = referrer_id);

create policy "Users can insert own referrals"
  on referrals for insert
  with check (auth.uid() = referrer_id);

create policy "Users can update own referrals"
  on referrals for update
  using (auth.uid() = referrer_id);

create index if not exists idx_referrals_code on referrals(code);
create index if not exists idx_referrals_referrer on referrals(referrer_id);

-- User referral code (one per user)
create table if not exists user_referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text unique not null,
  times_used integer default 0,
  created_at timestamp with time zone default now()
);

alter table user_referral_codes enable row level security;

create policy "Users can view own referral code"
  on user_referral_codes for select
  using (auth.uid() = user_id);

create policy "Users can insert own referral code"
  on user_referral_codes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own referral code"
  on user_referral_codes for update
  using (auth.uid() = user_id);

-- Withdrawals
create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  method text not null check (method in ('bank_transfer', 'paypal', 'stripe')),
  account_details jsonb default '{}',
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  notes text default '',
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table withdrawals enable row level security;

create policy "Users can view own withdrawals"
  on withdrawals for select
  using (auth.uid() = user_id);

create policy "Users can insert own withdrawals"
  on withdrawals for insert
  with check (auth.uid() = user_id);

create index if not exists idx_withdrawals_user on withdrawals(user_id, created_at desc);
