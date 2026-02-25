import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !callerUser) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return jsonResponse({ error: 'Access denied: Admin privileges required' }, 403);
    }

    const { target_user_id } = await req.json();

    if (!target_user_id) {
      return jsonResponse({ error: 'target_user_id is required' }, 400);
    }

    if (target_user_id === callerUser.id) {
      return jsonResponse({ error: 'Cannot delete your own account' }, 400);
    }

    const { error: rpcError } = await supabase.rpc('admin_delete_user', {
      target_user_id,
    });

    if (rpcError) {
      console.error('[admin-delete-user] RPC cleanup error:', rpcError);
      return jsonResponse({ error: `Data cleanup failed: ${rpcError.message}` }, 500);
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(target_user_id);

    if (authDeleteError) {
      console.error('[admin-delete-user] Auth delete error:', authDeleteError);
      return jsonResponse({
        error: `App data deleted but auth record removal failed: ${authDeleteError.message}`,
        partial: true,
      }, 500);
    }

    return jsonResponse({ success: true }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[admin-delete-user] Error:', error);
    return jsonResponse({ error: message }, 500);
  }
});
