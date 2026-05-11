import { useState, useEffect, useCallback } from 'react'
import { crudSupabase as supabase } from '../lib/supabase'

const defaultConfig = {
  promo_cor: '#4caf50',
  promo_badge_cor: '#FA098A',
  mostrar_quantidade: false,
  promo_ativa: false,
  promo_texto: '',
  whatsapp_msg_prefix: 'Olá! Gostaria de saber mais sobre:',
  categorias: ['Aneis', 'Colares', 'Brincos', 'Pulseiras', 'Outros']
}

const TIMEOUT_MS = 20000

function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na operacao')), ms))
  ])
}

export function useCatalogo(lojaId, options = {}) {
  const { enabled = true } = options

  const [produtos, setProdutos] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadAll = useCallback(async (skipLoading = false) => {
    if (!lojaId) {
      if (!skipLoading) setLoading(false)
      if (!skipLoading) setError(null)
      return
    }
    if (!skipLoading) setLoading(true)
    if (!skipLoading) setError(null)
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao carregar dados')), TIMEOUT_MS)
      )
      const [cfgRes, prodsRes] = await Promise.race([
        Promise.all([
          supabase.from('catalogo_config').select(`
            id, loja_id, nome, slogan, whatsapp, instagram,
            cor_principal, cor_destaque, cor_topo, cor_rodape, cor_fundo, fonte_texto,
            promo_ativa, promo_texto, promo_cor, promo_badge_cor,
            whatsapp_msg_prefix, mostrar_quantidade, logo_url, categorias
          `).eq('loja_id', lojaId).limit(1).single(),
          supabase.from('catalogo_produtos').select('*').eq('loja_id', lojaId).order('ordem').order('id'),
        ]),
        timeoutPromise
      ])

      if (prodsRes.error) throw prodsRes.error

      let finalConfig = null

      if (cfgRes.error && cfgRes.error.code === 'PGRST116') {
          finalConfig = { ...defaultConfig, loja_id: lojaId }
      } else if (cfgRes.error) {
        throw cfgRes.error
      } else {
        finalConfig = { ...defaultConfig, ...cfgRes.data }
      }

      setConfig(finalConfig)
      setProdutos(prodsRes.data || [])
    } catch (e) {
      console.error('loadAll ERRO:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [lojaId])

  useEffect(() => {
    if (enabled && lojaId) {
      loadAll()
    } else {
      setLoading(false)
    }
  }, [enabled, lojaId, loadAll])

  const CONFIG_FIELDS = [
    'nome', 'slogan', 'whatsapp', 'instagram',
    'cor_principal', 'cor_destaque', 'cor_topo', 'cor_rodape', 'cor_fundo', 'fonte_texto',
    'promo_ativa', 'promo_texto', 'promo_cor', 'promo_badge_cor',
    'whatsapp_msg_prefix', 'mostrar_quantidade', 'logo_url', 'categorias'
  ]

  const saveConfig = async (data) => {
    if (!lojaId) return
    const cleanData = {}
    for (const key of CONFIG_FIELDS) {
      if (key in data) cleanData[key] = data[key]
    }
    if (config?.id) {
      const { error } = await withTimeout(
        supabase.from('catalogo_config').update(cleanData).eq('id', config.id)
      )
      if (error) throw error
      const { data: reloadedCfg, error: reloadErr } = await withTimeout(
        supabase.from('catalogo_config')
          .select(`
            id, loja_id, nome, slogan, whatsapp, instagram,
            cor_principal, cor_destaque, cor_topo, cor_rodape, cor_fundo, fonte_texto,
            promo_ativa, promo_texto, promo_cor, promo_badge_cor,
            mostrar_quantidade, whatsapp_msg_prefix, logo_url, categorias
          `)
          .eq('id', config.id)
          .single()
      )
      if (!reloadErr && reloadedCfg) {
        const merged = { ...defaultConfig, ...reloadedCfg }
        setConfig(merged)
      } else {
        setConfig(prev => ({ ...prev, ...cleanData }))
      }
    } else {
      const { data: newCfg, error } = await withTimeout(
        supabase.from('catalogo_config')
          .insert([{ ...defaultConfig, ...cleanData, loja_id: lojaId }])
          .select()
          .single()
      )
      if (error) throw error
      const merged = { ...defaultConfig, ...newCfg }
      setConfig(merged)
    }
  }

  const updateProduto = async (id, fields) => {
    const { error } = await withTimeout(
      supabase.from('catalogo_produtos').update(fields).eq('id', id)
    )
    if (error) throw error
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
  }

  const addProduto = async () => {
    if (!lojaId) {
      console.error('addProduto: lojaId ausente')
      throw new Error('lojaId ausente')
    }
    const { data, error } = await withTimeout(
      supabase.from('catalogo_produtos')
        .insert([{
          nome: 'Novo Produto',
          descricao: '',
          categoria: 'Outros',
          preco: 0,
          disponivel: true,
          imagem_url: '',
          ordem: (produtos || []).length + 1,
          loja_id: lojaId,
          quantidade: null
        }])
        .select()
        .single()
    )
    if (error) throw error
    setProdutos(prev => [...prev, data])
    return data
  }

  const deleteProduto = async (id) => {
    const { error } = await withTimeout(
      supabase.from('catalogo_produtos').delete().eq('id', id)
    )
    if (error) throw error
    setProdutos(prev => prev.filter(p => p.id !== id))
  }

  const updateCategorias = async (novasCategorias) => {
    if (!config?.id) return
    setConfig(prev => ({ ...prev, categorias: novasCategorias }))
    const { error } = await withTimeout(
      supabase.from('catalogo_config').update({ categorias: novasCategorias }).eq('id', config.id)
    )
    if (error) {
      setConfig(prev => ({ ...prev, categorias: prev.categorias }))
      throw error
    }
  }

  const uploadImagem = async (id, file) => {
    const ext = file.name.split('.').pop()
    const path = `loja-${lojaId}/produto-${id}-${Date.now()}.${ext}`
    const { error: upErr } = await withTimeout(
      supabase.storage.from('catalogo-imagens').upload(path, file, { upsert: true })
    )
    if (upErr) throw upErr
    const { data: urlData } = supabase.storage.from('catalogo-imagens').getPublicUrl(path)
    await updateProduto(id, { imagem_url: urlData.publicUrl })
    return urlData.publicUrl
  }

  const reorderProdutos = async (orderedIds) => {
    const updates = orderedIds.map((id, index) => ({
      id,
      ordem: index + 1
    }))
    for (const { id, ordem } of updates) {
      const { error } = await withTimeout(
        supabase.from('catalogo_produtos').update({ ordem }).eq('id', id)
      )
      if (error) throw error
    }
    setProdutos(prev => {
      const map = new Map(prev.map(p => [p.id, p]))
      return orderedIds.map(id => map.get(id)).filter(Boolean).map((p, i) => ({ ...p, ordem: i + 1 }))
    })
  }

  return { produtos, config, loading, error, saveConfig, addProduto, updateProduto, deleteProduto, uploadImagem, reload: loadAll, updateCategorias, reorderProdutos }
}
