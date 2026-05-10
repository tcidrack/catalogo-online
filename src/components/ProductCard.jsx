import { useState } from 'react'
import styles from './ProductCard.module.css'

export default function ProductCard({ produto, onClick, mostrarQuantidade }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

  const getDiscountPercent = () => {
    if (!produto.preco_original || !produto.preco) return 0
    return Math.round(((produto.preco_original - produto.preco) / produto.preco_original) * 100)
  }

  const isOutOfStock = produto.quantidade === 0
  const shouldShowStock = mostrarQuantidade && produto.quantidade !== null
  const isDisabled = isOutOfStock && mostrarQuantidade

  const showPlaceholder = !produto.imagem_url || imageError
  const showSkeleton = produto.imagem_url && !imageError && !imageLoaded

  return (
    <div 
      className={`${styles.card} ${isDisabled ? styles.outOfStock : ''}`}
      onClick={!isDisabled ? onClick : undefined}
      style={{ 
        opacity: isDisabled ? 0.6 : 1, 
        cursor: isDisabled ? 'default' : 'pointer' 
      }}
    >
      <div className={styles.imageWrap}>
        {showPlaceholder ? (
          <div className={styles.placeholder}>💎</div>
        ) : showSkeleton ? (
          <div className={styles.skeleton} />
        ) : null}
        {produto.imagem_url && !imageError && (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className={`${styles.image} ${imageLoaded ? styles.imageVisible : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {produto.em_promocao && (
          <span className={styles.badge}>
            {getDiscountPercent()}% OFF
          </span>
        )}
        {isOutOfStock && (
          <span className={styles.outOfStockBadge}>ESGOTADO</span>
        )}
      </div>
      <div className={styles.info}>
        <span className={styles.category}>{produto.categoria}</span>
        <h3 className={styles.name}>{produto.nome}</h3>
        <div className={styles.priceWrap}>
          {produto.em_promocao && produto.preco_original ? (
            <>
              <span className={styles.price}>{formatPrice(produto.preco)}</span>
              <span className={styles.oldPrice}>{formatPrice(produto.preco_original)}</span>
            </>
          ) : (
            <span className={styles.price}>{formatPrice(produto.preco)}</span>
          )}
        </div>
        {shouldShowStock && (
          <div className={`${styles.stockInfo} ${produto.quantidade <= 3 && produto.quantidade > 0 ? styles.lowStock : ''}`}>
            {produto.quantidade > 0 
              ? `${produto.quantidade} em estoque`
              : 'Sem estoque'
            }
          </div>
        )}
      </div>
    </div>
  )
}
