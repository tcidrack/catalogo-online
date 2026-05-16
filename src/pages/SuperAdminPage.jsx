import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLojas } from '../hooks/useLojas'
import { useSuperAdminAuth } from '../hooks/useAuth'
import { linkCliente, linkAdmin, copiar } from '../utils/storeLinks'
import styles from './SuperAdminPage.module.css'

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  stores: (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M2 7h14M3 7V15h12V7M6 7V4a3 3 0 016 0v3" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" />
    </svg>
  ),
  external: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M6 2H2v10h10V8M9 2h3v3M12 2L7 7" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" width="14" height="14">
      <path d="M6 3H3v10h3M10 5l3 3-3 3M13 8H6" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
      <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M4.5 3.5l.5 8h4l.5-8" />
    </svg>
  ),
}

export default function SuperAdminPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading, login, logout } = useSuperAdminAuth()
  const { lojas, loading: lojasLoading, createLoja, toggleAtivo, reload } = useLojas()
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [newStoreName, setNewStoreName] = useState('')
  const [newStorePassword, setNewStorePassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('ok')
  const [deleteTarget, setDeleteTarget] = useState(null)

  if (loading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.loadingSpinner} />
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

  const handleCreateStore = async (e) => {
    e.preventDefault()
    if (!newStoreName.trim()) return
    setCreating(true)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase.functions.invoke('create-store', {
        body: { storeName: newStoreName, storePassword: newStorePassword || null }
      })

      if (error) {
        let details = ''
        try {
          if (error.context) {
            details = await error.context.text()
            const parsed = JSON.parse(details)
            details = parsed.error || parsed.message || details
          }
        } catch (e) { /* ignore */ }
        throw new Error(details || error.message)
      }

      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido')

      setMessageType('ok')
      setMessage(data.message)
      setNewStoreName('')
      setNewStorePassword('')
      reload()
    } catch (err) {
      setMessageType('error')
      setMessage('Erro: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { id, nome, slug } = deleteTarget
    try {
      const { error } = await supabase.functions.invoke('delete-store', { body: { lojaId: id, slug } })
      if (error) throw error
      setMessageType('ok')
      setMessage(`Loja "${nome}" removida`)
      reload()
    } catch (err) {
      setMessageType('error')
      setMessage('Erro: ' + err.message)
    } finally {
      setDeleteTarget(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authIconWrap} aria-hidden="true">
            <span className={styles.authIcon}>{Icon.lock}</span>
          </div>
          <h2 className={styles.authTitle}>Super Admin</h2>
          <form onSubmit={handleLogin} className={styles.authForm}>
            <input
              type="password"
              className={styles.authInput}
              placeholder="Senha do Super Admin"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
            <button type="submit" className={styles.authBtn}>Entrar</button>
            {authError && <p className={styles.authError} role="alert">{authError}</p>}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.headerTitle}>Super Admin</span>
        <button onClick={() => { logout(); navigate('/') }} className={styles.logoutBtn}>
          {Icon.logout} Sair
        </button>
      </header>

      <div className={styles.body}>
        {message && (
          <div
            className={`${styles.message} ${messageType === 'error' ? styles.messageError : ''}`}
            role="status"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        {/* ── Nova Loja ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.plus}</span>
            <h2 className={styles.sectionTitle}>Nova Loja</h2>
          </div>
          <form onSubmit={handleCreateStore} className={styles.createForm}>
            <input
              type="text"
              className={styles.input}
              placeholder="Nome da loja"
              value={newStoreName}
              onChange={e => setNewStoreName(e.target.value)}
              required
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Senha (opcional — para proteger o admin)"
              value={newStorePassword}
              onChange={e => setNewStorePassword(e.target.value)}
            />
            <button type="submit" className={styles.createBtn} disabled={creating}>
              <span aria-hidden="true">{Icon.plus}</span>
              {creating ? 'Criando...' : 'Criar Loja'}
            </button>
          </form>
        </section>

        {/* ── Lojas cadastradas ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon} aria-hidden="true">{Icon.stores}</span>
            <h2 className={styles.sectionTitle}>Lojas Cadastradas</h2>
          </div>
          {lojasLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : lojas.length === 0 ? (
            <p className={styles.emptyText}>Nenhuma loja cadastrada.</p>
          ) : (
            <div className={styles.storeList}>
              {lojas.map(loja => {
                const clientUrl = linkCliente(loja.slug)
                const adminUrl = linkAdmin(loja.slug)
                return (
                  <div key={loja.id} className={styles.storeCard}>
                    <div className={styles.storeInfo}>
                      <div className={styles.storeNameRow}>
                        <h3 className={styles.storeName}>{loja.nome}</h3>
                        <span className={`${styles.status} ${loja.ativo ? styles.active : styles.inactive}`}>
                          {loja.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <span className={styles.slugChip}>{loja.slug}</span>
                    </div>
                    <div className={styles.storeActions}>
                      <div className={styles.actionRowLinks}>
                        <a href={clientUrl} target="_blank" rel="noopener noreferrer" className={styles.openLink}>
                          <span aria-hidden="true">{Icon.external}</span> Catálogo
                        </a>
                        <a href={adminUrl} target="_blank" rel="noopener noreferrer" className={styles.openLink}>
                          <span aria-hidden="true">{Icon.external}</span> Admin
                        </a>
                      </div>
                      <div className={styles.actionRowCopy}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => { copiar(clientUrl); setMessageType('ok'); setMessage('Link copiado!'); setTimeout(() => setMessage(''), 2000) }}
                        >
                          <span aria-hidden="true">{Icon.copy}</span> Copiar cliente
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={() => { copiar(adminUrl); setMessageType('ok'); setMessage('Link copiado!'); setTimeout(() => setMessage(''), 2000) }}
                        >
                          <span aria-hidden="true">{Icon.copy}</span> Copiar admin
                        </button>
                      </div>
                      <div className={styles.actionRowManage}>
                        <button
                          className={`${styles.actionBtn} ${loja.ativo ? styles.deactivateBtn : styles.activateBtn}`}
                          onClick={() => toggleAtivo(loja.id, loja.ativo)}
                        >
                          {loja.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteTarget({ id: loja.id, nome: loja.nome, slug: loja.slug })}
                        >
                          <span aria-hidden="true">{Icon.trash}</span> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Confirmar exclusão ── */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-label="Confirmar remoção">
          <div className={styles.confirmModal}>
            <h3>Remover loja</h3>
            <p>Remover "{deleteTarget.nome}"? Esta ação não pode ser desfeita.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className={styles.deleteConfirmBtn} onClick={handleDelete}>Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
