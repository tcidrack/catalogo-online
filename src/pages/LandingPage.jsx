import styles from './LandingPage.module.css'

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroDecor}>◆ ◇ ◆ ◇ ◆ ◇ ◆ ◇ ◆</div>
        <h1 className={styles.heroTitle}>Catálogo Online</h1>
        <p className={styles.heroSub}>A plataforma completa para sua loja</p>
        <div className={styles.heroCta}>
          <a href="#features" className={styles.ctaBtn}>Conheça as funcionalidades</a>
          <a
            href="https://wa.me/5585984058583?text=Olá! Quero ter meu próprio catálogo."
            className={styles.whatsappBtn}
            target="_blank"
            rel="noopener noreferrer"
          >
            📱 Quero meu catálogo
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Por que escolher o Catálogo Online?</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📱</div>
            <h3>Catálogo Digital</h3>
            <p>Seus produtos organizados por categoria, acessíveis de qualquer dispositivo</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎨</div>
            <h3>Personalização</h3>
            <p>Cores, nome, slogan e identidade visual da sua loja</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🏷️</div>
            <h3>Promoções</h3>
            <p>Banners promocionais e preços especiais</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💬</div>
            <h3>WhatsApp</h3>
            <p>Integração direta para pedidos dos clientes</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>Como funciona</h2>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h4>Cadastre sua loja</h4>
            <p>Crie sua loja e gera o link</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h4>Personalize</h4>
            <p>Adicione produtos, fotos e configure cores</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h4>Compartilhe</h4>
            <p>Envie o link do catálogo para seus clientes</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Cidrack Catálogo Online</p>
        <a
          href="https://wa.me/5585984058583?text=Olá! Tenho interesse no Catálogo Online."
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
        >
          📱 (85) 98405-8583
        </a>
        <p className={styles.footerSub}>Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
