import { useEffect } from 'react'
import styles from './Modal.module.css'

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

const getDiscountPercent = (produto) => {
  if (!produto.preco_original || !produto.preco) return 0
  return Math.round(((produto.preco_original - produto.preco) / produto.preco_original) * 100)
}

export default function Modal({ produto, whatsapp, whatsappMsgPrefix, onClose }) {
  const isOutOfStock = produto.quantidade === 0
  const discount = getDiscountPercent(produto)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleWhatsapp = () => {
    if (isOutOfStock) return
    const prefix = whatsappMsgPrefix || 'Olá! Gostaria de saber mais sobre:'
    const msg = encodeURIComponent(`${prefix} ${produto.nome}`)
    const cleaned = whatsapp.replace(/\D/g, '')
    const full = cleaned.startsWith('55') ? cleaned : '55' + cleaned
    window.open(`https://wa.me/${full}?text=${msg}`, '_blank')
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes: ${produto.nome}`}
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
          </svg>
        </button>

        {/* Image */}
        <div className={styles.imageWrap}>
          {produto.imagem_url ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className={styles.image}
              loading="eager"
            />
          ) : (
            <div className={styles.placeholder} aria-hidden="true">
              <svg className={styles.placeholderIcon} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.25">
                <rect x="4" y="4" width="32" height="32" rx="4" />
                <circle cx="15" cy="15" r="4" />
                <path d="M4 28l9-9 7 7 5-5 11 11" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.topBadge}>
            <span className={styles.category}>{produto.categoria}</span>
            {produto.em_promocao && (
              <span className={styles.promoBadge}>PROMOÇÃO</span>
            )}
          </div>

          <h2 className={styles.name}>{produto.nome}</h2>

          {produto.descricao && (
            <p className={styles.description}>{produto.descricao}</p>
          )}

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.priceWrap}>
            <span className={styles.price}>{formatPrice(produto.preco)}</span>
            {produto.em_promocao && produto.preco_original && (
              <>
                <span className={styles.oldPrice}>{formatPrice(produto.preco_original)}</span>
                {discount > 0 && (
                  <span className={styles.discount} aria-label={`${discount}% de desconto`}>
                    -{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          {produto.quantidade !== null && (
            <div className={styles.stockInfo}>
              <span
                className={`${styles.stockDot} ${produto.quantidade === 0 ? styles.stockDotEmpty : ''}`}
                aria-hidden="true"
              />
              {produto.quantidade > 0 ? (
                <span>{produto.quantidade} em estoque</span>
              ) : (
                <span className={styles.stockOutLabel}>Esgotado</span>
              )}
            </div>
          )}

          <button
            className={styles.btn}
            onClick={handleWhatsapp}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? 'Produto esgotado' : `Comprar ${produto.nome} via WhatsApp`}
          >
            {!isOutOfStock && (
              <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            )}
            {isOutOfStock ? 'Produto Esgotado' : 'Comprar via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}
