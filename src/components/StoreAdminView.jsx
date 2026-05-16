import { useState, useEffect, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase, crudSupabase } from '../lib/supabase'
import { useStoreAdminAuth } from '../hooks/useAuth'
import { useCatalogo } from '../hooks/useCatalogo'
import { linkCliente } from '../utils/storeLinks'
import styles from './StoreAdminView.module.css'

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  back: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" width="14" height="14">
      <path d="M10 3L5 8l5 5" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" width="14" height="14">
      <path d="M6 3H3v10h3M10 5l3 3-3 3M13 8H6" />
    </svg>
  ),
  store: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M2 7h14M3 7V15h12V7M6 7V4a3 3 0 016 0v3" />
    </svg>
  ),
  palette: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="9" cy="9" r="7" /><circle cx="6" cy="7" r="1.2" fill="currentColor" stroke="none" /><circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <rect x="3" y="8" width="12" height="9" rx="2" /><path d="M6 8V5a3 3 0 016 0v3" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M2 9.5L9 2.5h6.5V9L9.5 15.5a1 1 0 01-1.4 0L2 9.5z" /><circle cx="13" cy="5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  promo: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M3 3h12v3L9 12 3 6V3z" /><path d="M9 12v3" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M9 2L2 5.5v7L9 16l7-3.5v-7L9 2z" /><path d="M9 2v14M2 5.5l7 3.5 7-3.5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="3" y="3" width="14" height="14" rx="2" /><circle cx="8" cy="8" r="2" /><path d="M3 14l4-4 3 3 2-2 5 5" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M1 5.5A1.5 1.5 0 012.5 4h.879L4.5 2.5h7L12.621 4H13.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5z" />
      <circle cx="8" cy="9" r="2.5" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" width="15" height="15">
      <path d="M8 10V3M5 6l3-3 3 3" /><path d="M3 13h10" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M4.5 3.5l.5 8h4l.5-8" />
    </svg>
  ),
  save: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
      <path d="M14 14H4a1 1 0 01-1-1V4l3-3h7a1 1 0 011 1v11a1 1 0 01-1 1z" /><path d="M7 14V9h4v5M6 1v4h6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11">
      <path d="M2 6l3 3 5-5" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
      <circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2l-9.6 9.6M15.5 7.5l2 2" />
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M7 11.5C7 9.5 8.5 8 10.5 8s3.5 1.5 3.5 3.5-1.5 3.5-3.5 3.5" /><path d="M3.5 7C3.5 4.5 6.5 2 10.5 2s7 2.5 7 5.5M14.5 17C14.5 19.5 12 22 10.5 22" /><path d="M17.5 13c1.5-1 2.5-2.5 2.5-4.5" />
    </svg>
  ),
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const FONTS = [
  { value: 'Arial, sans-serif',              label: 'Arial' },
  { value: 'Helvetica, sans-serif',          label: 'Helvetica' },
  { value: 'Georgia, serif',                 label: 'Georgia' },
  { value: "'Times New Roman', serif",       label: 'Times New Roman' },
  { value: 'Verdana, sans-serif',            label: 'Verdana' },
  { value: "'Trebuchet MS', sans-serif",     label: 'Trebuchet MS' },
  { value: "Palatino, serif",                label: 'Palatino' },
  { value: "Garamond, serif",                label: 'Garamond' },
  { value: "'Open Sans', sans-serif",        label: 'Open Sans' },
  { value: "'Roboto', sans-serif",           label: 'Roboto' },
  { value: "'Lato', sans-serif",             label: 'Lato' },
  { value: "'Montserrat', sans-serif",       label: 'Montserrat' },
  { value: "'Poppins', sans-serif",          label: 'Poppins' },
]

function ColorField({ label, configKey, value, onChange }) {
  return (
    <div className={styles.configCard}>
      <label className={styles.label}>{label}</label>
      <div className={styles.colorRow}>
        <div className={styles.colorSwatch}>
          <div className={styles.colorPreview} style={{ background: value }} />
          <input
            type="color"
            className={styles.colorInput}
            value={value}
            onChange={e => onChange(configKey, e.target.value)}
            title={`Escolher ${label}`}
          />
        </div>
        <input
          type="text"
          className={styles.colorHexInput}
          value={value}
          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(configKey, e.target.value) }}
          maxLength={7}
          spellCheck={false}
        />
      </div>
    </div>
  )
}

// ── Drag handle ───────────────────────────────────────────────────────────────
function DragHandle({ listeners }) {
  return (
    <div {...listeners} className={styles.dragHandle} title="Arrastar para reordenar" aria-label="Reordenar produto">
      <div className={styles.dragDot}><span/><span/></div>
      <div className={styles.dragDot}><span/><span/></div>
      <div className={styles.dragDot}><span/><span/></div>
    </div>
  )
}

// ── Sortable row ──────────────────────────────────────────────────────────────
function SortableProductRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
    >
      {children(listeners)}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function StoreAdminView({ loja }) {
  const { isAuthenticated, loading: authLoading, storeVerified, login, logout } = useStoreAdminAuth(loja.slug)
  const { produtos, config, loading: catalogLoading, error, saveConfig, addProduto, updateProduto, deleteProduto, uploadImagem, updateCategorias, reorderProdutos } = useCatalogo(loja?.id)

  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [categorias, setCategorias] = useState([])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [gerenciandoCategorias, setGerenciandoCategorias] = useState(false)
  const categoriasInitialized = useRef(false)
  const [localConfig, setLocalConfig] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveMsgType, setSaveMsgType] = useState('ok')
  const [addingProduct, setAddingProduct] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [localProducts, setLocalProducts] = useState([])
  const fileInputRef = useRef(null)
  const pendingUploadId = useRef(null)
  const newProductIdsRef = useRef(new Set())
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('admin_onboarding_seen'))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => { if (config) setLocalConfig(config) }, [config])

  useEffect(() => {
    if (!produtos) return
    setLocalProducts(prev => {
      if (prev.length === produtos.length && prev.every((p, i) => p.id === produtos[i].id)) return prev
      return produtos
    })
  }, [loja?.id, produtos])

  useEffect(() => {
    if (config && !categoriasInitialized.current) {
      if (config.categorias && Array.isArray(config.categorias) && config.categorias.length > 0) {
        setCategorias(config.categorias)
      } else {
        const def = ['Aneis', 'Colares', 'Brincos', 'Pulseiras', 'Outros']
        setCategorias(def)
        if (config.id) updateCategorias(def).catch(console.error)
      }
      categoriasInitialized.current = true
    }
  }, [config])

  useEffect(() => {
    if (!settingPassword) { setNewPassword(''); setConfirmPassword(''); setPasswordMsg('') }
  }, [settingPassword])

  // ── Auth loading/error states
  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <span>Verificando permissões...</span>
      </div>
    )
  }

  if (!storeVerified && isAuthenticated) {
    return (
      <div className={styles.error}>
        <h2>Acesso não autorizado</h2>
        <p>Você não tem permissão para acessar esta loja.</p>
        <button onClick={logout} className={styles.inlineBtn} style={{ marginTop: '1rem' }}>Sair</button>
      </div>
    )
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    const ok = await login(password)
    if (ok) setAuthError('')
    else setAuthError('Senha incorreta. Tente novamente.')
  }

  // ── Login screen
  if (!isAuthenticated) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authIconWrap} aria-hidden="true">
            <svg className={styles.authIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2 className={styles.authTitle}>Admin — {loja.nome}</h2>
          <form className={styles.authForm} onSubmit={handleLogin}>
            <input
              type="password"
              className={styles.authInput}
              placeholder="Senha do administrador"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
            <button type="submit" className={styles.authBtn}>Entrar</button>
            {authError && <p className={styles.authError} role="alert">{authError}</p>}
          </form>
          <a href={linkCliente(loja.slug)} className={styles.backLink}>
            {Icon.back} Ver catálogo
          </a>
        </div>
      </div>
    )
  }

  // ── Handlers
  const handleConfigChange = (field, value) => setLocalConfig(prev => ({ ...prev, [field]: value }))

  const handleProductChange = (id, field, value) =>
    setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))

  const handleSaveAll = async () => {
    if (saving || catalogLoading) return
    setSaving(true); setSaveMsg('')
    try {
      await saveConfig(localConfig)
      const failures = []
      for (const p of localProducts) {
        if (!p.id) continue
        try {
          const preco = parseFloat(String(p.preco ?? '').replace(',', '.'))
          const precoOriginal = p.preco_original ? parseFloat(String(p.preco_original).replace(',', '.')) : null
          let quantidade = null
          if (!(p.quantidade === '' || p.quantidade === null || p.quantidade === undefined)) {
            const n = parseInt(p.quantidade, 10)
            if (!isNaN(n)) quantidade = n
          }
          await updateProduto(p.id, {
            nome: p.nome || '', descricao: p.descricao || '', categoria: p.categoria || '',
            preco: isNaN(preco) ? 0 : preco,
            preco_original: isNaN(precoOriginal) ? null : precoOriginal,
            em_promocao: !!p.em_promocao, disponivel: !!p.disponivel, quantidade
          })
        } catch (e) { failures.push({ id: p.id, nome: p.nome, erro: e.message }) }
      }
      if (failures.length > 0) {
        setSaveMsgType('error')
        setSaveMsg('Erro ao salvar: ' + failures.map(f => f.nome).join(', '))
      } else {
        newProductIdsRef.current.clear()
        setSaveMsgType('ok')
        setSaveMsg('Catálogo salvo com sucesso!')
        setTimeout(() => setSaveMsg(''), 3500)
      }
    } catch (e) {
      setSaveMsgType('error')
      setSaveMsg('Erro: ' + (e.message || 'Falha ao salvar'))
    } finally {
      setSaving(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setPasswordMsg('Senhas não coincidem'); return }
    if (newPassword.length < 4) { setPasswordMsg('Senha muito curta (mínimo 4 caracteres)'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPasswordMsg('Erro: ' + error.message) }
    else { setPasswordMsg('Senha alterada com sucesso!'); setSettingPassword(false); setTimeout(() => setPasswordMsg(''), 3000) }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    try {
      const ext = file.name.split('.').pop()
      const path = `loja-${loja.id}/logo-${Date.now()}.${ext}`
      const { error: upErr } = await crudSupabase.storage.from('catalogo-imagens').upload(path, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = crudSupabase.storage.from('catalogo-imagens').getPublicUrl(path)
      handleConfigChange('logo_url', publicUrl)
    } catch (err) { alert('Erro no upload da logo: ' + err.message) }
  }

  const handleAddProduct = async () => {
    if (addingProduct || catalogLoading) return
    setAddingProduct(true)
    try {
      const newP = await addProduto()
      newProductIdsRef.current.add(newP.id)
      setLocalProducts(prev => [...prev, newP])
      setTimeout(() => document.getElementById(`product-${newP.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150)
    } catch (e) { alert('Erro ao adicionar produto: ' + (e.message || JSON.stringify(e))) }
    finally { setAddingProduct(false) }
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setLocalProducts(prev => {
      const oi = prev.findIndex(p => p.id === active.id)
      const ni = prev.findIndex(p => p.id === over.id)
      if (oi === -1 || ni === -1) return prev
      const updated = [...prev]
      const [moved] = updated.splice(oi, 1)
      updated.splice(ni, 0, moved)
      reorderProdutos(updated.map(p => p.id)).catch(console.error)
      return updated
    })
  }

  const handleImageClick = (id) => { pendingUploadId.current = id; fileInputRef.current?.click() }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; const id = pendingUploadId.current
    if (!file || !id) return
    setUploadingId(id)
    try {
      const url = await uploadImagem(id, file)
      setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, imagem_url: url } : p))
    } catch (err) { alert('Erro no upload: ' + err.message) }
    finally { setUploadingId(null) }
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteProduto(deleteConfirm)
      setLocalProducts(prev => prev.filter(p => p.id !== deleteConfirm))
    } catch (e) { alert('Erro ao remover: ' + e.message) }
    finally { setDeleteConfirm(null) }
  }

  if (error) return (
    <div className={styles.error}><h2>Erro ao carregar</h2><p>{error}</p></div>
  )

  return (
    <div className={styles.wrapper}>
      {/* ── Topbar ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <a href={linkCliente(loja.slug)} className={styles.backLink} aria-label="Ver catálogo">
            {Icon.back} Ver catálogo
          </a>
          <span className={styles.headerTitle}>{loja.nome}</span>
        </div>
        <div className={styles.headerRight}>
          <button onClick={logout} className={styles.logoutBtn} aria-label="Sair do painel">
            {Icon.logout} Sair
          </button>
        </div>
      </header>

      <div className={styles.body}>

        {/* ── Personalizar loja ── */}
        <section className={styles.section} aria-labelledby="sec-loja">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.store}</span>
            <h2 className={styles.sectionTitle} id="sec-loja">Informações da loja</h2>
          </div>
          <div className={styles.configGrid}>
            <div className={styles.configCard}>
              <label className={styles.label} htmlFor="cfg-nome">Nome da loja</label>
              <input id="cfg-nome" className={styles.input} value={localConfig.nome || ''} onChange={e => handleConfigChange('nome', e.target.value)} />
            </div>
            <div className={styles.configCard}>
              <label className={styles.label} htmlFor="cfg-slogan">Slogan</label>
              <input id="cfg-slogan" className={styles.input} value={localConfig.slogan || ''} onChange={e => handleConfigChange('slogan', e.target.value)} />
            </div>
            <div className={styles.configCard}>
              <label className={styles.label} htmlFor="cfg-whatsapp">WhatsApp (DDD + número)</label>
              <input id="cfg-whatsapp" className={styles.input} placeholder="85999999999" value={localConfig.whatsapp || ''} onChange={e => handleConfigChange('whatsapp', e.target.value)} inputMode="tel" />
            </div>
            <div className={styles.configCard}>
              <label className={styles.label} htmlFor="cfg-instagram">Instagram</label>
              <input id="cfg-instagram" className={styles.input} placeholder="@sualoja" value={localConfig.instagram || ''} onChange={e => handleConfigChange('instagram', e.target.value)} />
            </div>
            <div className={styles.configCard}>
              <label className={styles.label} htmlFor="cfg-wamsg">Mensagem padrão WhatsApp</label>
              <input id="cfg-wamsg" className={styles.input} placeholder="Olá! Gostaria de saber mais sobre:" value={localConfig.whatsapp_msg_prefix || ''} onChange={e => handleConfigChange('whatsapp_msg_prefix', e.target.value)} />
              <span className={styles.helper}>Texto antes do nome do produto na mensagem</span>
            </div>
            <div className={styles.configCard}>
              <label className={styles.label}>Mostrar quantidade em estoque</label>
              <div className={styles.toggleRow}>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={!!localConfig.mostrar_quantidade} onChange={e => handleConfigChange('mostrar_quantidade', e.target.checked)} />
                  <span className={styles.slider} />
                </label>
                <span className={styles.toggleLabel}>Exibir estoque no catálogo</span>
              </div>
              <span className={styles.helper}>Produtos com estoque zero aparecem como "Esgotado"</span>
            </div>
            {/* Logo */}
            <div className={styles.configCard} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Logo da loja</label>
              <div className={styles.logoSection}>
                {localConfig.logo_url && (
                  <img src={localConfig.logo_url} alt="Logo da loja" className={styles.logoPreview} />
                )}
                <label className={styles.uploadLabel}>
                  <span className={styles.uploadIcon} aria-hidden="true">{Icon.upload}</span>
                  {localConfig.logo_url ? 'Trocar logo' : 'Enviar logo'}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                </label>
                {localConfig.logo_url && (
                  <button type="button" className={styles.removeLogoBtn} onClick={() => handleConfigChange('logo_url', '')}>
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Cores ── */}
        <section className={styles.section} aria-labelledby="sec-cores">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.palette}</span>
            <h2 className={styles.sectionTitle} id="sec-cores">Cores & Tipografia</h2>
          </div>
          <div className={styles.configGrid}>
            <ColorField label="Cor principal" configKey="cor_principal" value={localConfig.cor_principal || '#C9A84C'} onChange={handleConfigChange} />
            <ColorField label="Cor de destaque" configKey="cor_destaque" value={localConfig.cor_destaque || '#C47B82'} onChange={handleConfigChange} />
            <ColorField label="Cor do topo" configKey="cor_topo" value={localConfig.cor_topo || '#1a1a2e'} onChange={handleConfigChange} />
            <ColorField label="Cor do rodapé" configKey="cor_rodape" value={localConfig.cor_rodape || '#1a1a2e'} onChange={handleConfigChange} />
            <ColorField label="Cor de fundo" configKey="cor_fundo" value={localConfig.cor_fundo || '#fafafa'} onChange={handleConfigChange} />
            <div className={styles.configCard}>
              <label className={styles.label}>Fonte do texto</label>
              <div className={styles.fontList}>
                {FONTS.map(font => {
                  const active = localConfig.fonte_texto === font.value
                  return (
                    <label key={font.value} className={`${styles.fontOption} ${active ? styles.fontOptionActive : ''}`} style={{ fontFamily: font.value }}>
                      <input type="radio" value={font.value} checked={active} onChange={e => handleConfigChange('fonte_texto', e.target.value)} />
                      {active && <span className={styles.fontCheckIcon}>{Icon.check}</span>}
                      {font.label}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Promoção ── */}
        <section className={styles.section} aria-labelledby="sec-promo">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.promo}</span>
            <h2 className={styles.sectionTitle} id="sec-promo">Banner de Promoção</h2>
          </div>
          <div className={styles.card}>
            <div className={styles.promoBox}>
              <div className={styles.toggleRow}>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={!!localConfig.promo_ativa} onChange={e => handleConfigChange('promo_ativa', e.target.checked)} />
                  <span className={styles.slider} />
                </label>
                <span className={styles.toggleLabel}>Ativar banner de promoção no topo do catálogo</span>
              </div>
              <div>
                <label className={styles.label} htmlFor="cfg-promo-texto" style={{ marginBottom: '0.4rem' }}>Texto do banner</label>
                <input
                  id="cfg-promo-texto"
                  className={styles.input}
                  placeholder="Ex: 20% OFF em brincos este fim de semana!"
                  value={localConfig.promo_texto || ''}
                  onChange={e => handleConfigChange('promo_texto', e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <ColorField label="Cor do banner" configKey="promo_cor" value={localConfig.promo_cor || '#4caf50'} onChange={handleConfigChange} />
                <ColorField label="Cor do selo % OFF" configKey="promo_badge_cor" value={localConfig.promo_badge_cor || '#FA098A'} onChange={handleConfigChange} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Categorias ── */}
        <section className={styles.section} aria-labelledby="sec-cats">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.tag}</span>
            <h2 className={styles.sectionTitle} id="sec-cats">Categorias</h2>
          </div>
          <div className={styles.card}>
            <button className={styles.inlineBtn} onClick={() => setGerenciandoCategorias(v => !v)}>
              {gerenciandoCategorias ? 'Fechar' : 'Gerenciar categorias'}
            </button>
            {gerenciandoCategorias && (
              <div>
                <div className={styles.catList}>
                  {categorias.map((cat, idx) => (
                    <div key={idx} className={styles.catRow}>
                      <span>{cat}</span>
                      <button
                        className={styles.delBtn}
                        aria-label={`Remover categoria ${cat}`}
                        onClick={() => {
                          const novas = categorias.filter((_, i) => i !== idx)
                          setCategorias(novas); updateCategorias(novas)
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
                <div className={styles.catAddRow}>
                  <input
                    className={styles.input}
                    placeholder="Nova categoria..."
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
                        const novas = [...categorias, novaCategoria.trim()]
                        setCategorias(novas)
                        try { await updateCategorias(novas); setNovaCategoria('') }
                        catch (ex) { alert('Erro: ' + ex.message); setCategorias(categorias) }
                      }
                    }}
                  />
                  <button
                    className={styles.saveSmallBtn}
                    onClick={async () => {
                      if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
                        const novas = [...categorias, novaCategoria.trim()]
                        setCategorias(novas)
                        try { await updateCategorias(novas); setNovaCategoria('') }
                        catch (ex) { alert('Erro: ' + ex.message); setCategorias(categorias) }
                      }
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Senha ── */}
        <section className={styles.section} aria-labelledby="sec-senha">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.lock}</span>
            <h2 className={styles.sectionTitle} id="sec-senha">Senha de Acesso</h2>
          </div>
          <div className={styles.card}>
            <button className={styles.inlineBtn} onClick={() => setSettingPassword(v => !v)}>
              {settingPassword ? 'Cancelar' : 'Alterar senha'}
            </button>
            {settingPassword && (
              <form onSubmit={handleSetPassword} className={styles.passwordForm}>
                <input type="password" className={styles.input} placeholder="Nova senha (mín. 4 caracteres)" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
                <input type="password" className={styles.input} placeholder="Confirmar nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" />
                <button type="submit" className={styles.saveSmallBtn}>Salvar senha</button>
                {passwordMsg && <p style={{ color: passwordMsg.includes('sucesso') ? '#4ade80' : '#f87171', fontSize: '0.85rem' }}>{passwordMsg}</p>}
              </form>
            )}
          </div>
        </section>

        {/* ── Produtos ── */}
        <section className={styles.section} aria-labelledby="sec-produtos">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.box}</span>
            <h2 className={styles.sectionTitle} id="sec-produtos">Produtos</h2>
          </div>

          <button className={styles.addProductBtn} onClick={handleAddProduct} disabled={addingProduct || catalogLoading} aria-label="Adicionar novo produto">
            <span aria-hidden="true">{Icon.plus}</span>
            {catalogLoading ? 'Carregando...' : addingProduct ? 'Adicionando...' : 'Adicionar produto'}
          </button>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className={styles.productList}>
                {localProducts.length === 0 && (
                  <div className={styles.emptyState}>
                    Nenhum produto ainda.
                    <small>Clique em "Adicionar produto" para começar.</small>
                  </div>
                )}
                {localProducts.map(p => (
                  <SortableProductRow key={p.id} id={p.id}>
                    {(listeners) => (
                      <div id={`product-${p.id}`} className={`${styles.productRow} ${newProductIdsRef.current.has(p.id) ? styles.productRowNew : ''}`}>
                        {newProductIdsRef.current.has(p.id) && <span className={styles.newBadge}>NOVO</span>}

                        {/* Col 1: drag */}
                        <DragHandle listeners={listeners} />

                        {/* Col 2: thumbnail */}
                        <div className={styles.thumb} onClick={() => handleImageClick(p.id)} role="button" tabIndex={0} aria-label="Trocar foto do produto" onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleImageClick(p.id) }}>
                          {uploadingId === p.id ? (
                            <div className={styles.uploadingOverlay}>
                              <div className={styles.uploadSpinner} aria-label="Enviando..." />
                            </div>
                          ) : p.imagem_url ? (
                            <img src={p.imagem_url} alt={p.nome || 'Produto'} />
                          ) : (
                            <div className={styles.thumbPlaceholder} aria-hidden="true">
                              <span className={styles.thumbPlaceholderIcon}>{Icon.image}</span>
                              <span className={styles.thumbPlaceholderText}>foto</span>
                            </div>
                          )}
                          <div className={styles.thumbOverlay} aria-hidden="true">
                            <span className={styles.thumbOverlayIcon}>{Icon.camera}</span>
                            <span className={styles.thumbOverlayText}>trocar</span>
                          </div>
                        </div>

                        {/* Col 3: fields */}
                        <div className={styles.fields}>
                          <div className={styles.rowTop}>
                            <input
                              className={styles.field}
                              placeholder="Nome do produto"
                              value={p.nome || ''}
                              onChange={e => handleProductChange(p.id, 'nome', e.target.value)}
                              aria-label="Nome do produto"
                            />
                            <select
                              className={styles.selectField}
                              value={p.categoria || ''}
                              onChange={e => handleProductChange(p.id, 'categoria', e.target.value)}
                              aria-label="Categoria"
                            >
                              <option value="">Categoria...</option>
                              {categorias.map((c, i) => <option key={i} value={c}>{c}</option>)}
                            </select>
                          </div>

                          <textarea
                            className={`${styles.field} ${styles.descField}`}
                            placeholder="Descrição curta..."
                            value={p.descricao || ''}
                            onChange={e => handleProductChange(p.id, 'descricao', e.target.value)}
                            rows={2}
                            aria-label="Descrição"
                          />

                          <div className={styles.rowMid}>
                            <div className={styles.priceGroup}>
                              <span className={styles.pricePrefix}>R$</span>
                              <input
                                className={styles.priceField}
                                placeholder="0,00"
                                value={p.preco ? (typeof p.preco === 'number' ? p.preco.toFixed(2).replace('.', ',') : p.preco.toString()) : ''}
                                onChange={e => handleProductChange(p.id, 'preco', e.target.value.replace(/[^\d,]/g, ''))}
                                aria-label="Preço"
                                inputMode="decimal"
                              />
                            </div>
                            {p.em_promocao && (
                              <div className={styles.priceGroup}>
                                <span className={styles.pricePrefix}>De R$</span>
                                <input
                                  className={styles.priceField}
                                  placeholder="0,00"
                                  value={p.preco_original ? (typeof p.preco_original === 'number' ? p.preco_original.toFixed(2).replace('.', ',') : p.preco_original.toString()) : ''}
                                  onChange={e => handleProductChange(p.id, 'preco_original', e.target.value.replace(/[^\d,]/g, ''))}
                                  aria-label="Preço original"
                                  inputMode="decimal"
                                />
                                {p.preco_original && p.preco && (() => {
                                  const po = parseFloat(String(p.preco_original).replace(',', '.'))
                                  const pr = parseFloat(String(p.preco).replace(',', '.'))
                                  const pct = Math.round(((po - pr) / po) * 100)
                                  return pct > 0 ? <span className={styles.discountBadge}>-{pct}%</span> : null
                                })()}
                              </div>
                            )}
                          </div>

                          <div className={styles.rowBottom}>
                            <label className={styles.checkRow}>
                              <input type="checkbox" className={styles.check} checked={!!p.em_promocao} onChange={e => handleProductChange(p.id, 'em_promocao', e.target.checked)} />
                              <span className={styles.checkLabel}>Em promoção</span>
                            </label>
                            <label className={styles.checkRow}>
                              <input type="checkbox" className={styles.check} checked={!!p.disponivel} onChange={e => handleProductChange(p.id, 'disponivel', e.target.checked)} />
                              <span className={styles.checkLabel}>Visível no catálogo</span>
                            </label>
                            <div className={styles.qtyGroup}>
                              <span className={styles.qtyLabel}>Estoque</span>
                              <input
                                type="number"
                                min="0"
                                className={styles.qtyField}
                                placeholder="∞"
                                value={p.quantidade ?? ''}
                                onChange={e => handleProductChange(p.id, 'quantidade', e.target.value === '' ? null : parseInt(e.target.value))}
                                aria-label="Quantidade em estoque"
                                inputMode="numeric"
                              />
                              {p.quantidade === 0 && <span className={styles.esgotadoTag}>ESGOTADO</span>}
                            </div>
                          </div>
                        </div>

                        {/* Col 4: delete */}
                        <button
                          className={styles.delBtnTop}
                          onClick={() => setDeleteConfirm(p.id)}
                          aria-label={`Excluir ${p.nome || 'produto'}`}
                          title="Excluir produto"
                        >
                          {Icon.trash}
                        </button>
                      </div>
                    )}
                  </SortableProductRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </div>

      {/* ── Hidden file input ── */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* ── Floating save ── */}
      <button
        className={styles.saveBtnFloat}
        onClick={handleSaveAll}
        disabled={saving || catalogLoading}
        aria-label="Salvar todas as alterações"
      >
        <span className={styles.saveBtnIcon} aria-hidden="true">{Icon.save}</span>
        {catalogLoading ? 'Carregando...' : saving ? 'Salvando...' : 'Salvar tudo'}
      </button>

      {saveMsg && (
        <div
          className={`${styles.saveMsg} ${saveMsgType === 'error' ? styles.saveMsgError : ''}`}
          role="status"
          aria-live="polite"
        >
          {saveMsg}
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-label="Confirmar exclusão">
          <div className={styles.confirmModal}>
            <h3>Excluir produto</h3>
            <p>Esta ação não pode ser desfeita. Deseja continuar?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className={styles.deleteConfirmBtn} onClick={executeDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding ── */}
      {showOnboarding && (
        <div className={styles.confirmOverlay} onClick={() => setShowOnboarding(false)} role="dialog" aria-modal="true" aria-label="Bem-vindo ao painel">
          <div className={styles.onboardingModal} onClick={e => e.stopPropagation()}>
            <div className={styles.onboardingTop}>
              <div className={styles.onboardingIconWrap} aria-hidden="true">
                <span className={styles.onboardingIconSvg}>{Icon.wave}</span>
              </div>
              <h3 className={styles.onboardingTitle}>Bem-vindo ao painel!</h3>
            </div>
            <ul className={styles.onboardingList}>
              {[
                { text: <><strong>Personalize</strong> cores, logo e informações da loja</> },
                { text: <><strong>Adicione produtos</strong> com fotos, preços e categorias</> },
                { text: <>Arraste os produtos para <strong>reordená-los</strong></> },
                { text: <>Clique em <strong>"Salvar tudo"</strong> para publicar as alterações</> },
                { text: <>Compartilhe o <strong>link do catálogo</strong> com seus clientes</> },
              ].map((item, i) => (
                <li key={i}>
                  <span className={styles.onboardingBullet} aria-hidden="true">
                    <span className={styles.onboardingBulletIcon}>{Icon.check}</span>
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <button
              className={styles.authBtn}
              onClick={() => { localStorage.setItem('admin_onboarding_seen', 'true'); setShowOnboarding(false) }}
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
