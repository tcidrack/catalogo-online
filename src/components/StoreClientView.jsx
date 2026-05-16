import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCatalogo } from '../hooks/useCatalogo'
import ProductCard from './ProductCard'
import Modal from './Modal'
import { linkAdmin } from '../utils/storeLinks'
import styles from './StoreClientView.module.css'

export default function StoreClientView({ loja }) {
  const { produtos, config, loading, error, reload } = useCatalogo(loja.id)
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedProduto, setSelectedProduto] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState([
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
      setCategories([
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

  useEffect(() => {
    if (!loja?.id) return
    const interval = setInterval(() => reload(true), 30000)
    return () => clearInterval(interval)
  }, [loja?.id, reload])

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
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
    if (activeCategory === 'promo') return p.em_promocao
    if (activeCategory === 'all') return true
    return p.categoria === activeCategory
  }).filter(p => {
    if (!searchTerm) return true
    return p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.hero}>
          {config?.logo_url && (
            <img
              src={config.logo_url}
              alt={`Logo ${config?.nome || loja.nome}`}
              style={{ height: '72px', maxWidth: '200px', objectFit: 'contain', marginBottom: '0.75rem' }}
            />
          )}
          <div className={styles.heroAccent} aria-hidden="true" />
          <h1 className={styles.heroTitle}>{config?.nome || loja.nome}</h1>
          <p className={styles.heroSub}>{config?.slogan || 'Acessórios & Semijoias'}</p>
        </div>
      </header>

      {config?.promo_ativa && config?.promo_texto && (
        <div
          className={styles.promoBanner}
          style={{ background: config.promo_cor || '#4caf50', color: '#fff' }}
          role="banner"
          aria-label="Promoção ativa"
        >
          <span className={styles.promoText}>{config.promo_texto}</span>
          <span className={styles.promoBadge}>OFERTA</span>
        </div>
      )}

      <div className={styles.toolbar} role="search">
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu de categorias"
          aria-expanded={menuOpen}
        >
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
          <span className={styles.hamburgerLine} aria-hidden="true" />
        </button>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIconSvg} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="m15 15 3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Buscar produtos"
          />
          {searchTerm && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchTerm('')}
              aria-label="Limpar busca"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" aria-hidden="true">
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className={styles.drawerOverlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <aside
        className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}
        aria-label="Menu de categorias"
        aria-hidden={!menuOpen}
      >
        <div className={styles.drawerHeader}>
          <h3>Categorias</h3>
          <button
            className={styles.drawerClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className={styles.drawerNav}>
          {categories.map(cat => (
            <button
              key={cat.value}
              className={`${styles.drawerItem} ${activeCategory === cat.value ? styles.drawerActive : ''}`}
              onClick={() => { setActiveCategory(cat.value); setMenuOpen(false) }}
              aria-current={activeCategory === cat.value ? 'true' : undefined}
            >
              {activeCategory === cat.value && (
                <span className={styles.drawerActiveDot} aria-hidden="true" />
              )}
              {cat.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
            <p>Nenhum produto encontrado.</p>
          </div>
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
      </main>

      <footer className={styles.footer}>
        <p>© {config?.nome || loja.nome}</p>
        {config?.instagram && (
          <a
            href={`https://instagram.com/${config.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram: ${config.instagram}`}
          >
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
