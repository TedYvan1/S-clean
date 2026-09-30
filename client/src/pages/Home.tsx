import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Droplets,
  Leaf,
  MapPin,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import BrandLogo from "@/components/BrandLogo";

const services = [
  {
    name: "Lavage basique",
    description:
      "L’essentiel pour garder votre véhicule propre au quotidien.",
    price: "3 500",
    duration: "30 à 45 min",
    badge: "À partir de",
    features: [
      "Mousse active",
      "Lavage extérieur",
      "Séchage soigné",
      "Vitres extérieures",
    ],
  },
  {
    name: "Lavage Premium",
    description:
      "Un nettoyage plus complet pour une voiture propre dedans et dehors.",
    price: "7 000",
    duration: "1h à 1h15",
    badge: "Le plus choisi",
    featured: true,
    features: [
      "Mousse épaisse",
      "Jantes & pneus",
      "Vitres intérieures et extérieures",
      "Aspiration rapide",
      "Finitions manuelles",
    ],
  },
  {
    name: "Premium Protection",
    description:
      "Le soin complet pour nettoyer, faire briller et protéger votre véhicule.",
    price: "10 000",
    duration: "1h30 à 2h",
    badge: "Protection longue durée",
    features: [
      "Nettoyage intérieur approfondi",
      "Traitement des plastiques",
      "Protection des surfaces",
      "Brillance durable",
      "Parfum intérieur",
    ],
  },
];

const reveal: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      className="page-shell"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <header className="navbar">
        <div className="container navbar-inner">
          <BrandLogo />

          <nav
            className={`nav-links ${
              menuOpen ? "mobile-open" : ""
            }`}
            aria-label="Navigation principale"
          >
            <a
              href="#prestations"
              onClick={() => setMenuOpen(false)}
            >
              Nos prestations
            </a>

            <a
              href="#parcours"
              onClick={() => setMenuOpen(false)}
            >
              Comment ça marche
            </a>

            <a
              href="#zones"
              onClick={() => setMenuOpen(false)}
            >
              Zones desservies
            </a>

            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </a>
          </nav>

          <div className="nav-actions">
            <Link
              href="/account"
              className="btn btn-outline"
            >
              Se connecter
            </Link>

            <Link
              href="/account?mode=register"
              className="btn btn-champagne nav-signup"
            >
              Créer un compte
            </Link>

            <Link
              href="/booking"
              className="btn btn-primary"
            >
              Réserver maintenant
              <ArrowRight size={14} />
            </Link>

            <button
              className="mobile-menu"
              aria-label={
                menuOpen
                  ? "Fermer le menu"
                  : "Ouvrir le menu"
              }
              onClick={() =>
                setMenuOpen((value) => !value)
              }
            >
              {menuOpen ? (
                <X size={18} />
              ) : (
                <Menu size={18} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-grid">
            <motion.div
              className="hero-copy"
              variants={stagger}
            >
              <div className="eyebrow">
                Lavage auto à domicile · Cocody · Abidjan
              </div>

              <motion.h1 variants={reveal}>
                Une mousse de pro, directement chez vous.
              </motion.h1>

              <motion.p
                className="hero-text"
                variants={reveal}
              >
                Un résultat professionnel sans bouger de chez
                vous. S’Clean se déplace à Cocody, Riviera,
                M’Pouto et dans les environs d’Abidjan pour
                nettoyer, protéger et faire briller votre
                véhicule.
              </motion.p>

              <motion.div
                className="hero-actions"
                variants={reveal}
              >
                <a
                  href="https://wa.me/2250797354590"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Écrire sur WhatsApp
                  <ArrowRight size={15} />
                </a>

                <Link
                  href="/booking"
                  className="btn btn-outline"
                >
                  Réserver en ligne
                </Link>
              </motion.div>

              <motion.div
                className="hero-note"
                variants={reveal}
              >
                <ShieldDot />

                <span>
                  Un service fiable,{" "}
                  <strong>
                    ponctuel et proche de vous.
                  </strong>
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              className="hero-visual"
              aria-label="Véhicule propre dans un environnement résidentiel"
              variants={reveal}
            >
              <div className="sparkle one">✦</div>
              <div className="sparkle two">✧</div>
              <div className="bubble one" />
              <div className="bubble two" />

              <div className="hero-photo">
                <img
                  src="/assets/sclean-hero.jpg"
                  alt="Véhicule propre dans une allée résidentielle"
                />
              </div>

              <div className="hero-stamp">
                <div>
                  <span>3 500</span>
                  <small>lavage à partir de</small>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <motion.section
          className="section section-soft"
          id="parcours"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.18,
          }}
          variants={stagger}
        >
          <div className="container">
            <motion.div
              className="section-heading"
              variants={reveal}
            >
              <div>
                <div className="eyebrow">
                  Vous gagnez du temps, on s’occupe du reste
                </div>

                <h2>
                  Votre voiture propre, sans perdre votre journée.
                </h2>
              </div>

              <p>
                Vous nous indiquez où vous êtes, nous venons
                avec le matériel nécessaire. Simple, humain et
                ponctuel.
              </p>
            </motion.div>

            <div className="steps-grid">
              <Step
                number="01"
                icon={<CalendarDays size={20} />}
                title="Choisissez le soin qui vous convient"
                text="Choisissez le niveau de nettoyage adapté à votre véhicule et à votre budget."
              />

              <Step
                number="02"
                icon={<Clock3 size={20} />}
                title="Choisissez votre créneau"
                text="Consultez uniquement les horaires réellement disponibles."
              />

              <Step
                number="03"
                icon={<MapPin size={20} />}
                title="Indiquez où vous êtes"
                text="Cocody, Riviera, M'Pouto : nous venons directement chez vous."
              />

              <Step
                number="04"
                icon={<Sparkles size={20} />}
                title="Profitez"
                text="Notre équipe prend soin de votre voiture avec attention."
              />
            </div>
          </div>
        </motion.section>

        <motion.section
          className="section"
          id="prestations"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.12,
          }}
          variants={stagger}
        >
          <div className="container">
            <motion.div
              className="section-heading"
              variants={reveal}
            >
              <div>
                <div className="eyebrow">
                  Nos formules
                </div>

                <h2>
                  Le bon niveau de soin, au bon moment.
                </h2>
              </div>

              <p>
                Des prestations claires, à partir de 3 500 FCFA.
                Le prix peut varier selon le type et l’état du
                véhicule.
              </p>
            </motion.div>

            <motion.div
              className="service-grid"
              variants={stagger}
            >
              {services.map((service ) => (
                <motion.div
                  key={service.name}
                  variants={reveal}
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          className="section section-dark"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          variants={reveal}
        >
          <div className="container quote-block">
            <div>
              <div className="quote-mark">“</div>

              <div className="eyebrow">
                La signature S&apos;Clean
              </div>
            </div>

            <div>
              <blockquote>
                Une mousse de pro. Un résultat propre. Et vous
                ne bougez pas de chez vous.
              </blockquote>

              <cite>
                — Lavage automobile professionnel à domicile, à
                Abidjan
              </cite>

              <div className="dark-stat">
                <div>
                  <strong>3 500</strong>
                  <span>FCFA pour commencer</span>
                </div>

                <div>
                  <strong>0</strong>
                  <span>déplacement en station</span>
                </div>

                <div>
                  <strong>1</strong>
                  <span>équipe qui vient à vous</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          className="section section-soft"
          id="zones"
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.25,
          }}
          variants={reveal}
        >
          <div className="container section-heading">
            <div>
              <div className="eyebrow">
                Nous venons à vous
              </div>

              <h2>
                On vient à vous, avec le matériel nécessaire.
              </h2>
            </div>

            <p>
              <MapPin
                size={14}
                style={{
                  verticalAlign: "-2px",
                  marginRight: 5,
                }}
              />
              Cocody · Riviera · M&apos;Pouto · Abidjan,
              Côte d&apos;Ivoire
            </p>
          </div>

          <div
            className="container"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link
              href="/booking"
              className="btn btn-champagne"
            >
              Réserver dans ma zone
              <ArrowRight size={15} />
            </Link>
          </div>
        </motion.section>
      </main>

      <footer className="footer" id="contact">
        <div className="container footer-grid">
          <div>
            <BrandLogo className="footer-logo" />

            <p
              style={{
                marginTop: 17,
                maxWidth: 220,
              }}
            >
              Une mousse de pro chez vous. Un résultat
              professionnel sans bouger.
            </p>
          </div>

          <div>
            <h4>Navigation</h4>

            <a href="#prestations">Prestations</a>
            <a href="#parcours">Réservation</a>
            <a href="#zones">Zones desservies</a>

            <Link href="/admin">
              Espace admin
            </Link>
          </div>

          <div>
            <h4>Contact</h4>

            <a href="tel:+2250797354590">
              +225 07 97 35 45 90
            </a>

            <a
              href="https://wa.me/2250797354590"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>

            <span>
              Abidjan · Côte d&apos;Ivoire
            </span>
          </div>

          <div>
            <h4>La promesse</h4>

            <p>
              Des créneaux visibles en temps réel. Un
              rendez-vous confirmé en quelques clics.
            </p>

            <Link
              href="/booking"
              className="btn btn-champagne"
              style={{ marginTop: 8 }}
            >
              Réserver
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>
            © S&apos;Clean — Groupe Story&apos;s
          </span>

          <span>
            Professionnel · Ponctuel · À domicile · Abidjan
          </span>
        </div>
      </footer>
    </motion.div>
   );
}

function Step({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="step-item">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="step-num">
          {number}
        </span>

        <span style={{ color: "var(--sage)" }}>
          {icon}
        </span>
      </div>

      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ServiceCard({
  service,
}: {
  service: (typeof services)[number];
}) {
  return (
    <article
      className={`service-card ${
        service.featured ? "featured" : ""
      }`}
    >
      <div>
        {service.badge && (
          <span className="badge">
            {service.badge}
          </span>
        )}

        <h3>{service.name}</h3>

        <p className="service-description">
          {service.description}
        </p>

        <div className="price">
          {service.price}
          <small>FCFA</small>
        </div>

        <ul className="service-list">
          {service.features.map((feature) => (
            <li key={feature}>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="service-meta">
          <span>
            <Clock3
              size={12}
              style={{
                verticalAlign: "-2px",
                marginRight: 5,
              }}
            />
            {service.duration}
          </span>

          <span>
            <Leaf
              size={12}
              style={{
                verticalAlign: "-2px",
                marginRight: 5,
              }}
            />
            À domicile
          </span>
        </div>

        <Link
          href={`/booking?service=${service.name
            .toLowerCase()
            .replaceAll(" ", "-")}`}
          className={`btn ${
            service.featured
              ? "btn-champagne"
              : "btn-outline"
          }`}
          style={{
            width: "100%",
            marginTop: 14,
          }}
        >
          Choisir cette formule
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

function ShieldDot() {
  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: 21,
        height: 21,
        borderRadius: "50%",
        background: "rgba(143,162,140,0.18)",
        color: "var(--sage)",
      }}
    >
      <Droplets size={12} />
    </span>
  );
}
