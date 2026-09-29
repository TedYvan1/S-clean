import { Link } from "wouter";

const logoSrc = "/assets/s-clean-transparent.webp";

export default function BrandLogo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`brand brand-logo ${className}`.trim()} aria-label="S'Clean — accueil">
      <img
        src={logoSrc}
        alt="S'Clean — Le lavage auto se déplace chez vous"
      />
    </Link>
  );
}
