
create table users (
  id uuid primary key,
  email text unique,
  username text,
  balance numeric default 0
);

create table referrals (
  id uuid primary key,
  referrer_id uuid,
  referred_id uuid
);

create table wallets (
  id uuid primary key,
  user_id uuid,
  balance numeric default 0
);

create table withdrawals (
  id uuid primary key,
  user_id uuid,
  amount numeric,
  status text
);
