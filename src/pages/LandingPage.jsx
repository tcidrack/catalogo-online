import styles from './LandingPage.module.css'

const features = [
  {
    icon: (
      <svg className={styles.featureIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    title: 'Catálogo Digital',
    desc: 'Seus produtos organizados por categoria, acessíveis de qualquer dispositivo.',
  },
  {
    icon: (
      <svg className={styles.featureIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M3 12h1m8-9v1m8 8h1m-9 8v1" />
        <path d="M5.6 5.6l.7.7m11.4-.7-.7.7m0 10.7.7.7m-11.4-.7-.7.7" />
      </svg>
    ),
    title: 'Personalização',
    desc: 'Cores, nome, slogan e identidade visual exclusiva da sua loja.',
  },
  {
    icon: (
      <svg className={styles.featureIconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3" />
        <path d="M7 7V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
        <path d="M12 12v4m-2-2h4" />
      </svg>
    ),
    title: 'Promoções',
    desc: 'Banners promocionais e preços com desconto destacados automaticamente.',
  },
  {
    icon: (
      <svg className={styles.featureIconSvg} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    title: 'WhatsApp',
    desc: 'Integração direta para pedidos e atendimento dos seus clientes.',
  },
]

const steps = [
  { num: '1', title: 'Cadastre sua loja', desc: 'Crie sua conta e gere o link do seu catálogo.' },
  { num: '2', title: 'Personalize', desc: 'Adicione produtos, fotos, cores e configure sua marca.' },
  { num: '3', title: 'Compartilhe', desc: 'Envie o link do catálogo direto para seus clientes.' },
]

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ── Hero ── */}
      <section className={styles.hero} aria-label="Apresentação">
        <p className={styles.heroEyebrow}>Plataforma de Catálogo Digital</p>
        <h1 className={styles.heroTitle}>Catálogo Online</h1>
        <p className={styles.heroSub}>
          A plataforma completa para apresentar seus produtos e receber pedidos pelo WhatsApp.
        </p>
        <div className={styles.heroCta}>
          <a href="#features" className={styles.ctaBtn}>
            Conheça as funcionalidades
          </a>
          <a
            href="https://wa.me/5585984058583?text=Olá! Quero ter meu próprio catálogo."
            className={styles.whatsappBtn}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar pelo WhatsApp para ter meu catálogo"
          >
            <svg className={styles.whatsappIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Quero meu catálogo
          </a>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className={styles.features} aria-label="Funcionalidades">
        <p className={styles.sectionLabel}>Por que escolher</p>
        <h2 className={styles.sectionTitle}>Tudo que sua loja precisa</h2>
        <div className={styles.featureGrid}>
          {features.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIconWrap} aria-hidden="true">
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={styles.howItWorks} aria-label="Como funciona">
        <p className={styles.sectionLabel}>Simples e rápido</p>
        <h2 className={styles.sectionTitle}>Como funciona</h2>
        <div className={styles.stepsWrapper}>
          {steps.map((s) => (
            <div key={s.num} className={styles.step}>
              <div className={styles.stepNum} aria-hidden="true">{s.num}</div>
              <div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p>© 2026 Cidrack Catálogo Online</p>
        <a
          href="https://wa.me/5585984058583?text=Olá! Tenho interesse no Catálogo Online."
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappLink}
          aria-label="Contato pelo WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          (85) 98405-8583
        </a>
        <p className={styles.footerSub}>Todos os direitos reservados</p>
      </footer>
    </div>
  )
}
