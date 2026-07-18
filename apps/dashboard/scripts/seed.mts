import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    console.warn('Could not load .env.local, using existing env vars')
  }
}

loadEnv()

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars. Add to apps/dashboard/.env.local:')
    console.error('  SUPABASE_SERVICE_ROLE_KEY=<your_key>')
    console.error('(Find it in Supabase Dashboard > Project Settings > API > service_role key)')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const email = 'dev@test.com'
  const password = 'devpass123'
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    console.error('Error creating user:', createError.message)
    process.exit(1)
  }

  const userId = userData.user.id

  await supabase.from('economy').upsert({
    user_id: userId,
    xp: 250,
    coins: 100,
    level: 3,
  })

  await supabase.from('profiles').upsert({
    id: userId,
    display_name: 'Dev User',
  })

  const tasks = [
    { user_id: userId, title: 'Review project proposal', description: 'Go through the Q3 proposal document', category: 'work', difficulty: 3, completed: true },
    { user_id: userId, title: 'Fix login page styling', description: 'Button alignment is off on mobile', category: 'repair', difficulty: 2, completed: true },
    { user_id: userId, title: 'Invoice client #1024', description: 'Send invoice for completed milestone', category: 'income', difficulty: 1, completed: true },
    { user_id: userId, title: 'Update dependencies', description: 'Run npm audit and update all packages', category: 'repair', difficulty: 4, completed: false },
    { user_id: userId, title: 'Write unit tests for payment flow', description: 'Cover edge cases for Stripe integration', category: 'work', difficulty: 5, completed: false },
    { user_id: userId, title: 'Clean garage', description: 'Organize tools and dispose of old paint cans', category: 'personal', difficulty: 3, completed: false },
    { user_id: userId, title: 'Prepare tax documents', description: 'Gather receipts and statements for accountant', category: 'income', difficulty: 2, completed: false },
    { user_id: userId, title: 'Optimize database queries', description: 'Profile and add missing indexes', category: 'work', difficulty: 4, completed: false },
    { user_id: userId, title: 'Fix leaking faucet', description: 'Replace washer in kitchen sink', category: 'repair', difficulty: 2, completed: false },
    { user_id: userId, title: 'Design new landing page', description: 'Create wireframes for the redesign', category: 'work', difficulty: 3, completed: false },
  ]

  for (const task of tasks) {
    const { data } = await supabase.from('tasks').insert(task).select().single()
    if (data && task.completed) {
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: 'task_completed',
        metadata: { task_id: data.id, difficulty: task.difficulty },
      })
    }
  }

  console.log(`Seeded ${tasks.length} tasks`)
  console.log(`Login: ${email} / ${password}`)
}

seed().catch(console.error)
