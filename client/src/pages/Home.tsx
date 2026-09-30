import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CalendarDays, Check, Clock3, Droplets, Leaf, MapPin, Menu, Sparkles, X } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const services = [
  {
    name: "Essentiel",
    description: "Pour garder votre véhicule impeccable, sans attendre.",
    price: "12 000",
    duration: "45 min",
    features: ["Lavage extérieur", "Jantes & vitres", "Séchage soigné"],
  },
  {
    name: "Premium",
    description: "Le soin complet pour retrouver une voiture comme neuve.",
    price: "22 000",
    duration: "1h30",
    badge: "Recommandé",
    featured: true,
    features: ["Extérieur & intérieur", "Aspiration complète", "Finitions premium"],
  },
  {
    name: "Éco Premium",
    description: "Un nettoyage profond avec une approche plus responsable.",
    price: "28 000",
    duration: "2h",
    badge: "Éco premium",
    features: ["Produits éco-responsables", "Nettoyage intérieur", "Protection des surfaces"],
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="page-shell">
      <header className="navbar">
        <div className="container navbar-inner">
          <BrandLogo />
          <nav className={`nav-links ${menuOpen ? "mobile-open" : ""}`} aria-label="Navigation principale">
            <a href="#prestations" onClick={() => setMenuOpen(false)}>Nos prestations</a>
            <a href="#parcours" onClick={() => setMenuOpen(false)}>Comment ça marche</a>
            <a href="#zones" onClick={() => setMenuOpen(false)}>Zones desservies</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          </nav>
          <div className="nav-actions">
            <Link href="/account?mode=login&next=%2Fadmin" className="btn btn-outline">Espace admin</Link>
            <Link href="/booking" className="btn btn-primary">Réserver maintenant <ArrowRight size={14} /></Link>
            <button className="mobile-menu" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen((value) => !value)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">Lavage auto à domicile · Abidjan</div>
              <h1>Votre voiture mérite mieux qu'un simple lavage.</h1>
              <p className="hero-text">S'Clean se déplace chez vous pour prendre soin de votre véhicule, simplement, professionnellement et avec attention.</p>
              <div className="hero-actions">
                <Link href="/booking" className="btn btn-primary">Réserver mon lavage <ArrowRight size={15} /></Link>
                <a href="#prestations" className="btn btn-outline">Découvrir nos formules</a>
              </div>
              <div className="hero-note"><ShieldDot /> <span>Une attention professionnelle, <strong>là où vous êtes.</strong></span></div>
            </div>
            <div className="hero-visual" aria-label="Véhicule propre dans un environnement résidentiel">
              <div className="sparkle one">✦</div><div className="sparkle two">✧</div><div className="bubble one" /><div className="bubble two" />
              <div className="hero-photo"><img src="/assets/sclean-hero.jpg" alt="Véhicule propre dans une allée résidentielle" /></div>
              <div className="hero-stamp"><div><span>24h</span><small>pour réserver en toute simplicité</small></div></div>
            </div>
          </div>
        </section>

        <section className="section section-soft" id="parcours">
          <div className="container">
            <div className="section-heading"><div><div className="eyebrow">Une expérience pensée pour vous</div><h2>Du premier clic aux dernières finitions.</h2></div><p>Votre temps est précieux. Le parcours S'Clean reste simple, lisible et adapté au mobile.</p></div>
            <div className="steps-grid">
              <Step number="01" icon={<CalendarDays size={20} />} title="Choisissez votre formule" text="Sélectionnez le soin adapté à votre véhicule et à votre rythme." />
              <Step number="02" icon={<Clock3 size={20} />} title="Choisissez votre créneau" text="Consultez uniquement les horaires réellement disponibles." />
              <Step number="03" icon={<MapPin size={20} />} title="Indiquez où vous êtes" text="Cocody, Riviera, M'Pouto : nous venons directement à vous." />
              <Step number="04" icon={<Sparkles size={20} />} title="Profitez" text="Notre équipe prend soin de votre voiture avec attention." />
            </div>
          </div>
        </section>

        <section className="section" id="prestations">
          <div className="container">
            <div className="section-heading"><div><div className="eyebrow">Nos formules</div><h2>Le bon niveau de soin, au bon moment.</h2></div><p>Des prestations transparentes, des tarifs administrables et une qualité constante.</p></div>
            <div className="service-grid">
              {services.map((service) => <ServiceCard key={service.name} service={service} />)}
            </div>
          </div>
        </section>

        <section className="section section-dark">
          <div className="container quote-block">
            <div><div className="quote-mark">“</div><div className="eyebrow">La signature S'Clean</div></div>
            <div><blockquote>Bien plus qu'un lavage, une attention pour votre véhicule.</blockquote><cite>— Le soin automobile à domicile, pensé à Abidjan</cite><div className="dark-stat"><div><strong>3</strong><span>formules à choisir</span></div><div><strong>0</strong><span>temps perdu en station</span></div><div><strong>1</strong><span>équipe à votre service</span></div></div></div>
          </div>
        </section>

        <section className="section section-soft" id="zones">
          <div className="container section-heading"><div><div className="eyebrow">Nous venons à vous</div><h2>Un service local, pensé pour votre quotidien.</h2></div><p><MapPin size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Cocody · Riviera · M'Pouto · Abidjan et environs</p></div>
          <div className="container" style={{ display: "flex", justifyContent: "center" }}><Link href="/booking" className="btn btn-champagne">Réserver dans ma zone <ArrowRight size={15} /></Link></div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div><BrandLogo className="footer-logo" /><p style={{ marginTop: 17, maxWidth: 220 }}>Lavage automobile professionnel à domicile. Le soin se déplace chez vous.</p></div>
          <div><h4>Navigation</h4><a href="#prestations">Prestations</a><a href="#parcours">Réservation</a><a href="#zones">Zones desservies</a><Link href="/admin">Espace admin</Link></div>
          <div><h4>Contact</h4><a href="tel:+2250700000000">+225 07 97 35 45 90</a><a href="https://wa.me/2250700000000">WhatsApp</a><a href="mailto:bonjour@sclean.ci">bonjour@sclean.ci</a></div>
          <div><h4>La promesse</h4><p>Des créneaux visibles en temps réel. Un rendez-vous confirmé en quelques clics.</p><Link href="/booking" className="btn btn-champagne" style={{ marginTop: 8 }}>Réserver <ArrowRight size={14} /></Link></div>
        </div>
        <div className="container footer-bottom"><span>© S'Clean — Groupe Story's</span><span>Service premium à domicile · Abidjan</span></div>
      </footer>
    </div>
  );
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <div className="step-item"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="step-num">{number}</span><span style={{ color: "var(--sage)" }}>{icon}</span></div><h3>{title}</h3><p>{text}</p></div>;
}

function ServiceCard({ service }: { service: (typeof services)[number] }) {
  return <article className={`service-card ${service.featured ? "featured" : ""}`}>
    <div>{service.badge && <span className="badge">{service.badge}</span>}<h3>{service.name}</h3><p className="service-description">{service.description}</p><div className="price">{service.price}<small>FCFA</small></div><ul className="service-list">{service.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div>
    <div><div className="service-meta"><span><Clock3 size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />{service.duration}</span><span><Leaf size={12} style={{ verticalAlign: "-2px", marginRight: 5 }} />À domicile</span></div><Link href={`/booking?service=${service.name.toLowerCase().replaceAll(" ", "-")}`} className={`btn ${service.featured ? "btn-champagne" : "btn-outline"}`} style={{ width: "100%", marginTop: 14 }}>Choisir cette formule <ArrowRight size={14} /></Link></div>
  </article>;
}

function ShieldDot() { return <span style={{ display: "grid", placeItems: "center", width: 21, height: 21, borderRadius: "50%", background: "rgba(143,162,140,0.18)", color: "var(--sage)" }}><Droplets size={12} /></span>; }
