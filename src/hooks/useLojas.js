import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useLojas() {
  const [lojas, setLojas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadLojas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('lojas')
        .select('id, nome, slug, ativo, created_at')
        .order('created_at', { ascending: false })
      if (err) throw err
      setLojas(data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLojas() }, [loadLojas])

  const createLoja = async (nome, senha = null) => {
    const slug = generateSlug(nome)
    const insertData = { nome, slug }
    if (senha) insertData.senha_hash = senha

    const { data, error: err } = await supabase
      .from('lojas')
      .insert([insertData])
      .select('id, nome, slug, ativo, created_at')
      .single()
    if (err) throw err
    setLojas(prev => [data, ...prev])
    return data
  }

  const updateLoja = async (id, fields) => {
    const { error: err } = await supabase
      .from('lojas')
      .update(fields)
      .eq('id', id)
    if (err) throw err
    setLojas(prev => prev.map(l => l.id === id ? { ...l, ...fields } : l))
  }

  const deleteLoja = async (id) => {
    const { error: err } = await supabase
      .from('lojas')
      .delete()
      .eq('id', id)
    if (err) throw err
    setLojas(prev => prev.filter(l => l.id !== id))
  }

  const toggleAtivo = async (id, ativo) => {
    await updateLoja(id, { ativo: !ativo })
  }

  return { lojas, loading, error, createLoja, updateLoja, deleteLoja, toggleAtivo, reload: loadLojas }
}

function generateSlug(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-') // multiple hyphens to single
}
