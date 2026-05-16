import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import StoreClientView from '../components/StoreClientView'
import LandingPage from './LandingPage'
import { getSlug } from '../utils/storeLinks'
import styles from './StorePage.module.css'

export default function StorePage() {
  const { slug: pathSlug } = useParams()
  const slug = pathSlug || getSlug()

  if (!slug) {
    return <LandingPage />
  }

  return <StorePageContent slug={slug} />
}

function StorePageContent({ slug }) {
  const [loja, setLoja] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchLoja = async () => {
      const { data, error: err } = await supabase
        .from('lojas')
        .select('id, nome, slug, ativo, created_at')
        .eq('slug', slug)
        .single()

      if (err || !data) {
        setError('Loja nao encontrada')
      } else if (!data.ativo) {
        setError('Esta loja esta inativa')
      } else {
        setLoja(data)
      }
      setLoading(false)
    }

    fetchLoja()
  }, [slug])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <span>Carregando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erro</h2>
        <p>{error}</p>
        <a href="/" className={styles.homeLink}>← Voltar ao início</a>
      </div>
    )
  }

  if (!loja) return null

  return <StoreClientView loja={loja} />
}
