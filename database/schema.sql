-- JobCraft Database Schema

-- Users table (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id),
  email text unique,
  full_name text,
  business_name text,
  phone text,
  plan_id text default 'starter',
  created_at timestamptz default now()
);

-- Clients table
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- Jobs table
create table jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  description text,
  status text default 'scheduled', -- scheduled, in_progress, completed, cancelled
  job_type text, -- plumbing, electrical, hvac, general, etc.
  scheduled_date date,
  scheduled_time time,
  estimated_hours numeric,
  actual_hours numeric,
  address text,
  amount numeric default 0,
  created_at timestamptz default now()
);

-- Estimates table
create table estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  estimate_number text unique,
  title text not null,
  description text,
  status text default 'draft', -- draft, sent, accepted, rejected, expired
  subtotal numeric default 0,
  tax_rate numeric default 0,
  tax_amount numeric default 0,
  total numeric default 0,
  notes text,
  valid_until date,
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz default now()
);

-- Estimate line items
create table estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid references estimates(id) on delete cascade,
  description text not null,
  quantity numeric default 1,
  unit_price numeric default 0,
  amount numeric default 0
);

-- Invoices table
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  estimate_id uuid references estimates(id) on delete set null,
  invoice_number text unique,
  title text not null,
  description text,
  status text default 'draft', -- draft, sent, paid, overdue, cancelled
  subtotal numeric default 0,
  tax_rate numeric default 0,
  tax_amount numeric default 0,
  total numeric default 0,
  amount_paid numeric default 0,
  due_date date,
  paid_at timestamptz,
  sent_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Invoice line items
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  quantity numeric default 1,
  unit_price numeric default 0,
  amount numeric default 0
);

-- Payments table
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  amount numeric not null,
  payment_method text, -- cash, check, card, bank_transfer, stripe
  reference_number text,
  notes text,
  paid_at timestamptz default now()
);

-- Row Level Security
alter table users enable row level security;
alter table clients enable row level security;
alter table jobs enable row level security;
alter table estimates enable row level security;
alter table estimate_items enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;

-- Policies
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

create policy "Users can manage own clients" on clients for all using (auth.uid() = user_id);
create policy "Users can manage own jobs" on jobs for all using (auth.uid() = user_id);
create policy "Users can manage own estimates" on estimates for all using (auth.uid() = user_id);
create policy "Users can manage own estimate_items" on estimate_items for all using (
  exists (select 1 from estimates where estimates.id = estimate_items.estimate_id and estimates.user_id = auth.uid())
);
create policy "Users can manage own invoices" on invoices for all using (auth.uid() = user_id);
create policy "Users can manage own invoice_items" on invoice_items for all using (
  exists (select 1 from invoices where invoices.id = invoice_items.invoice_id and invoices.user_id = auth.uid())
);
create policy "Users can manage own payments" on payments for all using (
  exists (select 1 from invoices where invoices.id = payments.invoice_id and invoices.user_id = auth.uid())
);
