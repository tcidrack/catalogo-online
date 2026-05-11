import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../hooks/useCatalogo'
import ProductCard from './ProductCard'
import Modal from './Modal'
import { linkAdmin } from '../utils/storeLinks'
import styles from './StoreClientView.module.css'

export default function StoreClientView({ loja }) {
  const { produtos, config, loading, error } = useCatalogo(loja.id)
  const [filter, setFilter] = useState('all')
  const [selectedProduto, setSelectedProduto] = useState(null)
  const [dynamicFilters, setDynamicFilters] = useState([
    { label: 'Todos', value: 'all' },
    { label: '🏷 Promoções', value: 'promo' },
  ])

  // Load dynamic filters from config categories
  useEffect(() => {
    if (config?.categorias && Array.isArray(config.categorias)) {
      const categoryFilters = config.categorias.map(cat => ({
        label: cat,
        value: cat
      }))
      setDynamicFilters([
        { label: 'Todos', value: 'all' },
        ...categoryFilters,
        { label: '🏷 Promoções', value: 'promo' },
      ])
    }
  }, [config])

  useEffect(() => {
    if (config?.cor_principal) {
      document.documentElement.style.setProperty('--gold', config.cor_principal)
      document.documentElement.style.setProperty('--gold-dark', config.cor_principal)
    }
    if (config?.cor_destaque) {
      document.documentElement.style.setProperty('--rose-dark', config.cor_destaque)
      document.documentElement.style.setProperty('--rose', config.cor_destaque)
    }
    if (config?.cor_topo) {
      document.documentElement.style.setProperty('--header-bg', config.cor_topo)
    }
    if (config?.cor_rodape) {
      document.documentElement.style.setProperty('--footer-bg', config.cor_rodape)
    }
    if (config?.cor_fundo) {
      document.documentElement.style.setProperty('--bg-main', config.cor_fundo)
    }
    if (config?.promo_cor) {
      document.documentElement.style.setProperty('--promo-color', config.promo_cor)
    }
    if (config?.promo_badge_cor) {
      document.documentElement.style.setProperty('--promo-badge-color', config.promo_badge_cor)
    }
    if (config?.fonte_texto) {
      document.documentElement.style.setProperty('--font-main', config.fonte_texto)
    }
    document.documentElement.style.setProperty('--text-light', '#666')
  }, [config])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDiamond}>💎</div>
        <div className={styles.loadingTitle}>{config?.nome || 'Carregando...'}</div>
        <div className={styles.loadingSub}>Carregando catálogo...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorIcon}>⚠️</div>
        <div className={styles.errorTitle}>Erro de conexão</div>
        <p className={styles.errorMsg}>{error}</p>
      </div>
    )
  }

  const filtered = produtos.filter(p => {
    if (!p.disponivel) return false
    // Keep out-of-stock products visible if admin wants to show quantities
    if (filter === 'promo') return p.em_promocao
    if (filter === 'all') return true
    return p.categoria === filter
  })

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.hero}>
          {config?.logo_url && (
            <img src={config.logo_url} alt="Logo" style={{ height: '80px', maxWidth: '100%', objectFit: 'contain', marginBottom: '1rem' }} />
          )}
          <h1 className={styles.heroTitle}>{config?.nome || loja.nome}</h1>
          <p className={styles.heroSub}>{config?.slogan || 'Acessórios & Semijoias'}</p>
        </div>
      </header>

       {config?.promo_ativa && config?.promo_texto && (
        <div
          className={styles.promoBanner}
          style={{
            background: config.promo_cor || '#4caf50',
            color: '#fff'
          }}
        >
          <span className={styles.promoText}>{config.promo_texto}</span>
          <span className={styles.promoBadge}>OFERTA</span>
        </div>
      )}

      <div className={styles.filters}>
        <span className={styles.filterLabel}>Ver:</span>
        {dynamicFilters.map(f => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.active : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>Nenhum produto encontrado.</div>
        ) : (
          filtered.map(p => (
            <ProductCard 
              key={p.id} 
              produto={p} 
              mostrarQuantidade={config?.mostrar_quantidade || false}
              onClick={() => setSelectedProduto(p)} 
            />
          ))
        )}
      </div>

      <footer className={styles.footer}>
        <p>© {config?.nome || loja.nome}</p>
        {config?.instagram && (
          <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
            {config.instagram}
          </a>
        )}
      </footer>

       {selectedProduto && (
        <Modal
          produto={selectedProduto}
          whatsapp={config?.whatsapp || ''}
          whatsappMsgPrefix={config?.whatsapp_msg_prefix || ''}
          onClose={() => setSelectedProduto(null)}
        />
      )}
    </div>
  )
}
