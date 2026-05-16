import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing auth header')

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    const superAdminEmail = Deno.env.get('SUPER_ADMIN_EMAIL')
    const isSuperAdmin =
      user.app_metadata?.role === 'super_admin' ||
      (superAdminEmail && user.email === superAdminEmail)
    if (!isSuperAdmin) {
      throw new Error('Forbidden: Insufficient permissions')
    }

    const { lojaId } = await req.json()
    if (!lojaId) throw new Error('lojaId required')

    const { data: loja } = await supabaseClient
      .from('lojas')
      .select('id, email, user_id')
      .eq('id', lojaId)
      .single()

    if (!loja) throw new Error('Loja not found')

    if (loja.user_id) {
      await supabaseClient.auth.admin.deleteUser(loja.user_id)
    }

    const { error: deleteError } = await supabaseClient
      .from('lojas')
      .delete()
      .eq('id', lojaId)

    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ success: true, message: 'Loja removida com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
