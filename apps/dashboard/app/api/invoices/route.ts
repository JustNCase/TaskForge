import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(name), invoice_items(*), payments(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ invoices: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_id, job_id, estimate_id, title, description, subtotal, tax_rate, tax_amount, total, due_date, notes, items } = body

  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  // Generate invoice number
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id: client_id || null,
      job_id: job_id || null,
      estimate_id: estimate_id || null,
      invoice_number: invoiceNumber,
      title,
      description: description || null,
      subtotal: subtotal || 0,
      tax_rate: tax_rate || 0,
      tax_amount: tax_amount || 0,
      total: total || 0,
      due_date: due_date || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Add line items
  if (items && items.length > 0) {
    const lineItems = items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      amount: item.amount || 0,
    }))

    await supabase.from('invoice_items').insert(lineItems)
  }

  return NextResponse.json({ invoice })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, items, ...updates } = body

  if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update line items if provided
  if (items) {
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    if (items.length > 0) {
      const lineItems = items.map((item: any) => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        amount: item.amount || 0,
      }))
      await supabase.from('invoice_items').insert(lineItems)
    }
  }

  return NextResponse.json({ invoice: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
