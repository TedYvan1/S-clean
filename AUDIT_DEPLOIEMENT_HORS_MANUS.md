# Audit S’Clean — déploiement hors de Manus

Date de l’audit : 28 septembre 2026  
Archive auditée : `copie-de-s’clean-—-lavage-auto-à-domicile.zip`

## Verdict synthétique

**Le projet est un prototype fonctionnel, pas encore une application de production autonome.**

Le build frontend + serveur passe et l’application démarre localement. En revanche, plusieurs chemins critiques dépendent encore de Manus ou de données de démonstration : assets servis par `/manus-storage`, authentification Manus présente dans le scaffold, notification Manus, écran admin statique, réservation non atomique et persistance de secours en mémoire.

### État des vérifications

| Vérification | Résultat | Commentaire |
|---|---:|---|
| Installation `pnpm install --frozen-lockfile` | OK avec avertissement | Les réglages `pnpm.patchedDependencies` et `pnpm.overrides` sont ignorés par la version utilisée. |
| `pnpm check` / TypeScript | OK lors de la vérification détaillée | La première exécution a retourné un code 1 sans message exploitable ; la relance directe de `tsc` est passée. |
| `pnpm test` | Échec partiel : 5/7 tests | 4 fichiers passent ; 2 tests Supabase échouent car les variables et le projet Supabase ne sont pas présents dans l’environnement vierge. |
| `pnpm build` | OK | Vite produit `dist/public` et esbuild produit `dist/index.js`. Avertissement de chunk JS > 500 kB. |
| Smoke test production | OK | La page `/` et `system.health` répondent après démarrage du build ; le serveur logue toutefois l’absence de `OAUTH_SERVER_URL`. |

## Architecture observée

- Frontend : React 19 + Vite + Tailwind/Radix.
- Backend : Express + tRPC.
- Données : schéma Drizzle/MySQL historique **et** tables Supabase ajoutées ensuite.
- Authentification : Supabase pour l’espace client, mais scaffold Manus OAuth toujours présent côté serveur/client.
- Stockage d’images : proxy `/manus-storage/*` vers le stockage Manus.
- Déploiement : aucun Dockerfile, aucune configuration de plateforme, aucun `.env.example`, aucun pipeline CI/CD dans l’archive.

## Bloquants avant mise en production

### P0 — à traiter avant toute ouverture au public

#### 1. Supprimer la dépendance opérationnelle à Manus

Références relevées :

- `vite-plugin-manus-runtime` dans `package.json` et `vite.config.ts`.
- OAuth Manus dans `server/_core/sdk.ts`, `server/_core/oauth.ts`, `client/src/const.ts` et `client/src/_core/hooks/useAuth.ts`.
- Notification propriétaire via `forge.manus.im` dans `server/_core/notification.ts`.
- Proxy de fichiers `/manus-storage/*` dans `server/_core/storageProxy.ts`.
- Images et favicon appelés via `/manus-storage/...`.
- Collecteur de debug `/__manus__/...` dans Vite et `client/public/__manus__/debug-collector.js`.
- LLM/data API Manus dans les modules `_core`.

Décision recommandée : **standardiser l’application sur Supabase Auth + Supabase Postgres/Storage**, ou choisir explicitement un autre fournisseur. Il faut ensuite retirer le code Manus non utilisé, pas seulement laisser ses variables vides.

#### 2. Remplacer les assets Manus

Les fichiers image référencés dans le code ne sont pas présents dans l’archive :

- `/manus-storage/sclean-logo-cropped_56f2ee31.png`
- `/manus-storage/sclean-hero_d36f3bd5.jpg`

À faire :

- récupérer les originaux ;
- les placer dans `client/public/assets/` ou Supabase Storage ;
- remplacer les URLs par des URLs locales ou CDN ;
- mettre à jour le favicon ;
- vérifier les images en build de production.

Sans cette étape, le site sera partiellement cassé hors de Manus.

#### 3. Choisir une seule source de vérité pour les données

Le projet mélange :

- Drizzle/MySQL : `users`, `customers`, `vehicles`, `bookings`, `services`, etc. ;
- Supabase : `sclean_profiles`, `sclean_bookings`.

Ce doublon crée des comportements divergents : historique, catalogue, disponibilités et administration ne lisent pas tous la même source.

Choix conseillé pour réduire le périmètre : **Supabase Auth + Supabase Postgres comme source canonique**, puis migration des tables métier utiles vers Postgres et suppression du chemin MySQL/scaffold Manus. Si MySQL est conservé, il faut au contraire retirer le stockage Supabase métier et implémenter une vraie stratégie de synchronisation.

#### 4. Rendre la réservation réellement persistante et atomique

Le chemin `bookings.create` présente plusieurs risques :

- si Supabase n’est pas disponible, la réservation peut être confirmée sans être enregistrée ;
- l’insertion Supabase est silencieusement ignorée en cas d’erreur (`createSupabaseBooking` retourne `false`) ;
- le tableau `demoBookings` est en mémoire et disparaît au redémarrage ;
- la lecture des disponibilités puis l’insertion ne sont pas dans une transaction/verrouillage ; deux clients peuvent réserver le même créneau simultanément ;
- la contrainte unique date + heure existe dans Drizzle/MySQL, mais pas comme contrainte unique dans `supabase/schema.sql` ;
- le serveur accepte `totalPrice` et `durationMinutes` fournis par le navigateur sans recalculer strictement depuis le service en base ;
- le serveur écrit un `service_name` fixe (`Formule S'Clean`) au lieu du service sélectionné.

À faire :

1. recalculer prix, durée, frais de zone et heure de fin côté serveur ;
2. vérifier que le service est actif et que ses paramètres correspondent au catalogue ;
3. ajouter une contrainte unique ou une réservation de capacité adaptée dans la base canonique ;
4. faire la vérification + insertion dans une transaction atomique ;
5. ne retourner `confirmed` qu’après succès persistant ;
6. gérer explicitement les erreurs de contrainte et les rendre au client ;
7. remplacer le calendrier de démonstration par les vraies disponibilités.

#### 5. Remplacer le back-office de démonstration

`client/src/pages/Admin.tsx` affiche des données codées en dur : réservations, clients, véhicules, prestations, équipes, zones et chiffres de dashboard. Les boutons affichent des toasts du type « mode démonstration » au lieu d’appeler le serveur.

À faire au minimum :

- lister les réservations depuis la base ;
- modifier statut, créneau et affectation d’équipe ;
- gérer les clients et véhicules ;
- gérer services, tarifs, durées et zones ;
- gérer disponibilités, pauses et blocages ;
- ajouter pagination, recherche et filtres ;
- ajouter audit log pour les changements sensibles ;
- connecter les mutations tRPC et écrire les tests d’autorisation.

#### 6. Finaliser l’authentification de production

Supabase Auth est déjà amorcé, mais il faut :

- créer/configurer le projet Supabase cible ;
- appliquer `supabase/schema.sql` ;
- configurer les URLs de redirection de production (`https://DOMAINE/auth/callback`) ;
- activer et configurer Google/Apple seulement si nécessaire ;
- configurer l’email de confirmation et le fournisseur SMTP ;
- définir le premier compte `admin` et tester le rôle ;
- supprimer l’auth Manus et les redirections `startLogin()` ;
- gérer le renouvellement du refresh token : actuellement `getSupabaseUser` ne lit que le cookie d’accès ;
- tester cookies `Secure`, `HttpOnly`, `SameSite=None` derrière le reverse proxy ;
- ajouter `app.set("trust proxy", 1)` si Express est placé derrière Render, Railway, Fly, Nginx ou équivalent, afin que `req.protocol` reflète HTTPS.

## P1 — indispensable pour une vraie exploitation

### Paiement

Aucun paiement en ligne n’est implémenté. L’interface indique « Total à régler sur place » et les réservations sont créées avec `payment_status = unpaid`.

Décider entre :

- paiement sur place assumé explicitement dans les conditions ;
- acompte/paiement en ligne via un prestataire adapté à la Côte d’Ivoire ;
- paiement mobile money avec webhook et vérification serveur.

Ne jamais marquer une réservation comme payée sur la base d’un retour navigateur : utiliser un webhook signé et idempotent.

### Notifications

Le seul service de notification serveur est Manus. Il faut choisir et intégrer un fournisseur hors Manus pour :

- confirmation client par email ;
- rappel avant rendez-vous ;
- notification administrateur ;
- éventuellement WhatsApp ou SMS.

Prévoir une table/file de notifications, les retries, l’idempotence et l’observabilité des échecs.

### Catalogue et interface de réservation

Le frontend de `Booking.tsx` contient encore :

- services/prix/durées codés en dur ;
- date et calendrier affichés sur septembre 2026 ;
- client envoyé comme `Client S'Clean` au lieu d’un profil ou d’un formulaire réel ;
- commentaire véhicule saisi mais non transmis ;
- point de repère saisi mais non transmis ;
- zone éloignée affichée avec un coût mais logique serveur à fiabiliser ;
- validation client limitée, sans contrôle serveur complet des données métier.

À faire : récupérer le catalogue depuis `services.list`, utiliser la date courante et le fuseau horaire métier, transmettre toutes les données utiles, et valider les champs côté serveur.

### Sécurité

- ajouter une limitation de débit sur login, OTP, OAuth et création de réservation ;
- définir une politique CORS explicite si frontend et API sont séparés ;
- ajouter validation de taille/format et logs sans données personnelles sensibles ;
- vérifier qu’aucune clé `SUPABASE_SERVICE_ROLE_KEY` ne part au navigateur ;
- ne pas exposer les données clients dans des logs de debug ;
- ajouter headers de sécurité (CSP, HSTS en HTTPS, `X-Content-Type-Options`, etc.) ;
- vérifier les règles RLS et les accès admin dans un projet neuf ;
- prévoir suppression/export des données et politique de rétention pour les données personnelles.

### Tests et qualité

Les tests Supabase actuels sont des tests d’intégration obligatoires : ils échouent sans `SUPABASE_URL`, `SUPABASE_KEY` et `SUPABASE_SERVICE_ROLE_KEY`.

À faire :

- fournir `.env.example` sans secrets ;
- séparer `test:unit` et `test:integration` ;
- faire `test:integration` uniquement si les variables sont présentes ;
- ajouter une base Supabase de test ou un projet de staging ;
- tester concurrence de réservation, changement de prix, permissions admin et refresh token ;
- ajouter tests frontend/e2e sur inscription, réservation, confirmation et accès admin ;
- traiter l’avertissement de bundle JS > 500 kB par découpage lazy des pages admin/showcase.

## P2 — préparation du déploiement et de l’exploitation

### Fichiers et automatisation manquants

Ajouter :

- `.env.example` documenté ;
- `Dockerfile` multi-stage ou configuration de plateforme ;
- `.dockerignore` ;
- script de migration/seed de production ;
- endpoint health HTTP dédié, par exemple `GET /healthz` ;
- pipeline CI : install frozen, typecheck, tests, build ;
- staging avant production ;
- procédure de rollback ;
- stratégie de sauvegardes et restauration ;
- monitoring erreurs et disponibilité ;
- logs structurés avec corrélation par requête.

### Variables à définir côté hébergeur

Variables minimales côté application selon l’architecture retenue :

```text
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://<projet>.supabase.co
SUPABASE_KEY=<clé publique anon>
SUPABASE_SERVICE_ROLE_KEY=<clé serveur uniquement>
JWT_SECRET=<secret aléatoire long si une session locale reste utilisée>
```

Ne pas recopier les variables Manus `OAUTH_SERVER_URL`, `VITE_APP_ID`, `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL` ou `OWNER_OPEN_ID` dans le déploiement final, sauf décision explicite de conserver ces fonctionnalités.

### Hébergement recommandé

Le serveur est un processus Express qui sert à la fois l’API et les fichiers Vite. Une cible simple est donc :

- un service Node avec `pnpm build` puis `pnpm start` ;
- Supabase pour Postgres/Auth/Storage ;
- un domaine HTTPS ;
- variables secrètes configurées dans l’hébergeur ;
- sauvegardes et logs de la plateforme.

Un hébergement statique seul ne suffit pas tant que l’API Express/tRPC reste nécessaire.

## Ordre d’exécution recommandé

1. **Décider l’architecture canonique** : Supabase-only recommandé.
2. **Créer le projet Supabase de staging**, appliquer le schéma et définir l’admin.
3. **Remplacer les assets Manus** et supprimer le proxy `/manus-storage`.
4. **Retirer l’auth, les notifications, le runtime et le debug Manus** du chemin de production.
5. **Refondre la réservation** : catalogue serveur, transaction, contrainte d’unicité, erreurs persistantes.
6. **Brancher l’admin sur les vraies tables** et supprimer les données fictives.
7. **Décider/intégrer paiement et notifications**.
8. **Ajouter `.env.example`, Dockerfile, migrations/seed et CI**.
9. **Ajouter tests d’intégration et e2e**, puis exécuter un test de charge léger sur les créneaux.
10. **Déployer en staging**, vérifier OAuth, cookies HTTPS, réservation concurrente, notifications et restauration.
11. **Configurer domaine, DNS, HTTPS, monitoring et sauvegardes**, puis seulement ouvrir la production.

## Critère de “prêt à déployer”

Le projet pourra être considéré comme prêt lorsque les conditions suivantes seront vraies :

- `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test` et `pnpm build` passent dans CI ;
- aucune page ou image ne dépend de `manus-storage`, Manus OAuth ou `forge.manus.im` ;
- une réservation confirmée existe après redémarrage du serveur ;
- deux demandes simultanées du même créneau n’en créent qu’une ;
- le prix, la durée et le service sont déterminés par le serveur ;
- l’admin lit et modifie les données réelles avec contrôle de rôle ;
- le compte client fonctionne avec email et refresh de session ;
- les notifications et le statut de paiement ont un fournisseur réel ou sont explicitement désactivés dans le produit ;
- un staging reproductible et une procédure de rollback existent.
