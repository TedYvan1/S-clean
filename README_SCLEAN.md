# S'Clean — plateforme SaaS de réservation

Prototype fonctionnel basé sur le scaffold WebDev `web-db-user` (React 19, Vite, Express, tRPC, Drizzle/MySQL, Manus OAuth).

## Routes de démonstration

- `/` : landing page premium avec formules et zones d'intervention.
- `/booking` : parcours **Formule → Véhicule → Date → Créneau → Adresse → Confirmation**.
- `/admin` : back-office démonstratif avec dashboard, calendrier, réservations, clients, véhicules, prestations, disponibilités, zones, notifications et paramètres.
- `/account` : entrée de l'espace client.

## Architecture

- `drizzle/schema.ts` : tables users, customers, vehicles, services, bookings, availability, blockedSlots, teams, zones et notifications.
- `server/db.ts` : accès aux données et helpers de contrôle de chevauchement.
- `server/routers.ts` : procédures tRPC `services.list`, `availability.slots` et `bookings.create`.
- `client/src/pages/Booking.tsx` : UI client et états de réservation.
- `client/src/pages/Admin.tsx` : UI back-office.

## Règle critique

La procédure serveur `bookings.create` vérifie les horaires, la durée, les rendez-vous existants, le buffer de déplacement et le conflit avec les créneaux de démonstration avant de confirmer. La table `bookings` possède en complément un index unique date + heure de début pour éviter les doublons exacts.

Pour une mise en production multi-équipe, remplacer la carte mémoire de démonstration par une transaction SQL avec verrouillage des lignes de capacité d'équipe, puis connecter l'abstraction de paiement/notifications aux fournisseurs choisis.

## Commandes

```bash
pnpm check
pnpm test
pnpm build
```


## Authentification client

L’espace `/account` utilise le Manus OAuth fourni par le scaffold. Les visiteurs non connectés sont invités à se connecter via `startLogin()`. Une fois authentifié, le client consulte `account.history`, une procédure `protectedProcedure` qui ne retourne que les réservations rattachées à `customers.userId = ctx.user.id`. Le serveur ne fait jamais confiance à un identifiant client transmis par le navigateur.


## Connexion Supabase

- `SUPABASE_URL` + `SUPABASE_KEY` alimentent l’authentification email, téléphone, Google et Apple.
- `SUPABASE_SERVICE_ROLE_KEY` reste strictement côté serveur pour synchroniser les profils et les réservations via REST.
- Le schéma cible est versionné dans [`supabase/schema.sql`](./supabase/schema.sql). Il crée `sclean_profiles` et `sclean_bookings` avec RLS.
- Tant que ce SQL n’est pas appliqué au projet Supabase, l’historique client utilise temporairement la base S’Clean existante comme repli. Une fois les tables présentes, les nouvelles réservations authentifiées sont écrites dans Supabase et affichées depuis Supabase.


## Disponibilités et identité visuelle

Le calendrier `/booking` appelle désormais `availability.slots` avec la date et la durée de la formule. Le serveur interroge d’abord `sclean_bookings` dans Supabase et exclut les réservations annulées ; la création de réservation écrit également dans cette table. Le fichier `supabase/schema.sql` doit être appliqué dans Supabase pour activer ce mode persistant. L’interface n’affiche pas de faux créneaux si la source de disponibilité est indisponible.

Le logo fourni est stocké dans WebDev et réutilisé par les en-têtes public, client, réservation, confirmation, administration, pied de page et favicon.


## Sécurité de l’administration

L’écran `/admin` ne rend plus le tableau de bord sans autorisation. Chaque requête d’accès passe par `supabaseAdminProcedure`, qui exige une session Supabase valide puis vérifie le rôle `admin` ou `staff` dans `sclean_profiles`. Les visiteurs non connectés voient une page de connexion ; les clients authentifiés sans rôle adéquat reçoivent un refus `FORBIDDEN`. Après application de la migration Supabase, un administrateur peut attribuer un rôle avec une requête contrôlée dans le SQL Editor, par exemple `update public.sclean_profiles set role = 'admin' where email = 'administrateur@exemple.com';`.
