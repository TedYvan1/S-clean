import { useMemo, useState } from "react";
import { CalendarDays, FileText, LayoutDashboard, Loader2, LockKeyhole, LogOut, RefreshCw, WalletCards } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import BrandLogo from "@/components/BrandLogo";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Réservations", icon: FileText },
  { label: "Prestations", icon: WalletCards },
];
const statusLabels: Record<string, string> = { pending: "En attente", confirmed: "Confirmée", completed: "Terminée", cancelled: "Annulée", in_progress: "En cours", no_show: "No-show" };

export default function Admin() {
  const [, setLocation] = useLocation();
  const [active, setActive] = useState("Dashboard");
  const access = trpc.admin.access.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => {
      setLocation("/account?mode=login");
    },
    onError: () => {
      setLocation("/account?mode=login");
    },
  });
  if (access.isLoading) return <AdminAuthState loading />;
  if (access.isError || !access.data) return <AdminAuthState message={access.error?.message} />;
  return <div className="admin-page"><aside className="admin-sidebar"><div className="admin-brand"><BrandLogo /><small>Back-office connecté</small></div><nav className="admin-nav" aria-label="Navigation administrateur">{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={15} />{label}</button>)}</nav><div className="admin-footer"><div>Données Supabase<br />Rôle : {access.data.role}</div><button className="btn btn-outline" onClick={() => signOut.mutate()}><LogOut size={14} /> Déconnexion</button></div></aside><main className="admin-content"><div className="admin-topbar"><div><div className="eyebrow">S'Clean · pilotage</div><h1>{active}</h1><p>Les données affichées proviennent de la base de production.</p></div><span className="status confirmed">Connecté</span></div>{active === "Dashboard" && <Dashboard onNavigate={setActive} />}{active === "Réservations" && <Bookings />}{active === "Prestations" && <Services />}</main></div>;
}

function AdminAuthState({ loading, message }: { loading?: boolean; message?: string }) { return <div className="admin-auth-page"><div className="admin-auth-card"><BrandLogo /><div className="admin-auth-icon">{loading ? <Loader2 className="spin" size={25} /> : <LockKeyhole size={25} />}</div><div className="eyebrow">Administration S'Clean</div><h1>{loading ? "Vérification de l’accès…" : "Espace sécurisé"}</h1><p>{loading ? "Nous vérifions votre session et votre rôle." : message ?? "Connectez-vous avec un compte administrateur ou staff autorisé."}</p>{!loading && <Link className="btn btn-primary" href="/account?mode=login&next=%2Fadmin">Se connecter à l’administration</Link>}</div></div>; }

function Dashboard({ onNavigate }: { onNavigate: (value: string) => void }) {
  const bookings = trpc.admin.bookings.useQuery(undefined, { retry: false });
  const services = trpc.admin.services.useQuery(undefined, { retry: false });
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.data?.filter((booking) => booking.date === today && booking.status !== "cancelled").length ?? 0;
  const revenue = bookings.data?.filter((booking) => booking.status !== "cancelled").reduce((sum, booking) => sum + Number(booking.total_price), 0) ?? 0;
  return <><div className="metrics-grid"><Metric label="Aujourd'hui" value={String(todayCount)} /><Metric label="Réservations" value={String(bookings.data?.length ?? 0)} /><Metric label="Chiffre d'affaires" value={`${new Intl.NumberFormat("fr-FR").format(revenue)} FCFA`} /><Metric label="Prestations actives" value={String(services.data?.filter((service) => service.active).length ?? 0)} /></div><section className="admin-card"><div className="card-heading"><h2>Prochains rendez-vous</h2><button className="text-link" onClick={() => onNavigate("Réservations")}>Voir les réservations</button></div>{bookings.isLoading ? <Loader2 className="spin" size={22} /> : <BookingList rows={(bookings.data ?? []).filter((booking) => booking.status !== "cancelled").slice(0, 8)} />}</section></>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><CalendarDays size={15} color="var(--champagne)" /></div><strong className="metric-value">{value}</strong><span className="metric-trend">Données actualisées</span></div>; }

function Bookings() {
  const utils = trpc.useUtils();
  const query = trpc.admin.bookings.useQuery(undefined, { retry: false });
  const update = trpc.admin.updateBookingStatus.useMutation({ onSuccess: () => { toast.success("Statut enregistré."); void utils.admin.bookings.invalidate(); }, onError: (error) => toast.error(error.message) });
  return <section className="admin-card"><div className="card-heading"><div><h2>Réservations réelles</h2><p>Réservations persistées dans Supabase.</p></div><button className="btn btn-outline" onClick={() => void query.refetch()}><RefreshCw size={14} /> Actualiser</button></div>{query.isLoading ? <Loader2 className="spin" size={22} /> : query.error ? <p>{query.error.message}</p> : <><div className="table-wrap"><table className="data-table"><thead><tr><th>Référence</th><th>Client</th><th>Quand</th><th>Véhicule</th><th>Total</th><th>Statut</th></tr></thead><tbody>{(query.data ?? []).map((row) => <tr key={row.booking_number}><td><strong>{row.booking_number}</strong></td><td>{row.customer_name}<br /><small>{row.phone}</small></td><td>{row.date} · {String(row.start_time).slice(0, 5)}</td><td>{row.vehicle}<br /><small>{row.neighborhood}</small></td><td>{new Intl.NumberFormat("fr-FR").format(row.total_price)} FCFA</td><td><select value={row.status} disabled={update.isPending} onChange={(event) => update.mutate({ bookingNumber: row.booking_number, status: event.target.value as "pending" | "confirmed" | "completed" | "cancelled" | "in_progress" | "no_show" })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}</tbody></table></div>{query.data?.length === 0 && <p>Aucune réservation pour le moment.</p>}</>}</section>;
}

function BookingList({ rows }: { rows: Array<any> }) { return rows.length ? <div className="schedule-list">{rows.map((row) => <div className="schedule-row" key={row.booking_number}><span className="schedule-time">{String(row.start_time).slice(0, 5)}</span><div className="schedule-info"><strong>{row.customer_name} · {row.service_name}</strong><span>{row.vehicle} · {row.neighborhood}</span></div><span className={`status ${row.status}`}>{statusLabels[row.status] ?? row.status}</span></div>)}</div> : <p>Aucun rendez-vous à afficher.</p>; }

function Services() {
  const query = trpc.admin.services.useQuery(undefined, { retry: false });
  const activeCount = useMemo(() => query.data?.filter((service) => service.active).length ?? 0, [query.data]);
  return <section className="admin-card"><div className="card-heading"><div><h2>Prestations & tarifs</h2><p>{activeCount} prestation(s) active(s), gérées dans Supabase.</p></div></div>{query.isLoading ? <Loader2 className="spin" size={22} /> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Prestation</th><th>Description</th><th>Prix</th><th>Durée</th><th>Statut</th></tr></thead><tbody>{(query.data ?? []).map((service) => <tr key={service.id}><td><strong>{service.name}</strong></td><td>{service.description}</td><td>{new Intl.NumberFormat("fr-FR").format(service.price)} FCFA</td><td>{service.durationMinutes} min</td><td><span className={`status ${service.active ? "confirmed" : "cancelled"}`}>{service.active ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div>}</section>;
}
