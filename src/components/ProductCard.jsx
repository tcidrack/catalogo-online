import { useState } from 'react'
import styles from './ProductCard.module.css'

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

const getDiscountPercent = (produto) => {
  if (!produto.preco_original || !produto.preco) return 0
  return Math.round(((produto.preco_original - produto.preco) / produto.preco_original) * 100)
}

export default function ProductCard({ produto, onClick, mostrarQuantidade }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isOutOfStock = produto.quantidade === 0
  const shouldShowStock = mostrarQuantidade && produto.quantidade !== null
  const isDisabled = isOutOfStock && mostrarQuantidade
  const showPlaceholder = !produto.imagem_url || imageError
  const showSkeleton = produto.imagem_url && !imageError && !imageLoaded
  const discount = getDiscountPercent(produto)

  return (
    <article
      className={`${styles.card} ${isDisabled ? styles.outOfStock : ''}`}
      onClick={!isDisabled ? onClick : undefined}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={`${produto.nome} — ${formatPrice(produto.preco)}${isDisabled ? ' — Esgotado' : ''}`}
      onKeyDown={e => { if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) onClick?.() }}
      style={{ cursor: isDisabled ? 'default' : 'pointer' }}
    >
      <div className={styles.imageWrap}>
        {showSkeleton && <div className={styles.skeleton} aria-hidden="true" />}

        {showPlaceholder ? (
          <div className={styles.placeholder} aria-hidden="true">
            <svg className={styles.placeholderIcon} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.25">
              <rect x="4" y="4" width="32" height="32" rx="4" />
              <circle cx="15" cy="15" r="4" />
              <path d="M4 28l9-9 7 7 5-5 11 11" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className={`${styles.image} ${imageLoaded ? styles.imageVisible : ''}`}
            loading="lazy"
            width="400"
            height="400"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {produto.em_promocao && discount > 0 && (
          <span className={styles.badge} aria-label={`${discount}% de desconto`}>
            -{discount}%
          </span>
        )}

        {isOutOfStock && (
          <div className={styles.outOfStockBadge} aria-hidden="true">
            <span className={styles.outOfStockLabel}>ESGOTADO</span>
          </div>
        )}
      </div>

      <div className={styles.info}>
        <span className={styles.category}>{produto.categoria}</span>
        <h3 className={styles.name}>{produto.nome}</h3>
        <div className={styles.priceWrap}>
          <span className={styles.price}>{formatPrice(produto.preco)}</span>
          {produto.em_promocao && produto.preco_original && (
            <span className={styles.oldPrice}>{formatPrice(produto.preco_original)}</span>
          )}
        </div>
        {shouldShowStock && (
          <div className={`${styles.stockInfo} ${produto.quantidade <= 3 && produto.quantidade > 0 ? styles.lowStock : ''}`}>
            {produto.quantidade > 0
              ? `${produto.quantidade} em estoque`
              : 'Sem estoque'}
          </div>
        )}
      </div>
    </article>
  )
}
