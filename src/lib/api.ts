import { supabase } from './supabase';

export async function invokeProtectedFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return {
      data: null,
      error: new Error('No active session. Please log in again.'),
    };
  }

  const { data, error } = await supabase.functions.invoke<T>(name, {
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });

  return { data, error };
}
