import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  CalendarDays,
  CarFront,
  Loader2,
  LogIn,
  MapPin,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import BrandLogo from "@/components/BrandLogo";
import "../account.css";

type HistoryBooking = {
  bookingNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  neighborhood: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  serviceName: string | null;
  serviceDurationMinutes: number | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleType: string | null;
  vehicleColor: string | null;
  vehicleLicensePlate: string | null;
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmée",
  pending: "En attente",
  completed: "Terminée",
  cancelled: "Annulée",
  in_progress: "En cours",
  no_show: "No-show",
};

type AuthMode = "login" | "register";

export default function Account() {
  const [, setLocation] = useLocation();

  const nextPath = new URLSearchParams(
    window.location.search,
  ).get("next");

  const authMeQuery =
    trpc.auth.supabaseMe.useQuery(undefined, {
      retry: false,
      refetchOnWindowFocus: false,
    });

  const roleQuery = trpc.auth.supabaseRole.useQuery(
    undefined,
    {
      enabled: Boolean(authMeQuery.data),
      retry: false,
      refetchOnWindowFocus: false,
    },
  );

  const historyQuery =
    trpc.account.supabaseHistory.useQuery(undefined, {
      enabled: Boolean(authMeQuery.data),
      retry: false,
      refetchOnWindowFocus: false,
    });

  const signOut = trpc.auth.signOut.useMutation({
    onSuccess: () => void authMeQuery.refetch(),
  });

  useEffect(() => {
    if (
      roleQuery.data === "admin" ||
      roleQuery.data === "staff"
    ) {
      const destination =
        nextPath && nextPath.startsWith("/")
          ? nextPath
          : "/admin";

      setLocation(destination);
    }
  }, [nextPath, roleQuery.data, setLocation]);

  if (
    authMeQuery.isLoading ||
    (authMeQuery.data && roleQuery.isLoading)
  ) {
    return (
      <AccountFrame>
        <div className="account-loading">
          <Loader2 className="spin" size={22} />
          Vérification de votre session…
        </div>
      </AccountFrame>
    );
  }

  if (!authMeQuery.data) {
    return (
      <AccountFrame>
        <AuthPanel
          onAuthenticated={() =>
            void authMeQuery.refetch()
          }
        />
      </AccountFrame>
    );
  }

  const user = authMeQuery.data;

  const bookings = (historyQuery.data ??
    []) as HistoryBooking[];

  const nextBooking = bookings.find((booking) =>
    [
      "confirmed",
      "pending",
      "in_progress",
    ].includes(booking.status),
  );

  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "vous";

  return (
    <div className="account-page">
      <header className="navbar">
        <div className="container navbar-inner">
          <BrandLogo />

          <div className="account-header-actions">
            <span className="account-user">
              <span className="avatar">
                {initials(
                  user.user_metadata?.full_name,
                  user.email,
                )}
              </span>

              {user.user_metadata?.full_name ??
                user.email}
            </span>

            <button
              className="btn btn-outline"
              onClick={() => signOut.mutate()}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="container account-content">
        <div className="account-heading">
          <div>
            <div className="eyebrow">
              Votre espace personnel
            </div>

            <h1>Bonjour, {firstName}.</h1>

            <p>
              Suivez vos rendez-vous et retrouvez
              l&apos;historique de vos soins S&apos;Clean.
            </p>
          </div>

          <Link
            className="btn btn-primary"
            href="/booking"
          >
            Réserver un lavage
            <CalendarDays size={15} />
          </Link>
        </div>

        <section className="account-grid">
          <div className="account-main-column">
            <div className="account-card account-next-card">
              <div className="account-card-heading">
                <div>
                  <div className="eyebrow">
                    Prochaine réservation
                  </div>

                  <h2>
                    {nextBooking
                      ? "Votre prochain rendez-vous"
                      : "Prêt pour votre prochain soin ?"}
                  </h2>
                </div>

                <CalendarDays
                  size={20}
                  color="var(--champagne)"
                />
              </div>

              {historyQuery.isLoading ? (
                <AccountSkeleton />
              ) : historyQuery.error ? (
                <div className="account-empty">
                  <p>
                    Impossible de charger vos
                    réservations pour le moment.
                  </p>

                  <button
                    className="text-link"
                    onClick={() =>
                      void historyQuery.refetch()
                    }
                  >
                    Réessayer
                  </button>
                </div>
              ) : nextBooking ? (
                <BookingDetail booking={nextBooking} />
              ) : (
                <div className="account-empty">
                  <div className="empty-icon">
                    <CarFront size={20} />
                  </div>

                  <p>
                    Vous n&apos;avez encore aucune
                    réservation.
                  </p>

                  <Link
                    className="btn btn-champagne"
                    href="/booking"
                  >
                    Réserver mon premier lavage
                  </Link>
                </div>
              )}
            </div>

            <div className="account-card">
              <div className="account-card-heading">
                <div>
                  <div className="eyebrow">
                    Votre activité
                  </div>

                  <h2>
                    Historique des réservations
                  </h2>
                </div>

                <ReceiptText
                  size={20}
                  color="var(--sage)"
                />
              </div>

              {historyQuery.isLoading ? (
                <AccountSkeleton rows={3} />
              ) : historyQuery.error ? (
                <div className="account-empty">
                  <p>
                    Votre historique est momentanément
                    indisponible.
                  </p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="account-empty">
                  <p>
                    Vos réservations passées apparaîtront
                    ici après votre premier lavage.
                  </p>
                </div>
              ) : (
                <div className="history-list">
                  {bookings.map((booking) => (
                    <BookingRow
                      key={booking.bookingNumber}
                      booking={booking}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="account-side-column">
            <div className="account-card profile-card">
              <div className="profile-avatar">
                <UserRound size={22} />
              </div>

              <h2>
                {user.user_metadata?.full_name ??
                  "Client S'Clean"}
              </h2>

              <p>
                {user.email ??
                  user.phone ??
                  "Compte connecté"}
              </p>

              <div className="profile-line">
                <ShieldCheck size={14} />
                Compte vérifié par Supabase
              </div>

              <div className="profile-line">
                <CarFront size={14} />
                Vos véhicules sont associés à vos
                réservations
              </div>
            </div>

            <div className="account-card help-card">
              <div className="eyebrow">
                Besoin d&apos;aide ?
              </div>

              <h2>
                Nous sommes là pour vous.
              </h2>

              <p>
                Une question sur votre rendez-vous ?
                Contactez l&apos;équipe S&apos;Clean directement.
              </p>

              <a
                className="btn btn-outline"
                href="https://wa.me/2250797354590"
                target="_blank"
                rel="noreferrer"
              >
                Écrire sur WhatsApp
              </a>
            </div>
          </aside>
        </section>
      </main>
    </div>
   );
}

function AuthPanel({
  onAuthenticated,
}: {
  onAuthenticated: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>(() =>
    new URLSearchParams(window.location.search).get(
      "mode",
    ) === "register"
      ? "register"
      : "login",
  );

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: () => {
      toast.success("Connexion réussie.");
      onAuthenticated();
    },
    onError: (error) => toast.error(error.message),
  });

  const signUp = trpc.auth.signUp.useMutation({
    onSuccess: (data) => {
      const successMessage =
        data.requiresEmailConfirmation
          ? "Compte créé avec succès. Vérifiez votre email pour l'activer."
          : "Compte créé avec succès. Bienvenue chez S'Clean.";

      setMessage(successMessage);
      toast.success(successMessage);
      onAuthenticated();
    },
    onError: (error) => toast.error(error.message),
  });

  const googleUrl = trpc.auth.oauthUrl.useQuery(
    {
      provider: "google",
    },
    {
      enabled: false,
      retry: false,
    },
  );

  const appleUrl = trpc.auth.oauthUrl.useQuery(
    {
      provider: "apple",
    },
    {
      enabled: false,
      retry: false,
    },
  );

  const update = (
    key: keyof typeof form,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const oauth = async (
    provider: "google" | "apple",
  ) => {
    const result =
      provider === "google"
        ? await googleUrl.refetch()
        : await appleUrl.refetch();

    if (result.data?.url) {
      window.location.href = result.data.url;
    } else {
      toast.error(
        "Ce fournisseur OAuth n'est pas encore activé dans Supabase.",
      );
    }
  };

  return (
    <div className="account-login">
      <div className="account-login-icon">
        {mode === "register" ? (
          <UserRound size={24} />
        ) : (
          <LogIn size={24} />
        )}
      </div>

      <div className="eyebrow">
        Espace client S&apos;Clean
      </div>

      <h1>
        {mode === "register"
          ? "Créez votre compte."
          : "Retrouvez vos rendez-vous."}
      </h1>

      <p>
        {mode === "register"
          ? "Un compte personnel pour retrouver votre historique et réserver plus rapidement."
          : "Connectez-vous pour consulter votre historique, vos véhicules et vos prochains lavages."}
      </p>

      <div className="auth-tabs auth-tabs-two">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
        >
          Se connecter
        </button>

        <button
          className={
            mode === "register" ? "active" : ""
          }
          onClick={() => {
            setMode("register");
            setMessage("");
          }}
        >
          Créer un compte
        </button>
      </div>

      <div className="auth-form">
        {mode === "register" && (
          <Field
            label="Nom complet"
            value={form.fullName}
            onChange={(value) =>
              update("fullName", value)
            }
            placeholder="Votre nom et prénom"
          />
        )}

        <Field
          label="Email"
          value={form.email}
          onChange={(value) =>
            update("email", value)
          }
          placeholder="vous@exemple.com"
          type="email"
        />

        <Field
          label="Mot de passe"
          value={form.password}
          onChange={(value) =>
            update("password", value)
          }
          placeholder="8 caractères minimum"
          type="password"
        />

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={() =>
            mode === "register"
              ? signUp.mutate({
                  email: form.email,
                  password: form.password,
                  fullName: form.fullName,
                })
              : signIn.mutate({
                  identifier: form.email,
                  password: form.password,
                })
          }
          disabled={
            signIn.isPending || signUp.isPending
          }
        >
          {signIn.isPending || signUp.isPending
            ? "Patientez…"
            : mode === "register"
              ? "Créer mon compte"
              : "Se connecter"}

          <LogIn size={15} />
        </button>

        <div className="auth-divider">
          <span>ou continuer avec</span>
        </div>

        <div className="auth-socials">
          <button
            className="btn btn-outline"
            onClick={() => void oauth("google")}
          >
            Google
          </button>

          <button
            className="btn btn-outline"
            onClick={() => void oauth("apple")}
          >
            Apple
          </button>
        </div>
      </div>

      <p className="account-secure">
        <ShieldCheck size={14} />
        Vos données d&apos;authentification sont gérées par
        Supabase
      </p>

      <Link className="text-link" href="/">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

function AuthCallback() {
  const [, setLocation] = useLocation();

  const setSession =
    trpc.auth.setSession.useMutation({
      onSuccess: () => setLocation("/account"),
      onError: () => setLocation("/account"),
    });

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.replace(/^#/, ""),
    );

    const accessToken =
      params.get("access_token");

    const refreshToken =
      params.get("refresh_token") ?? undefined;

    if (accessToken) {
      setSession.mutate({
        accessToken,
        refreshToken,
      });
    } else {
      setLocation("/account");
    }
  }, [setLocation, setSession]);

  return (
    <AccountFrame>
      <div className="account-loading">
        <Loader2 className="spin" size={22} />
        Finalisation de votre connexion…
      </div>
    </AccountFrame>
  );
}

function AccountFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="account-page">
      <header className="navbar">
        <div className="container navbar-inner">
          <BrandLogo />

          <Link
            className="btn btn-outline"
            href="/booking"
          >
            Réserver
          </Link>
        </div>
      </header>

      <main className="account-login-shell">
        {children}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="auth-field">
      <span>{label}</span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

function BookingDetail({
  booking,
}: {
  booking: HistoryBooking;
}) {
  return (
    <div className="booking-detail">
      <div className="booking-detail-date">
        <span>{formatDate(booking.date)}</span>
        <strong>{booking.startTime}</strong>
        <small>
          {booking.startTime} — {booking.endTime}
        </small>
      </div>

      <div className="booking-detail-info">
        <div className="booking-detail-top">
          <h3>
            {booking.serviceName ??
              "Formule S'Clean"}
          </h3>

          <span
            className={`status ${booking.status}`}
          >
            {statusLabels[booking.status] ??
              booking.status}
          </span>
        </div>

        <p>
          <CarFront size={13} />
          {booking.vehicleBrand ?? "Véhicule"}{" "}
          {booking.vehicleModel ?? ""} ·{" "}
          {booking.vehicleColor ?? ""}
        </p>

        <p>
          <MapPin size={13} />
          {booking.neighborhood} · {booking.address}
        </p>

        <span className="booking-reference">
          {booking.bookingNumber}
        </span>
      </div>

      <div className="booking-detail-price">
        <span>Total</span>

        <strong>
          {formatPrice(booking.totalPrice)}{" "}
          <small>FCFA</small>
        </strong>
      </div>
    </div>
  );
}

function BookingRow({
  booking,
}: {
  booking: HistoryBooking;
}) {
  return <BookingDetail booking={booking} />;
}

function AccountSkeleton({
  rows = 1,
}: {
  rows?: number;
}) {
  return (
    <div className="account-skeleton">
      {Array.from({ length: rows }).map(
        (_, index) => (
          <div
            key={index}
            className="skeleton-line"
          />
        ),
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function initials(
  name?: string | null,
  email?: string | null,
) {
  return (name ?? email ?? "SC")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export { AuthCallback };
