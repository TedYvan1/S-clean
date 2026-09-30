import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, CarFront, Loader2, LogIn, MapPin, ReceiptText, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import BrandLogo from "@/components/BrandLogo";
import "../account.css";

type HistoryBooking = { bookingNumber: string; date: string; startTime: string; endTime: string; address: string; neighborhood: string; totalPrice: number; status: string; paymentStatus: string; serviceName: string | null; serviceDurationMinutes: number | null; vehicleBrand: string | null; vehicleModel: string | null; vehicleType: string | null; vehicleColor: string | null; vehicleLicensePlate: string | null };
const statusLabels: Record<string, string> = { confirmed: "Confirmée", pending: "En attente", completed: "Terminée", cancelled: "Annulée", in_progress: "En cours", no_show: "No-show" };
type AuthMode = "login" | "register";

export default function Account() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/booking");
  }, [setLocation]);

  return <AccountFrame><div className="account-loading"><Loader2 className="spin" size={22} /> Redirection vers la réservation…</div></AccountFrame>;
}

function AuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<AuthMode>(() => new URLSearchParams(window.location.search).get("mode") === "register" ? "register" : "login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const signIn = trpc.auth.signIn.useMutation({ onSuccess: async () => { toast.success("Connexion réussie."); if (onAuthenticated) await onAuthenticated(); }, onError: (error) => toast.error(error.message) });
  const signUp = trpc.auth.signUp.useMutation({ onSuccess: async (data) => { const successMessage = data.requiresEmailConfirmation ? "Compte créé avec succès. Vérifiez votre email pour l'activer." : "Compte créé avec succès. Bienvenue chez S'Clean."; setMessage(successMessage); toast.success(successMessage); if (onAuthenticated) await onAuthenticated(); }, onError: (error) => toast.error(error.message) });
  const googleUrl = trpc.auth.oauthUrl.useQuery({ provider: "google" }, { enabled: false, retry: false });
  const appleUrl = trpc.auth.oauthUrl.useQuery({ provider: "apple" }, { enabled: false, retry: false });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const oauth = async (provider: "google" | "apple") => { const result = provider === "google" ? await googleUrl.refetch() : await appleUrl.refetch(); if (result.data?.url) window.location.href = result.data.url; else toast.error("Ce fournisseur OAuth n'est pas encore activé dans Supabase."); };
  return <div className="account-login"><div className="account-login-icon">{mode === "register" ? <UserRound size={24} /> : <LogIn size={24} />}</div><div className="eyebrow">Espace client S'Clean</div><h1>{mode === "register" ? "Créez votre compte." : "Retrouvez vos rendez-vous."}</h1><p>{mode === "register" ? "Un compte personnel pour retrouver votre historique et réserver plus rapidement." : "Connectez-vous pour consulter votre historique, vos véhicules et vos prochains lavages."}</p><div className="auth-tabs auth-tabs-two"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Se connecter</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Créer un compte</button></div><div className="auth-form">{mode === "register" && <Field label="Nom complet" value={form.fullName} onChange={(value) => update("fullName", value)} placeholder="Votre nom et prénom" />}<Field label="Email" value={form.email} onChange={(value) => update("email", value)} placeholder="vous@exemple.com" type="email" /><Field label="Mot de passe" value={form.password} onChange={(value) => update("password", value)} placeholder="8 caractères minimum" type="password" />{message && <div className="auth-message">{message}</div>}<button className="btn btn-primary" onClick={() => mode === "register" ? signUp.mutate({ email: form.email, password: form.password, fullName: form.fullName }) : signIn.mutate({ identifier: form.email, password: form.password })} disabled={signIn.isPending || signUp.isPending}>{signIn.isPending || signUp.isPending ? "Patientez…" : mode === "register" ? "Créer mon compte" : "Se connecter"} <LogIn size={15} /></button><div className="auth-divider"><span>ou continuer avec</span></div><div className="auth-socials"><button className="btn btn-outline" onClick={() => void oauth("google")}>Google</button><button className="btn btn-outline" onClick={() => void oauth("apple")}>Apple</button></div></div><p className="account-secure"><ShieldCheck size={14} /> Vos données d'authentification sont gérées par Supabase</p><Link className="text-link" href="/">Retour à l'accueil</Link></div>;
}

function AuthCallback() { const [, setLocation] = useLocation(); const setSession = trpc.auth.setSession.useMutation({ onSuccess: () => setLocation("/account"), onError: () => setLocation("/account") }); useEffect(() => { const params = new URLSearchParams(window.location.hash.replace(/^#/, "")); const accessToken = params.get("access_token"); const refreshToken = params.get("refresh_token") ?? undefined; if (accessToken) setSession.mutate({ accessToken, refreshToken }); else setLocation("/account"); }, [setLocation, setSession]); return <AccountFrame><div className="account-loading"><Loader2 className="spin" size={22} /> Finalisation de votre connexion…</div></AccountFrame>; }
function AccountFrame({ children }: { children: React.ReactNode }) { return <div className="account-page"><header className="navbar"><div className="container navbar-inner"><BrandLogo /><Link className="btn btn-outline" href="/booking">Réserver</Link></div></header><main className="account-login-shell">{children}</main></div>; }
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) { return <label className="auth-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} /></label>; }
function BookingDetail({ booking }: { booking: HistoryBooking }) { return <div className="booking-detail"><div className="booking-detail-date"><span>{formatDate(booking.date)}</span><strong>{booking.startTime}</strong><small>{booking.startTime} — {booking.endTime}</small></div><div className="booking-detail-info"><div className="booking-detail-top"><h3>{booking.serviceName ?? "Formule S'Clean"}</h3><span className={`status ${booking.status}`}>{statusLabels[booking.status] ?? booking.status}</span></div><p><CarFront size={13} /> {booking.vehicleBrand ?? "Véhicule"} {booking.vehicleModel ?? ""} · {booking.vehicleColor ?? ""}</p><p><MapPin size={13} /> {booking.neighborhood} · {booking.address}</p><span className="booking-reference">{booking.bookingNumber}</span></div><div className="booking-detail-price"><span>Total</span><strong>{formatPrice(booking.totalPrice)} <small>FCFA</small></strong></div></div>; }
function BookingRow({ booking }: { booking: HistoryBooking }) { return <BookingDetail booking={booking} />; }
function AccountSkeleton({ rows = 1 }: { rows?: number }) { return <div className="account-skeleton">{Array.from({ length: rows }).map((_, index) => <div key={index} className="skeleton-line" />)}</div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatPrice(value: number) { return new Intl.NumberFormat("fr-FR").format(value); }
function initials(name?: string | null, email?: string | null) { return (name ?? email ?? "SC").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
export { AuthCallback };
