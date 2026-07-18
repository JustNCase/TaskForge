import { z } from "zod";

export const InvoiceStatus = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const InvoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit_price: z.number().min(0).default(0),
  amount: z.number().min(0).default(0),
});
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const PaymentMethod = z.enum([
  "cash",
  "check",
  "card",
  "bank_transfer",
  "stripe",
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: PaymentMethod.nullable().optional(),
  reference_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  paid_at: z.string().optional(),
});
export type Payment = z.infer<typeof PaymentSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  client_id: z.string().uuid().nullable().optional(),
  job_id: z.string().uuid().nullable().optional(),
  estimate_id: z.string().uuid().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: InvoiceStatus.default("draft"),
  subtotal: z.number().min(0).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
  tax_amount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  amount_paid: z.number().min(0).default(0),
  due_date: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  sent_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(InvoiceItemSchema).optional(),
  created_at: z.string().optional(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceCreateSchema = InvoiceSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
});
export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceUpdateSchema = InvoiceSchema.partial().required({ id: true });
export type InvoiceUpdate = z.infer<typeof InvoiceUpdateSchema>;
