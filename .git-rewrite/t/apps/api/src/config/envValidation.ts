const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

export function validateEnvironment() {
  const missing = requiredEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return true;
}
