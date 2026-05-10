import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLojas } from '../hooks/useLojas'
import { useSuperAdminAuth } from '../hooks/useAuth'
import { linkCliente, linkAdmin, copiar } from '../utils/storeLinks'
import styles from './SuperAdminPage.module.css'

export default function SuperAdminPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading, login, logout } = useSuperAdminAuth()
  const { lojas, loading: lojasLoading, createLoja, deleteLoja, toggleAtivo, reload } = useLojas()
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [newStoreName, setNewStoreName] = useState('')
  const [newStorePassword, setNewStorePassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  if (loading) {
    return <div className={styles.authContainer}><p>Carregando...</p></div>
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
      // Validate session before calling Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke('create-store', {
        body: {
          storeName: newStoreName,
          storePassword: newStorePassword || null
        }
      })

      if (error) {
        let details = ''

        try {
          if (error.context) {
            details = await error.context.text()
            const parsed = JSON.parse(details)
            details = parsed.error || parsed.message || details
          }
        } catch (e) {
          // ignore parse errors
        }

        throw new Error(details || error.message)
      }

      // Handle application-level errors
      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido')
      }

      // Success
      setMessage(data.message)
      setNewStoreName('')
      setNewStorePassword('')

      // Reload stores list
      reload()

    } catch (err) {
      console.error('Erro completo:', err)
      setMessage('Erro: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, nome) => {
    if (!confirm(`Remover a loja "${nome}"?`)) return
    try {
      await deleteLoja(id)
      setMessage(`Loja "${nome}" removida`)
    } catch (err) {
      setMessage('Erro: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authBox}>
          <div className={styles.authLogo}>🔐</div>
          <h2>Super Admin</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className={styles.authInput}
              placeholder="Senha do Super Admin"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className={styles.authBtn}>Entrar</button>
            {authError && <p className={styles.authError}>{authError}</p>}
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Super Admin</h1>
        <button onClick={() => { logout(); navigate('/') }} className={styles.logoutBtn}>Sair</button>
      </header>

      <div className={styles.body}>
        {message && <div className={styles.message}>{message}</div>}

        {/* Create Store */}
        <section className={styles.section}>
          <h2>Nova Loja</h2>
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
              placeholder="Senha (opcional - para proteger admin)"
              value={newStorePassword}
              onChange={e => setNewStorePassword(e.target.value)}
            />
            <button type="submit" className={styles.createBtn} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Loja'}
            </button>
          </form>
        </section>

        {/* Stores List */}
        <section className={styles.section}>
          <h2>Lojas Cadastradas</h2>
          {lojasLoading ? (
            <p>Carregando...</p>
          ) : lojas.length === 0 ? (
            <p>Nenhuma loja cadastrada.</p>
          ) : (
            <div className={styles.storeList}>
              {lojas.map(loja => {
                const clientUrl = linkCliente(loja.slug)
                const adminUrl = linkAdmin(loja.slug)
                return (
                  <div key={loja.id} className={styles.storeCard}>
                    <div className={styles.storeInfo}>
                      <h3>{loja.nome}</h3>
                      <span className={`${styles.status} ${loja.ativo ? styles.active : styles.inactive}`}>
                        {loja.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                      <small>Slug: {loja.slug}</small>
                    </div>
                    <div className={styles.storeActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => { copiar(clientUrl); setMessage('Link copiado!'); setTimeout(() => setMessage(''), 2000) }}
                      >
                        Copiar Link Cliente
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => { copiar(adminUrl); setMessage('Link copiado!'); setTimeout(() => setMessage(''), 2000) }}
                      >
                        Copiar Link Admin
                      </button>
                      <button
                        className={`${styles.actionBtn} ${loja.ativo ? styles.warning : styles.success}`}
                        onClick={() => toggleAtivo(loja.id, loja.ativo)}
                      >
                        {loja.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(loja.id, loja.nome)}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
