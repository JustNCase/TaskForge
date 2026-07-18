import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    env: {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-key',
      STRIPE_SECRET_KEY: 'sk_test_test',
      OPENAI_API_KEY: 'sk-test',
    },
  },
});
