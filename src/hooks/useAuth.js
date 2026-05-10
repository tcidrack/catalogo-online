import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'



export function useSuperAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setLoading(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AUTH EVENT:', event)
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (password) => {
    const email = import.meta.env.VITE_SUPER_ADMIN_EMAIL
    if (!email) {
      console.error('Missing VITE_SUPER_ADMIN_EMAIL in .env')
      return false
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) return false
      setIsAuthenticated(!!data.session)
      return !!data.session
    } catch (err) {
      console.error('Login error:', err)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
  }

  return { isAuthenticated, loading, login, logout }
}

export function useStoreAdminAuth(slug) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [storeVerified, setStoreVerified] = useState(false)

  const verifyStoreOwnership = async (session, retries = 2) => {
    if (!session?.user?.id || !slug) {
      return false
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { data: loja, error } = await supabase
          .from('lojas')
          .select('id, nome, slug, email, user_id, ativo, created_at')
          .eq('slug', slug)
          .single()
        
        if (!error && loja) {
          if (loja.user_id !== session.user.id) {
            console.error('Usuário não é dono desta loja')
            return false
          }
          return true
        }
      } catch (err) {
        console.error('Erro ao verificar loja (tentativa ' + (attempt + 1) + '):', err)
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }
    
    console.error('Loja não encontrada apos ' + (retries + 1) + ' tentativas:', slug)
    return false
  }

  useEffect(() => {
    setLoading(true)
    setIsAuthenticated(false)
    setStoreVerified(false)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setIsAuthenticated(false)
        setStoreVerified(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)
      const isOwner = await verifyStoreOwnership(session)
      setStoreVerified(isOwner)
      setLoading(false)
    })
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsAuthenticated(false)
        setStoreVerified(false)
        setLoading(false)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [slug])

  const login = async (password) => {
    try {
      const { data: loja, error: lojaError } = await supabase
        .from('lojas')
        .select('id, email, user_id')
        .eq('slug', slug)
        .single()
      
      if (lojaError || !loja?.email) {
        console.error('Loja não encontrada ou sem email')
        return false
      }
      
      // 2. Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loja.email,
        password: password
      })
      
      if (error) return false
      
      // 3. Verificar se o user_id bate
      if (data?.session) {
        if (loja.user_id !== data.user.id) {
          return false
        }
        setIsAuthenticated(true)
        setStoreVerified(true)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Login exception:', err)
      return false
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setStoreVerified(false)
  }

  return { isAuthenticated, loading, storeVerified, login, logout }
}
