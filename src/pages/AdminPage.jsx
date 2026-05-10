import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StoreAdminView from '../components/StoreAdminView'
import styles from './AdminPage.module.css'

export default function AdminPage() {
  const { slug } = useParams()
  const [loja, setLoja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) {
      setError('Loja nao encontrada')
      setLoading(false)
      return
    }

    let cancelled = false
    const TIMEOUT_MS = 15000
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao carregar loja')), TIMEOUT_MS)
    )

    const fetchLoja = async () => {
      try {
        const result = await Promise.race([
          supabase
            .from('lojas')
            .select('id, nome, slug, ativo, created_at')
            .eq('slug', slug)
            .single(),
          timeoutPromise
        ])
        if (cancelled) return
        if (result.error || !result.data) {
          setError('Loja nao encontrada')
        } else if (!result.data.ativo) {
          setError('Esta loja esta inativa')
        } else {
          setLoja(result.data)
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Erro ao carregar loja')
      }
      if (!cancelled) setLoading(false)
    }

    fetchLoja()
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDiamond}>&#x1F48E;</div>
        <div>Carregando...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erro</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!loja) return null

  return <StoreAdminView loja={loja} />
}
