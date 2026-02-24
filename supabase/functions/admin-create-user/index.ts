import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function waitForCompanyId(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  maxRetries = 6
): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const { data } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.company_id) return data.company_id;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}

async function createCompanyProfileFallback(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  companyName: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('company_profiles')
    .insert({
      user_id: userId,
      company_name: companyName || 'Mon Entreprise',
      activity_type: 'onglerie',
      creation_date: new Date().toISOString().split('T')[0],
      country: 'France',
      legal_status: 'MICRO',
      vat_mode: 'VAT_FRANCHISE',
      acre: false,
      versement_liberatoire: false,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[admin-create-user] Fallback company creation error:', error);
    return null;
  }
  return data?.id ?? null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, role, firstName, lastName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = role || 'pro';

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: userRole,
        first_name: firstName || null,
        last_name: lastName || null,
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let companyId: string | null = null;

    if (userRole === 'pro') {
      companyId = await waitForCompanyId(supabase, newUser.user.id);

      if (!companyId) {
        const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];
        companyId = await createCompanyProfileFallback(supabase, newUser.user.id, name);
      }
    }

    return new Response(
      JSON.stringify({
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          company_id: companyId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[admin-create-user] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
