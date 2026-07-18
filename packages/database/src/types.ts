export interface User {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  plan_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  difficulty: number;
  reward: number;
  completed: boolean;
  category: string | null;
  sort_order: number | null;
  tags: string[];
  project_id: string | null;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  sort_order: number | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  invited_by: string | null;
  joined_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  job_type: "plumbing" | "electrical" | "hvac" | "roofing" | "painting" | "general" | "other" | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  address: string | null;
  amount: number;
  created_at: string;
}

export interface Estimate {
  id: string;
  user_id: string;
  client_id: string | null;
  job_id: string | null;
  estimate_number: string | null;
  title: string;
  description: string | null;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  valid_until: string | null;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface EstimateItem {
  id: string;
  estimate_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  job_id: string | null;
  estimate_id: string | null;
  invoice_number: string | null;
  title: string;
  description: string | null;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  due_date: string | null;
  paid_at: string | null;
  sent_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: "cash" | "check" | "card" | "bank_transfer" | "stripe";
  reference_number: string | null;
  notes: string | null;
  paid_at: string;
}

export interface StoredEvent {
  id: string;
  type: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  source: string | null;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  user_id: string;
  email: boolean;
  push: boolean;
  in_app: boolean;
  digest: "instant" | "hourly" | "daily" | "never";
  types: Record<string, boolean>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface Economy {
  user_id: string;
  xp: number;
  coins: number;
  level: number;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  email: string;
  role: "admin" | "member";
  status: "pending" | "active" | "removed";
  hourly_rate: number;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: "earn" | "withdrawal" | "refund" | "bonus";
  description: string;
  reference_id: string | null;
  created_at: string;
}
