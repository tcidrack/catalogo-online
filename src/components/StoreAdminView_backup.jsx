import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useStoreAdminAuth } from '../hooks/useAuth'
import { useCatalogo } from '../hooks/useCatalogo'
import { linkCliente } from '../utils/storeLinks'
import styles from './StoreAdminView.module.css'

const CATS = ['Anéis', 'Colares', 'Brincos', 'Pulseiras', 'Outros']

export default function StoreAdminView({ loja }) {
  const { isAuthenticated, login, logout } = useStoreAdminAuth(loja.slug)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      login('')
    }
  }, [])

  const { produtos, config, loading, error, saveConfig, addProduto, updateProduto, deleteProduto, uploadImagem } = useCatalogo(loja.id)

  const [localConfig, setLocalConfig] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [localProducts, setLocalProducts] = useState([])
  const fileInputRef = useRef(null)
  const pendingUploadId = useRef(null)

  useEffect(() => {
    if (config) setLocalConfig(config)
    if (produtos) setLocalProducts(produtos)
  }, [config, produtos])

  const handleLogin = async (e) => {
    e.preventDefault()
    const success = await login(password)
    if (success) {
      setAuthError('')
    } else {
      setAuthError('Senha incorreta')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authLogo}>🔐</div>
          <h2>Admin: {loja.nome}</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className={styles.authInput}
              placeholder="Senha do administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.authBtn}>Entrar</button>
            {authError && <p className={styles.authError}>{authError}</p>}
          </form>
          <a href={linkCliente(loja.slug)} className={styles.backLink}>← Voltar ao catálogo</a>
        </div>
      </div>
    )
  }

  const handleConfigChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleProductChange = (id, field, value) => {
    setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setSaveMsg('')
    try {
      await saveConfig(localConfig)
      await Promise.all(localProducts.map(p =>
        updateProduto(p.id, {
          nome: p.nome,
          descricao: p.descricao,
          categoria: p.categoria,
          preco: parseFloat(p.preco) || 0,
          preco_original: p.preco_original ? parseFloat(p.preco_original) : null,
          em_promocao: p.em_promocao,
          disponivel: p.disponivel,
        })
      ))
      setSaveMsg('Catálogo salvo com sucesso! ✦')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (e) {
      setSaveMsg('Erro ao salvar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async () => {
    setAddingProduct(true)
    try {
      const newP = await addProduto()
      setLocalProducts(prev => [...prev, newP])
    } catch (e) {
      alert('Erro ao adicionar produto: ' + e.message)
    } finally {
      setAddingProduct(false)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!confirm('Remover este produto?')) return
    try {
      await deleteProduto(id)
      setLocalProducts(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      alert('Erro ao remover: ' + e.message)
    }
  }

  const handleImageClick = (id) => {
    pendingUploadId.current = id
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    const id = pendingUploadId.current
    if (!file || !id) return
    setUploadingId(id)
    try {
      const url = await uploadImagem(id, file)
      setLocalProducts(prev => prev.map(p => p.id === id ? { ...p, imagem_url: url } : p))
    } catch (err) {
      alert('Erro no upload: ' + err.message)
    } finally {
      setUploadingId(null)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Senhas não coincidem')
      return
    }
    if (newPassword.length < 4) {
      setPasswordMsg('Senha muito curta (mínimo 4 caracteres)')
      return
    }

    const { data, error } = await supabase
      .rpc('set_store_password', {
        store_slug: loja.slug,
        new_password: newPassword
      })

    if (error) {
      setPasswordMsg('Erro: ' + error.message)
    } else {
      setPasswordMsg('Senha definida com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      setSettingPassword(false)
      setTimeout(() => setPasswordMsg(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDiamond}>💎</div>
        <div>Carregando...</div>
      </div>
    )
  }

  const EMOJIS = { 'Anéis': '💍', 'Colares': '📿', 'Brincos': '✨', 'Pulseiras': '⭕', 'Outros': '🌟' }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            <a href={linkCliente(loja.slug)} className={styles.backLink}>← Ver catálogo</a>
          </div>
          <div className={styles.headerTitle}>Painel da Loja</div>
          <div className={styles.headerSub}>{loja.nome}</div>
        </div>
        <button onClick={logout} className={styles.logoutBtn}>Sair</button>
      </div>

      <div className={styles.body}>
        <h2 className={styles.sectionTitle}>Personalizar loja <span>◆</span></h2>
        <div className={styles.configGrid}>
          <div className={styles.configCard}>
            <label className={styles.label}>Nome da loja</label>
            <input className={styles.input} value={localConfig.nome || ''} onChange={(e) => handleConfigChange('nome', e.target.value)} />
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Slogan</label>
            <input className={styles.input} value={localConfig.slogan || ''} onChange={(e) => handleConfigChange('slogan', e.target.value)} />
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>WhatsApp (com DDD)</label>
            <input className={styles.input} placeholder="85999999999" value={localConfig.whatsapp || ''} onChange={(e) => handleConfigChange('whatsapp', e.target.value)} />
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Instagram</label>
            <input className={styles.input} placeholder="@sualoja" value={localConfig.instagram || ''} onChange={(e) => handleConfigChange('instagram', e.target.value)} />
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Cor principal</label>
            <div className={styles.colorRow}>
              <input type="color" value={localConfig.cor_principal || '#C9A84C'} onChange={(e) => handleConfigChange('cor_principal', e.target.value)} className={styles.colorInput} />
              <span className={styles.colorHex}>{localConfig.cor_principal || '#C9A84C'}</span>
            </div>
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Cor de destaque</label>
            <div className={styles.colorRow}>
              <input type="color" value={localConfig.cor_destaque || '#C47B82'} onChange={(e) => handleConfigChange('cor_destaque', e.target.value)} className={styles.colorInput} />
              <span className={styles.colorHex}>{localConfig.cor_destaque || '#C47B82'}</span>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Definir Senha de Acesso <span>◆</span></h2>
        <div className={styles.promoBox}>
          <button
            className={styles.addBtn}
            onClick={() => setSettingPassword(!settingPassword)}
          >
            {settingPassword ? 'Cancelar' : 'Alterar Senha'}
          </button>
          {settingPassword && (
            <form onSubmit={handleSetPassword} style={{ marginTop: '1rem' }}>
              <input
                type="password"
                className={styles.input}
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                className={styles.input}
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="submit" className={styles.saveBtn}>Salvar Senha</button>
              {passwordMsg && <p className={styles.saveMsg}>{passwordMsg}</p>}
            </form>
          )}
        </div>

        <h2 className={styles.sectionTitle}>Promoção <span>◆</span></h2>
        <div className={styles.promoBox}>
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input type="checkbox" checked={!!localConfig.promo_ativa} onChange={(e) => handleConfigChange('promo_ativa', e.target.checked)} />
              <span className={styles.slider} />
            </label>
            <span className={styles.toggleLabel}>Ativar banner de promoção no topo do catálogo</span>
          </div>
          <input
            className={styles.input}
            placeholder="Ex: 20% OFF em brincos este fim de semana!"
            value={localConfig.promo_texto || ''}
            onChange={(e) => handleConfigChange('promo_texto', e.target.value)}
          />
        </div>

        <h2 className={styles.sectionTitle}>Produtos <span>◆</span></h2>
        <button className={styles.addBtn} onClick={handleAddProduct} disabled={addingProduct}>
          {addingProduct ? 'Adicionando...' : '+ Adicionar produto'}
        </button>

        <div className={styles.productList}>
          {localProducts.length === 0 && (
            <div className={styles.emptyState}>
              Nenhum produto ainda.<br />
              <small>Clique em "+ Adicionar produto" para começar.</small>
            </div>
          )}
          {localProducts.map(p => (
            <div key={p.id} className={styles.productRow}>
              <div className={styles.thumb} onClick={() => handleImageClick(p.id)} title="Clique para trocar a foto">
                {uploadingId === p.id
                  ? <span className={styles.uploading}>⏳</span>
                  : p.imagem_url
                    ? <img src={p.imagem_url} alt={p.nome} />
                    : <span>{EMOJIS[p.categoria] || '✨'}</span>
                }
                <div className={styles.thumbOverlay}>trocar foto</div>
              </div>

              <div className={styles.fields}>
                <div className={styles.rowTop}>
                  <input className={styles.field} placeholder="Nome do produto" value={p.nome} onChange={(e) => handleProductChange(p.id, 'nome', e.target.value)} />
                  <select className={styles.select} value={p.categoria} onChange={(e) => handleProductChange(p.id, 'categoria', e.target.value)}>
                    {CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <button className={styles.delBtn} onClick={() => handleDeleteProduct(p.id)}>×</button>
                </div>
                <div className={styles.rowMid}>
                  <input className={styles.field} placeholder="Preço (ex: 89.90)" value={p.preco} onChange={(e) => handleProductChange(p.id, 'preco', e.target.value)} />
                  <input className={`${styles.field} ${styles.promoField}`} placeholder="Preço original (se tiver promo)" value={p.preco_original || ''} onChange={(e) => handleProductChange(p.id, 'preco_original', e.target.value)} />
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={!!p.em_promocao} onChange={(e) => handleProductChange(p.id, 'em_promocao', e.target.checked)} className={styles.check} />
                    <span className={styles.checkLabel}>Promo</span>
                  </label>
                </div>
                <input className={`${styles.field} ${styles.descField}`} placeholder="Descrição curta..." value={p.descricao || ''} onChange={(e) => handleProductChange(p.id, 'descricao', e.target.value)} />
                <label className={styles.checkRow}>
                  <input type="checkbox" checked={!!p.disponivel} onChange={(e) => handleProductChange(p.id, 'disponivel', e.target.checked)} className={styles.check} />
                  <span className={styles.checkLabel}>Visível no catálogo</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button className={styles.saveBtn} onClick={handleSaveAll} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar tudo'}
        </button>
        {saveMsg && <p className={styles.saveMsg}>{saveMsg}</p>}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  )
}
