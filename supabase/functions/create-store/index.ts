import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role (secure: server-side only)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing auth header')

    // Verify super admin JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) throw new Error('Unauthorized')

    // Verify super admin role
    if (user.app_metadata?.role !== 'super_admin') {
      throw new Error('Forbidden: Insufficient permissions')
    }

    // Parse request
    const { storeName, storePassword } = await req.json()
    if (!storeName) throw new Error('Store name required')

    // Generate slug
    const slug = storeName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

    const email = `admin@${slug}.com`
    const password = storePassword || 'temp123456'

    // ✅ 1. Create Auth user (service role - secure!)
    const { data: authData, error: authError2 } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError2) throw authError2

    // ✅ 2. Insert store with user_id
    const { data: lojaData, error: lojaError } = await supabaseClient
      .from('lojas')
      .insert([{
        nome: storeName,
        slug: slug,
        email: email,
        user_id: authData.user.id
      }])
      .select('id, nome, slug, ativo, created_at')
      .single()

      if (lojaError) {
        // Rollback: delete auth user if store creation fails
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw lojaError
      }

      // ✅ 4. Create default catalog config for this store
      const { error: configError } = await supabaseClient
        .from('catalogo_config')
        .insert([{
          loja_id: lojaData.id,
          nome: storeName,
          slogan: 'Acessórios & Semijoias',
          cor_principal: '#C9A84C',
          cor_destaque: '#FA098A',
          promo_ativa: false,
          promo_texto: '',
          categorias: ['Aneis', 'Colares', 'Brincos', 'Pulseiras', 'Outros']
        }])

      if (configError) {
        // Rollback: delete loja and auth user if config creation fails
        await supabaseClient.from('lojas').delete().eq('id', lojaData.id)
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw configError
      }

    // ✅ 3. Return success
    return new Response(
      JSON.stringify({
        success: true,
        loja: lojaData,
        email: email,
        message: `Loja "${lojaData.nome}" criada! Slug: ${lojaData.slug}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
