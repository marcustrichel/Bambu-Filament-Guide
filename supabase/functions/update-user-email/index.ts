// Changes another user's Supabase Auth email address. This is the one action
// in the access-level feature that genuinely requires the Admin API (and thus
// the service_role key) — everything else (roles, disabled, name, phone) is
// just a row in `user_profiles`, governed entirely by RLS + a trigger.
//
// Deploy: supabase functions deploy update-user-email
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically by the Supabase platform — no secrets to set manually.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Identifies the caller from their own JWT — never used for privileged actions.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) return json({ error: 'Invalid session' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { targetUserId, newEmail } = body;
  if (!targetUserId || !newEmail) {
    return json({ error: 'targetUserId and newEmail are required' }, 400);
  }

  // Service-role client: used only after the permission checks below pass.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile, error: callerProfileError } = await adminClient
    .from('user_profiles')
    .select('role, disabled')
    .eq('id', caller.id)
    .single();
  if (callerProfileError || !callerProfile) return json({ error: 'Caller profile not found' }, 403);
  if (callerProfile.disabled) return json({ error: 'Your account is disabled' }, 403);
  if (!['elevated', 'admin'].includes(callerProfile.role)) {
    return json({ error: 'Forbidden — elevated or admin role required' }, 403);
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('id', targetUserId)
    .single();
  if (targetProfileError || !targetProfile) return json({ error: 'Target user not found' }, 404);

  if (callerProfile.role === 'elevated' && targetProfile.role !== 'standard') {
    return json({ error: 'Elevated users can only manage standard users' }, 403);
  }

  const { data, error } = await adminClient.auth.admin.updateUserById(targetUserId, { email: newEmail });
  if (error) return json({ error: error.message }, 400);

  // user_profiles.email is kept in sync by the sync_user_profile_email
  // trigger (fires on auth.users.email update), so nothing else to do here.
  return json({ success: true, user: { id: data.user.id, email: data.user.email } });
});
