import { useState, useEffect, useRef } from 'react'
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase, crudSupabase } from '../lib/supabase'
import { useStoreAdminAuth } from '../hooks/useAuth'
import { useCatalogo } from '../hooks/useCatalogo'
import { linkCliente } from '../utils/storeLinks'
import styles from './StoreAdminView.module.css'

const formatPrice = (price) => {
  if (!price && price !== 0) return ''
  const num = parseFloat(price.toString().replace(',', '.'))
  if (isNaN(num)) return ''
  return num.toLocaleString('pt-BR', { 
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  })
}

const formatInputPrice = (price) => {
  if (!price && price !== 0) return ''
  const num = parseFloat(price.toString().replace(',', '.'))
  if (isNaN(num)) return ''
  return num.toFixed(2).replace('.', ',')
}

function SortableProductRow({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  )
}

export default function StoreAdminView({ loja }) {
  // ALL HOOKS AT THE TOP - always in same order
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
  const [addingProduct, setAddingProduct] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [localProducts, setLocalProducts] = useState([])
  const fileInputRef = useRef(null)
  const pendingUploadId = useRef(null)
  const newProductIdsRef = useRef(new Set())
  const productListRef = useRef(null)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('admin_onboarding_seen'))
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // ALL useEffect HOOKS MUST BE HERE, BEFORE ANY RETURNS
  useEffect(() => {
    if (config) setLocalConfig(config)
  }, [config])

  useEffect(() => {
    if (!produtos) return
    setLocalProducts(prev => {
      if (prev.length === produtos.length && prev.every((p, i) => p.id === produtos[i].id)) {
        return prev
      }
      return produtos
    })
  }, [loja?.id, produtos])

  useEffect(() => {
    if (config && !categoriasInitialized.current) {
      if (config.categorias && Array.isArray(config.categorias) && config.categorias.length >0) {
        setCategorias(config.categorias)
      } else {
        const defaultCats = ['Aneis', 'Colares', 'Brincos', 'Pulseiras', 'Outros']
        setCategorias(defaultCats)
        if (config.id) {
          updateCategorias(defaultCats).catch(e => console.error('Failed to save default categories:', e))
        }
      }
      categoriasInitialized.current = true
    }
  }, [config])

  useEffect(() => {
    if (!settingPassword) {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMsg('')
    }
  }, [settingPassword])

  // NOW the conditional returns
  // Exibir loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDiamond}>&#x1F48E;</div>
        <div>Verificando permissões...</div>
      </div>
    )
  }

  // Se autenticado mas não é dono da loja
  if (!storeVerified && isAuthenticated) {
    return (
      <div className={styles.error}>
        <h2>Acesso não autorizado</h2>
        <p>Você não tem permissão para acessar esta loja.</p>
        <button onClick={logout} className={styles.logoutBtn}>Sair</button>
      </div>
    )
  }

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
          <a href={linkCliente(loja.slug)} className={styles.backLink}>← Voltar ao catalogo</a>
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
    if (saving || catalogLoading) return
    setSaving(true)
    setSaveMsg('')

    try {
      try {
        await saveConfig(localConfig)
      } catch (e) {
        console.error('ERRO AO SALVAR CONFIG:', e)
        setSaveMsg('Erro ao salvar configuração: ' + (e.message || JSON.stringify(e)))
        setSaving(false)
        return
      }

      const failures = []
      for (const p of localProducts) {
        if (!p.id) continue
        try {
          const precoVal = parseFloat(String(p.preco ?? '').replace(',', '.'))
          const precoOriginalVal = p.preco_original ? parseFloat(String(p.preco_original).replace(',', '.')) : null

          let quantidade = null
          if (!(p.quantidade === '' || p.quantidade === null || p.quantidade === undefined || p.quantidade === 'undefined')) {
            const parsed = parseInt(p.quantidade, 10)
            if (!isNaN(parsed)) quantidade = parsed
          }

          await updateProduto(p.id, {
            nome: p.nome || '',
            descricao: p.descricao || '',
            categoria: p.categoria || '',
            preco: isNaN(precoVal) ? 0 : precoVal,
            preco_original: isNaN(precoOriginalVal) ? null : precoOriginalVal,
            em_promocao: !!p.em_promocao,
            disponivel: !!p.disponivel,
            quantidade
          })
        } catch (e) {
          console.error('FALHA AO SALVAR PRODUTO:', p.id, p.nome, e)
          failures.push({ id: p.id, nome: p.nome, erro: e.message || String(e) })
        }
      }

      if (failures.length > 0) {
        console.error('PRODUTOS COM FALHA:', failures)
        const nomes = failures.map(f => `${f.nome} (id ${f.id})`).join(', ')
        setSaveMsg('Erro ao salvar: ' + nomes + ' — ' + failures[0].erro)
      } else {
        newProductIdsRef.current.clear()
        setSaveMsg('Catalogo salvo com sucesso!')
        setTimeout(() => setSaveMsg(''), 3000)
      }
    } finally {
      setSaving(false)
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

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setPasswordMsg('Erro: ' + error.message)
    } else {
      setPasswordMsg('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      setSettingPassword(false)
      setTimeout(() => setPasswordMsg(''), 3000)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `loja-${loja.id}/${fileName}`

      const { error: uploadError } = await crudSupabase.storage
        .from('catalogo-imagens')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = crudSupabase.storage
        .from('catalogo-imagens')
        .getPublicUrl(filePath)

      handleConfigChange('logo_url', publicUrl)
    } catch (err) {
      alert('Erro no upload da logo: ' + err.message)
    }
  }

  const handleRemoveLogo = () => {
    handleConfigChange('logo_url', '')
  }

  const handleAddProduct = async () => {
    if (addingProduct || catalogLoading) return
    setAddingProduct(true)
    try {
      const newP = await addProduto()
      newProductIdsRef.current.add(newP.id)
      setLocalProducts(prev => [...prev, newP])
      setTimeout(() => {
        document.getElementById(`product-${newP.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    } catch (e) {
      console.error('Erro ao adicionar produto:', e)
      alert('Erro ao adicionar produto: ' + (e.message || JSON.stringify(e)))
    } finally {
      setAddingProduct(false)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const reordered = (() => {
      setLocalProducts(prev => {
        const oldIndex = prev.findIndex(p => p.id === active.id)
        const newIndex = prev.findIndex(p => p.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        const updated = [...prev]
        const [moved] = updated.splice(oldIndex, 1)
        updated.splice(newIndex, 0, moved)
        reorderProdutos(updated.map(p => p.id)).catch(e => console.error('Erro ao salvar ordem:', e))
        return updated
      })
    })()
  }

  const handleImageClick = (id) => {
    pendingUploadId.current = id
    fileInputRef.current?.click()
  }

  const handleDeleteProduct = (id) => {
    setDeleteConfirm(id)
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

  const executeDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteProduto(deleteConfirm)
      setLocalProducts(prev => prev.filter(p => p.id !== deleteConfirm))
    } catch (e) {
      console.error('Erro ao remover produto:', e)
      alert('Erro ao remover: ' + e.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erro ao carregar</h2>
        <p>{error}</p>
      </div>
    )
  }

  const EMOJIS = { 'Aneis': '💍', 'Colares': '📿', 'Brincos': '✨', 'Pulseiras': '⭕', 'Outros': '🌟' }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <div className={styles.headerLeft}>
            <a href={linkCliente(loja.slug)} className={styles.backLink}>← Ver catalogo</a>
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
            <label className={styles.label}>Mensagem Padrão WhatsApp</label>
            <input
              className={styles.input}
              placeholder="Olá! Gostaria de saber mais sobre:"
              value={localConfig.whatsapp_msg_prefix || ''}
              onChange={(e) => handleConfigChange('whatsapp_msg_prefix', e.target.value)}
            />
            <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
              Texto antes do nome do produto na mensagem do WhatsApp
            </small>
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Exibir Quantidades</label>
            <div className={styles.toggleRow}>
              <label className={styles.toggle}>
                <input 
                  type="checkbox" 
                  checked={!!localConfig.mostrar_quantidade} 
                  onChange={(e) => handleConfigChange('mostrar_quantidade', e.target.checked)} 
                />
                <span className={styles.slider} />
              </label>
              <span className={styles.toggleLabel}>Mostrar quantidades disponíveis no catálogo</span>
            </div>
            <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
              Quando ativado, produtos aparecerão com estoque. Produtos zerados aparecerão como "ESGOTADO".
            </small>
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
          <div className={styles.configCard}>
            <label className={styles.label}>Cor do Topo</label>
            <div className={styles.colorRow}>
              <input type="color" value={localConfig.cor_topo || '#1a1a2e'} onChange={(e) => handleConfigChange('cor_topo', e.target.value)} className={styles.colorInput} />
              <span className={styles.colorHex}>{localConfig.cor_topo || '#1a1a2e'}</span>
            </div>
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Cor do Rodapé</label>
            <div className={styles.colorRow}>
              <input type="color" value={localConfig.cor_rodape || '#1a1a2e'} onChange={(e) => handleConfigChange('cor_rodape', e.target.value)} className={styles.colorInput} />
              <span className={styles.colorHex}>{localConfig.cor_rodape || '#1a1a2e'}</span>
            </div>
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Cor de Fundo</label>
            <div className={styles.colorRow}>
              <input type="color" value={localConfig.cor_fundo || '#fafafa'} onChange={(e) => handleConfigChange('cor_fundo', e.target.value)} className={styles.colorInput} />
              <span className={styles.colorHex}>{localConfig.cor_fundo || '#fafafa'}</span>
            </div>
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Fonte do Texto</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {[
                { value: 'Arial, sans-serif', label: 'Arial' },
                { value: 'Helvetica, sans-serif', label: 'Helvetica' },
                { value: 'Georgia, serif', label: 'Georgia' },
                { value: "'Times New Roman', serif", label: 'Times New Roman' },
                { value: "'Courier New', monospace", label: 'Courier New' },
                { value: 'Verdana, sans-serif', label: 'Verdana' },
                { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
                { value: 'Impact, sans-serif', label: 'Impact' },
                { value: "'Comic Sans MS', cursive", label: 'Comic Sans MS' },
                { value: 'Palatino, serif', label: 'Palatino' },
                { value: 'Garamond, serif', label: 'Garamond' },
                { value: "'Open Sans', sans-serif", label: 'Open Sans' },
                { value: "'Roboto', sans-serif", label: 'Roboto' },
                { value: "'Lato', sans-serif", label: 'Lato' },
                { value: "'Montserrat', sans-serif", label: 'Montserrat' },
                { value: "'Poppins', sans-serif", label: 'Poppins' },
              ].map(font => (
                <label
                  key={font.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    border: `1px solid ${localConfig.fonte_texto === font.value ? '#C9A84C' : '#444'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: font.value,
                    color: '#fff',
                    background: localConfig.fonte_texto === font.value ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    value={font.value}
                    checked={localConfig.fonte_texto === font.value}
                    onChange={(e) => handleConfigChange('fonte_texto', e.target.value)}
                    style={{ accentColor: '#C9A84C' }}
                  />
                  <span>{font.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className={styles.configCard}>
            <label className={styles.label}>Logo da Loja</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {localConfig.logo_url && (
                <>
                  <img src={localConfig.logo_url} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                  <button type="button" className={styles.removeLogoBtn} onClick={handleRemoveLogo}>
                    ✕ Remover
                  </button>
                </>
              )}
              <label style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
              >
                📁 Escolher arquivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
              </label>
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
            <form onSubmit={handleSetPassword} className={styles.passwordForm}>
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

        <h2 className={styles.sectionTitle}>Categorias <span>◆</span></h2>
        <div className={styles.promoBox}>
          <button
            className={styles.addBtn}
            onClick={() => setGerenciandoCategorias(!gerenciandoCategorias)}
          >
            {gerenciandoCategorias ? 'Fechar' : 'Gerenciar Categorias'}
          </button>

          {gerenciandoCategorias && (
            <div style={{ marginTop: '1rem' }}>
              {categorias.map((cat, idx) => (
                <div key={idx} className={styles.catRow}>
                  <span>{cat}</span>
                  <button
                    className={styles.delBtn}
                    onClick={() => {
                      const novas = categorias.filter((_, i) => i !== idx)
                      setCategorias(novas)
                      updateCategorias(novas)
                    }}
                  >×</button>
                </div>
              ))}

              <div className={styles.catAddRow}>
                <input
                  className={styles.input}
                  placeholder="Nova categoria"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                />
                <button
                  className={styles.saveBtn}
                  onClick={async () => {
                    if (novaCategoria.trim() && !categorias.includes(novaCategoria.trim())) {
                      const novas = [...categorias, novaCategoria.trim()]
                      setCategorias(novas)
                      try {
                        await updateCategorias(novas)
                        setNovaCategoria('')
                      } catch (e) {
                        alert('Erro ao salvar categoria: ' + e.message)
                        setCategorias(categorias)
                      }
                    }
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>

        <h2 className={styles.sectionTitle}>Promocao <span>◆</span></h2>
        <div className={styles.promoBox}>
          <div className={styles.toggleRow}>
            <label className={styles.toggle}>
              <input type="checkbox" checked={!!localConfig.promo_ativa} onChange={(e) => handleConfigChange('promo_ativa', e.target.checked)} />
              <span className={styles.slider} />
            </label>
            <span className={styles.toggleLabel}>Ativar banner de promocao no topo do catalogo</span>
          </div>
          <input
            className={styles.input}
            placeholder="Ex: 20% OFF em brincos este fim de semana!"
            value={localConfig.promo_texto || ''}
            onChange={(e) => handleConfigChange('promo_texto', e.target.value)}
          />
          <div className={styles.configCard}>
            <label className={styles.label}>Cor do Banner</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={localConfig.promo_cor || '#4caf50'}
                onChange={(e) => handleConfigChange('promo_cor', e.target.value)}
                className={styles.colorInput}
              />
              <span className={styles.colorHex}>{localConfig.promo_cor || '#4caf50'}</span>
            </div>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>Produtos <span>◆</span></h2>
        
        <div className={styles.promoBox} style={{ marginBottom: '1rem' }}>
          <div className={styles.configCard}>
            <label className={styles.label}>Cor do selo % OFF</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={localConfig.promo_badge_cor || '#FA098A'}
                onChange={(e) => handleConfigChange('promo_badge_cor', e.target.value)}
                className={styles.colorInput}
              />
              <span className={styles.colorHex}>{localConfig.promo_badge_cor || '#FA098A'}</span>
            </div>
            <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
              Esta cor será aplicada no selo de desconto dos produtos em promoção.
            </small>
          </div>
        </div>

        <button className={styles.addBtn} onClick={handleAddProduct} disabled={addingProduct || catalogLoading}>
          {catalogLoading ? 'Carregando...' : addingProduct ? 'Adicionando...' : '+ Adicionar produto'}
        </button>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className={styles.productList}>
              {localProducts.length === 0 && (
                <div className={styles.emptyState}>
                  Nenhum produto ainda.<br />
                  <small>Clique em "+ Adicionar produto" para comecar.</small>
                </div>
              )}
              {localProducts.map(p => (
                <SortableProductRow key={p.id} id={p.id}>
                  {(listeners) => (
                    <div id={`product-${p.id}`} className={`${styles.productRow} ${newProductIdsRef.current.has(p.id) ? styles.productRowNew : ''}`}>
                      {newProductIdsRef.current.has(p.id) && <span className={styles.newBadge}>NOVO</span>}
                      <span {...listeners} className={styles.dragHandle} title="Arrastar para reordenar">⠿</span>
                      <button className={styles.delBtnTop} onClick={() => handleDeleteProduct(p.id)} title="Remover produto">×</button>
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
                           <select
                            className={styles.select}
                            value={p.categoria || ''}
                            onChange={(e) => {
                              handleProductChange(p.id, 'categoria', e.target.value)
                            }}
                          >
                            <option value="">Selecione...</option>
                            {Array.isArray(categorias) ? categorias.map((c, i) => (
                              <option key={i} value={c}>{c}</option>
                            )) : null}
                          </select>
                        </div>
                          <div className={styles.rowMid}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#fff', fontSize: '0.9rem' }}>R$</span>
                              <input
                                className={styles.field}
                                placeholder="89,90"
                                value={p.preco ? (typeof p.preco === 'number' ? p.preco.toFixed(2).replace('.', ',') : p.preco.toString()) : ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^\d,]/g, '')
                                  handleProductChange(p.id, 'preco', val)
                                }}
                              />
                            </div>
                            {p.em_promocao && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#fff', fontSize: '0.9rem' }}>R$</span>
                                <input
                                  className={`${styles.field} ${styles.promoField}`}
                                  placeholder="Preço original"
                                  value={p.preco_original ? (typeof p.preco_original === 'number' ? p.preco_original.toFixed(2).replace('.', ',') : p.preco_original.toString()) : ''}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/[^\d,]/g, '')
                                    handleProductChange(p.id, 'preco_original', val)
                                  }}
                                />
                                {p.preco_original && p.preco && (
                                  <span style={{ color: '#4caf50', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                    {Math.round(((parseFloat(p.preco_original.toString().replace(',', '.')) - parseFloat(p.preco.toString().replace(',', '.'))) / parseFloat(p.preco_original.toString().replace(',', '.'))) * 100)}% OFF
                                  </span>
                                )}
                              </div>
                            )}
                            <label className={styles.checkRow}>
                              <input type="checkbox" checked={!!p.em_promocao} onChange={(e) => handleProductChange(p.id, 'em_promocao', e.target.checked)} className={styles.check} />
                              <span className={styles.checkLabel}>Promo</span>
                          </label>
                        </div>
                        <input className={`${styles.field} ${styles.descField}`} placeholder="Descricao curta..." value={p.descricao || ''} onChange={(e) => handleProductChange(p.id, 'descricao', e.target.value)} />
                        <label className={styles.checkRow}>
                          <input type="checkbox" checked={!!p.disponivel} onChange={(e) => handleProductChange(p.id, 'disponivel', e.target.checked)} className={styles.check} />
                          <span className={styles.checkLabel}>Visivel no catalogo</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ color: '#fff', fontSize: '0.9rem' }}>Qtd:</span>
                          <input
                            type="number"
                            min="0"
                            className={styles.field}
                            style={{ maxWidth: '80px' }}
                            placeholder="∞"
                            value={p.quantidade ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseInt(e.target.value)
                              handleProductChange(p.id, 'quantidade', val)
                            }}
                          />
                          {p.quantidade === 0 && (
                            <span style={{ color: '#f44336', fontSize: '0.85rem', fontWeight: 'bold' }}>
                              ESGOTADO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </SortableProductRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button className={styles.saveBtnFloat} onClick={handleSaveAll} disabled={saving || catalogLoading}>
          {catalogLoading ? 'Carregando...' : saving ? 'Salvando...' : 'Salvar tudo'}
        </button>
        {saveMsg && <p className={styles.saveMsg}>{saveMsg}</p>}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {deleteConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja remover este produto?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </button>
              <button className={styles.deleteConfirmBtn} onClick={executeDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className={styles.confirmOverlay} onClick={() => setShowOnboarding(false)}>
          <div className={styles.onboardingModal} onClick={e => e.stopPropagation()}>
            <div className={styles.onboardingIcon}>👋</div>
            <h3>Bem-vindo ao Painel!</h3>
            <ul className={styles.onboardingList}>
              <li>🎨 Personalize cores, logo e informações da loja na seção <strong>"Personalizar loja"</strong></li>
              <li>📦 Adicione produtos com o botão <strong>"+ Adicionar produto"</strong></li>
              <li>↕️ Arraste os produtos para reordenar</li>
              <li>💾 Clique em <strong>"Salvar tudo"</strong> para publicar as alterações</li>
              <li>🔗 Compartilhe o link do seu catálogo com seus clientes!</li>
            </ul>
            <button
              className={styles.authBtn}
              style={{ marginTop: '1rem' }}
              onClick={() => {
                localStorage.setItem('admin_onboarding_seen', 'true')
                setShowOnboarding(false)
              }}
            >
              Entendi!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
