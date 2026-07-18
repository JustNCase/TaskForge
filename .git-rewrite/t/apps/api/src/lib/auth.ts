import { supabase } from './supabase';

export async function register(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function getSession(accessToken: string) {
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) throw error;
  return data.user;
}
