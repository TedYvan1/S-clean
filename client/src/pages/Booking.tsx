import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Home, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import BrandLogo from "@/components/BrandLogo";
import { trpc } from "@/lib/trpc";

type Service = { id: number; name: string; price: number; duration: number; description: string; badge?: string };
const fallbackServiceOptions: Service[] = [
  { id: 1, name: "Essentiel", price: 12000, duration: 45, description: "L'entretien régulier, simple et soigné." },
  { id: 2, name: "Premium", price: 22000, duration: 90, description: "Le soin complet, dedans comme dehors.", badge: "Recommandé" },
  { id: 3, name: "Éco Premium", price: 28000, duration: 120, description: "Une finition profonde, avec moins d'eau.", badge: "Éco" },
];
const MONTH_NAMES = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function daysInMonth(year: number, monthIndex: number) {
  // monthIndex 0-11
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Build a 6x7 grid (42 cells) for the calendar. Each cell: { day: number, muted: boolean, isCurrentMonth: boolean }
function buildCalendarCells(year: number, monthIndex: number) {
  const cells: Array<{ day: number; muted: boolean; isCurrentMonth: boolean }> = [];
  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 (Sun) - 6 (Sat)
  // Convert to Monday-first index (0 = Mon .. 6 = Sun)
  const leading = (firstDay + 6) % 7;
  const prevMonthIndex = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevMonthYear = monthIndex === 0 ? year - 1 : year;
  const prevMonthDays = daysInMonth(prevMonthYear, prevMonthIndex);
  const currentMonthDays = daysInMonth(year, monthIndex);

  // previous month tail
  for (let i = 0; i < leading; i++) {
    cells.push({ day: prevMonthDays - (leading - 1 - i), muted: true, isCurrentMonth: false });
  }
  // current month days
  for (let d = 1; d <= currentMonthDays; d++) {
    cells.push({ day: d, muted: false, isCurrentMonth: true });
  }
  // next month head
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextDay++, muted: true, isCurrentMonth: false });
  }
  return cells;
}

export default function Booking() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service>(fallbackServiceOptions[1]);
  const [vehicleType, setVehicleType] = useState("SUV");
  const [vehicle, setVehicle] = useState({ brand: "Toyota", model: "RAV4", color: "Noir", plate: "AB 1234 XX" });
  const [selectedDate, setSelectedDate] = useState(() => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date()));
  // calendar navigation state
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => new Date().getMonth()); // 0-11
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  const [selectedSlot, setSelectedSlot] = useState("09:00");
  const [address, setAddress] = useState({ neighborhood: "Riviera", street: "Rue des Jardins, Cocody", landmark: "Près de la pharmacie les Orchidées", phone: "+225 07 97 35 45 90" });
  const [confirmed, setConfirmed] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");

  const total = useMemo(() => service.price + (address.neighborhood === "Zone éloignée" ? 3000 : 0), [service.price, address.neighborhood]);
  const servicesQuery = trpc.services.list.useQuery();
  const liveServices = (servicesQuery.data ?? []).map((item) => ({ id: item.id, name: item.name, price: item.price, duration: item.durationMinutes, description: item.description }));
  const serviceOptions = liveServices.length ? liveServices : fallbackServiceOptions;
  const availabilityQuery = trpc.availability.slots.useQuery({ date: dateToIso(selectedDate), durationMinutes: service.duration }, { enabled: step === 3, refetchOnWindowFocus: false });
  const createBooking = trpc.bookings.create.useMutation({ onSuccess: (data) => { setBookingNumber(data.bookingNumber); setConfirmed(true); toast.success("Votre réservation est confirmée et enregistrée."); }, onError: (error) => toast.error(error.message) });
  useEffect(() => { const firstAvailable = availabilityQuery.data?.find((slot) => slot.status === "available"); const currentIsAvailable = availabilityQuery.data?.some((slot) => slot.time === selectedSlot && slot.status === "available"); if (firstAvailable && !currentIsAvailable) setSelectedSlot(firstAvailable.time); }, [availabilityQuery.data, selectedSlot]);

  function next() {
    if (step === 4 && !address.street.trim()) { toast.error("Indiquez l'adresse du lavage pour continuer."); return; }
    setStep((value) => Math.min(value + 1, 5));
  }
  function confirmBooking() { createBooking.mutate({ serviceId: service.id, date: dateToIso(selectedDate), startTime: selectedSlot, customerName: "Client S'Clean", phone: address.phone, vehicle: `${vehicle.brand} ${vehicle.model}`, address: address.street, neighborhood: address.neighborhood, landmark: address.landmark }); }

  if (confirmed) return <Confirmation number={bookingNumber} service={service} vehicle={vehicle} date={selectedDate} slot={selectedSlot} address={address} total={total} />;

  return <div className="booking-page">
    <div className="container booking-top"><BrandLogo /></div>
    <div className="container booking-shell">
      <main className="booking-main">
        <div className="stepper" aria-label="Progression de réservation">
          {["Formule", "Véhicule", "Créneau", "Adresse", "Confirmation"].map((label, index) => <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}><div className={`stepper-item ${step >= index + 1 ? "active" : ""}`}><span className="stepper-dot">{step > index + 1 ? <Check size={12} /> : index + 1}</span><span>{label}</span></div>{index < 4 && <span className="stepper-line" />}</div>)}
        </div>
        {step === 1 && <ServiceStep value={service} options={serviceOptions} onChange={setService} />}
        {step === 2 && <VehicleStep type={vehicleType} setType={setVehicleType} vehicle={vehicle} setVehicle={setVehicle} />}
        {step === 3 && <SlotStep date={selectedDate} setDate={setSelectedDate} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} availability={availabilityQuery.data} isLoading={availabilityQuery.isLoading} hasError={Boolean(availabilityQuery.error)} currentMonthIndex={currentMonthIndex} currentYear={currentYear} setCurrentMonthIndex={setCurrentMonthIndex} setCurrentYear={setCurrentYear} /> }
        {step === 4 && <AddressStep address={address} setAddress={setAddress} />}
        {step === 5 && <ReviewStep service={service} vehicle={vehicle} date={selectedDate} slot={selectedSlot} address={address} total={total} onConfirm={confirmBooking} isConfirming={createBooking.isPending} onEdit={(target) => setStep(target)} />}
        {step < 5 && <div className="form-actions"><button className="btn btn-ghost" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}><ArrowLeft size={14} /> Retour</button><button className="btn btn-primary" onClick={next}>Continuer <ArrowRight size={14} /></button></div>}
      </main>
      <aside className="summary-card"><div className="summary-visual"><img src="/assets/s-clean-transparent.webp" alt="Soin S'Clean à domicile" /></div><h3>Votre réservation</h3><div className="summary-row"><span>Formule</span><strong>{service.name}</strong></div><div className="summary-row"><span>Véhicule</span><strong>{vehicle.brand} {vehicle.model}</strong></div><div className="summary-row"><span>Date</span><strong>{selectedDate}</strong></div><div className="summary-row"><span>Créneau</span><strong>{selectedSlot} · {formatDuration(service.duration)}</strong></div><div className="summary-row"><span>Zone</span><strong>{address.neighborhood}</strong></div><div className="summary-total"><span>Total estimé</span><strong>{formatPrice(total)} <small style={{ fontFamily: "Montserrat", fontSize: "0.6rem" }}>FCFA</small></strong></div><p style={{ display: "flex", gap: 7, alignItems: "center", margin: "21px 0 0", color: "var(--muted)", fontSize: "0.61rem", lineHeight: 1.5 }}><ShieldCheck size={14} color="var(--sage)" /> Créneau vérifié selon les disponibilités S'Clean.</p></aside>
    </div>
  </div>;
}

function ServiceStep({ value, options, onChange }: { value: Service; options: Service[]; onChange: (service: Service) => void }) { return <section className="form-section"><div className="eyebrow">Étape 1 sur 5</div><h2>Choisissez votre formule</h2><p>Un soin adapté à votre véhicule, avec une durée et un tarif clairs.</p><div className="option-grid">{options.map((item) => <button key={item.name} className={`option-card ${value.name === item.name ? "selected" : ""}`} onClick={() => onChange(item)}>{value.name === item.name && <span className="selected-check"><Check size={12} /></span>}{item.badge && <span className="badge">{item.badge}</span>}<h3>{item.name}</h3><p>{item.description}</p><strong>{formatPrice(item.price)} <small>FCFA</small></strong><small><Clock3 size={11} style={{ verticalAlign: "-2px", marginRight: 4 }} />{formatDuration(item.duration)}</small></button>)}</div></section>; }
function VehicleStep({ type, setType, vehicle, setVehicle }: { type: string; setType: (value: string) => void; vehicle: { brand: string; model: string; color: string; plate: string }; setVehicle: (value: { brand: string; model: string; color: string; plate: string }) => void }) { const update = (key: keyof typeof vehicle, value: string) => setVehicle({ ...vehicle, [key]: value }); return <section className="form-section"><div className="eyebrow">Étape 2 sur 5</div><h2>Parlez-nous de votre véhicule</h2><p>Ces informations aident notre équipe à préparer le soin le plus juste.</p><div className="field-grid"><div className="field full"><label htmlFor="vehicle-type">Type de véhicule</label><select id="vehicle-type" value={type} onChange={(event) => setType(event.target.value)}>{["Citadine", "Berline", "SUV", "4x4", "Pick-up", "Utilitaire", "Autre"].map((item) => <option key={item}>{item}</option>)}</select></div>{(["brand", "model", "color", "plate"] as const).map((key) => <div className="field" key={key}><label htmlFor={key}>{({ brand: "Marque", model: "Modèle", color: "Couleur", plate: "Immatriculation" } as Record<string, string>)[key]}</label><input id={key} value={vehicle[key]} onChange={(event) => update(key, event.target.value)} /></div>)}<div className="field full"><label htmlFor="vehicle-note">Commentaire facultatif</label><textarea id="vehicle-note" placeholder="Une attention particulière à signaler ?" /></div></div></section>; }
function SlotStep({ date, setDate, selectedSlot, setSelectedSlot, availability, isLoading, hasError, currentMonthIndex, currentYear, setCurrentMonthIndex, setCurrentYear }: { date: string; setDate: (date: string) => void; selectedSlot: string; setSelectedSlot: (slot: string) => void; availability?: Array<{ time: string; status: "available" | "reserved" | "pause" }>; isLoading: boolean; hasError: boolean; currentMonthIndex: number; currentYear: number; setCurrentMonthIndex: (n: number) => void; setCurrentYear: (y: number) => void }) {
  const visibleSlots = availability ?? [];
  const selectedDay = parseInt(date.split(" ")[0], 10);
  const cells = buildCalendarCells(currentYear, currentMonthIndex);
  const monthLabel = `${MONTH_NAMES[currentMonthIndex].charAt(0).toUpperCase()}${MONTH_NAMES[currentMonthIndex].slice(1)} ${currentYear}`;

  function goPreviousMonth() {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  }
  function goNextMonth() {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  }

  return <section className="form-section"><div className="eyebrow">Étape 3 sur 5</div><h2>Choisissez votre créneau</h2><p>Les horaires affichés tiennent compte de la durée de la formule et des rendez-vous existants.</p><div className="calendar-layout"><div><div className="calendar-toolbar"><button aria-label="Mois précédent" onClick={goPreviousMonth}><ChevronLeft size={15} /></button><strong>{monthLabel}</strong><button aria-label="Mois suivant" onClick={goNextMonth}><ChevronRight size={15} /></button></div><div className="calendar-grid">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}{cells.map((cell, index) => {
    const muted = cell.muted;
    const day = String(cell.day);
    const active = cell.isCurrentMonth && Number(day) === selectedDay;
    return <button key={`${day}-${index}`} className={`calendar-day ${muted ? "muted" : "available"} ${active ? "selected" : ""}`} disabled={muted} onClick={() => {
      if (!muted) setDate(`${day} ${MONTH_NAMES[currentMonthIndex]} ${currentYear}`);
    }}>{day}</button>;
  })}</div></div><div className="slot-list"><h3>Créneaux disponibles</h3><p><CalendarDays size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} /> {date}</p>{isLoading ? <div className="slot-loading">Actualisation des disponibilités…</div> : hasError ? <div className="slot-loading">Les disponibilités sont momentanément indisponibles.</div> : visibleSlots.map((slot) => <button key={slot.time} className={`slot ${selectedSlot === slot.time ? "selected" : ""}`} disabled={slot.status !== "available"} onClick={() => setSelectedSlot(slot.time)}><span>{slot.time}</span><span className="slot-status">{slot.status === "available" ? (selectedSlot === slot.time ? "Sélectionné ✓" : "Disponible") : slot.status === "pause" ? "Pause" : "Réservé"}</span></button>)}</div></div></section>; }
function AddressStep({ address, setAddress }: { address: { neighborhood: string; street: string; landmark: string; phone: string }; setAddress: (value: { neighborhood: string; street: string; landmark: string; phone: string }) => void }) { const update = (key: keyof typeof address, value: string) => setAddress({ ...address, [key]: value }); return <section className="form-section"><div className="eyebrow">Étape 4 sur 5</div><h2>Où devons-nous vous retrouver ?</h2><p>Indiquez l'adresse du lavage. Nous nous déplaçons avec tout le nécessaire.</p><div className="field-grid"><div className="field"><label htmlFor="neighborhood">Commune / quartier</label><select id="neighborhood" value={address.neighborhood} onChange={(event) => update("neighborhood", event.target.value)}>{["Cocody", "Riviera", "M'Pouto", "Zone éloignée"].map((item) => <option key={item}>{item}</option>)}</select></div><div className="field"><label htmlFor="phone">Téléphone</label><input id="phone" value={address.phone} onChange={(event) => update("phone", event.target.value)} /></div><div className="field full"><label htmlFor="address">Adresse</label><input id="address" value={address.street} onChange={(event) => update("street", event.target.value)} placeholder="Rue, résidence, villa..." /></div><div className="field full"><label htmlFor="landmark">Point de repère</label><input id="landmark" value={address.landmark} onChange={(event) => update("landmark", event.target.value)} placeholder="En face de..., près de..." /></div></div><div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 22, padding: "14px 15px", borderRadius: 5, background: "rgba(143,162,140,0.11)", color: "#6c806a", fontSize: "0.68rem" }}><Home size={16} /> Les zones Cocody, Riviera et M'Pouto sont actuellement sans frais de déplacement.</div></section>; }
function ReviewStep({ service, vehicle, date, slot, address, total, onConfirm, isConfirming, onEdit }: { service: Service; vehicle: { brand: string; model: string; color: string; plate: string }; date: string; slot: string; address: { neighborhood: string; street: string; landmark: string; phone: string }; total: number; onConfirm: () => void; isConfirming: boolean; onEdit: (step: number) => void }) { return <section className="form-section"><div className="eyebrow">Étape 5 sur 5</div><h2>Une dernière vérification</h2><p>Relisez les détails de votre rendez-vous avant de le confirmer.</p><div className="admin-card" style={{ boxShadow: "none" }}><div className="summary-row"><span>Formule</span><strong>{service.name} · {formatDuration(service.duration)}</strong><button className="text-link" onClick={() => onEdit(1)}>Modifier</button></div><div className="summary-row"><span>Véhicule</span><strong>{vehicle.brand} {vehicle.model} · {vehicle.color}<br />{vehicle.plate}</strong><button className="text-link" onClick={() => onEdit(2)}>Modifier</button></div><div className="summary-row"><span>Date & heure</span><strong>{date} · {slot}</strong><button className="text-link" onClick={() => onEdit(3)}>Modifier</button></div><div className="summary-row"><span>Adresse</span><strong>{address.neighborhood}<br />{address.street}</strong><button className="text-link" onClick={() => onEdit(4)}>Modifier</button></div><div className="summary-total"><span>Total à régler sur place</span><strong>{formatPrice(total)} <small style={{ fontFamily: "Montserrat", fontSize: "0.6rem" }}>FCFA</small></strong></div></div><div className="form-actions"><button className="btn btn-ghost" onClick={() => onEdit(4)}><ArrowLeft size={14} /> Retour</button><button className="btn btn-champagne" onClick={onConfirm} disabled={isConfirming}>{isConfirming ? "Enregistrement…" : "Confirmer ma réservation"} <Check size={15} /></button></div></section>; }
function Confirmation({ number, service, vehicle, date, slot, address, total }: { number: string; service: Service; vehicle: { brand: string; model: string }; date: string; slot: string; address: { neighborhood: string; street: string }; total: number }) { return <div className="booking-page"><div className="container booking-top"><BrandLogo /></div><div className="container booking-shell"><main className="booking-main confirmation"><div><div className="confirmation-icon"><Check size={34} /></div><div className="eyebrow">Réservation confirmée</div><h2>Votre voiture est entre de bonnes mains.</h2><p>Merci pour votre confiance. Notre équipe vous retrouvera à l'adresse indiquée et vous enverra un rappel avant le rendez-vous.</p><div className="booking-number">{number}</div><div className="admin-card" style={{ marginTop: 28, textAlign: "left", boxShadow: "none" }}><div className="summary-row"><span>Formule</span><strong>{service.name}</strong></div><div className="summary-row"><span>Véhicule</span><strong>{vehicle.brand} {vehicle.model}</strong></div><div className="summary-row"><span>Quand</span><strong>{date} · {slot}</strong></div><div className="summary-row"><span>Où</span><strong>{address.neighborhood}, {address.street}</strong></div><div className="summary-total"><span>Total</span><strong>{formatPrice(total)} <small style={{ fontFamily: "Montserrat", fontSize: "0.6rem" }}>FCFA</small></strong></div></div><div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}><Link className="btn btn-outline" href="/booking">Faire une autre réservation</Link><Link className="btn btn-primary" href="/">Retour à l'accueil</Link></div></div></main><aside className="summary-card"><div style={{ display: "grid", gap: 14 }}><div className="eyebrow">S'Clean</div><h3 style={{ marginBottom: 4 }}>Une attention, jusqu'au bout.</h3><p style={{ margin: 0, color: "var(--muted)", fontSize: "0.72rem", lineHeight: 1.7 }}>Votre confirmation est enregistrée. Vous pourrez retrouver vos rendez-vous et vos véhicules dans votre espace personnel.</p><div style={{ marginTop: 18, color: "var(--sage)", fontSize: "0.7rem", fontWeight: 700 }}><MapPin size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Abidjan · service à domicile</div></div></aside></div></div>; }function dateToIso(value: string) { const [day, monthName, year] = value.split(" "); const month = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"].indexOf(monthName) + 1; return `${year}-${String(month).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`; }
function formatPrice(price: number) { return new Intl.NumberFormat("fr-FR").format(price); }
function formatDuration(minutes: number) { return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, "0") : ""}` : `${minutes} min`; }
