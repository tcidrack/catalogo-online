import styles from './Modal.module.css'

const formatPrice = (price) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

export default function Modal({ produto, whatsapp, whatsappMsgPrefix, onClose }) {
  const isOutOfStock = produto.quantidade === 0

  const handleWhatsapp = () => {
    if (isOutOfStock) return  // Don't allow purchase if out of stock
    const prefix = whatsappMsgPrefix || 'Olá! Gostaria de saber mais sobre:'
    const msg = encodeURIComponent(`${prefix} ${produto.nome}`)
    window.open(`https://wa.me/${whatsapp.replace(/\D/g,'')}?text=${msg}`, '_blank')
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>×</button>
        <div className={styles.imageWrap}>
          {produto.imagem_url ? (
            <img src={produto.imagem_url} alt={produto.nome} className={styles.image} />
          ) : (
            <div className={styles.placeholder}>💎</div>
          )}
        </div>
        <div className={styles.info}>
          <span className={styles.category}>{produto.categoria}</span>
          <h2 className={styles.name}>{produto.nome}</h2>
          <p className={styles.description}>{produto.descricao}</p>
          <div className={styles.priceWrap}>
            {produto.em_promocao ? (
              <>
                <span className={styles.price}>{formatPrice(produto.preco)}</span>
                <span className={styles.oldPrice}>{formatPrice(produto.preco_original)}</span>
              </>
            ) : (
              <span className={styles.price}>{formatPrice(produto.preco)}</span>
            )}
          </div>
          {produto.quantidade !== null && (
            <div className={styles.stockInfo}>
              {produto.quantidade > 0 ? `${produto.quantidade} em estoque` : 'ESGOTADO'}
            </div>
          )}
          <button 
            className={styles.btn} 
            onClick={handleWhatsapp}
            disabled={isOutOfStock}
            style={{ 
              opacity: isOutOfStock ? 0.5 : 1, 
              cursor: isOutOfStock ? 'not-allowed' : 'pointer' 
            }}
          >
            {isOutOfStock ? 'ESGOTADO' : 'Comprar via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}