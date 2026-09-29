# Mise en route Supabase — S’Clean

## 1. Créer le projet de staging

Dans Supabase, créer un projet dédié à staging. Récupérer dans **Project Settings → API** :

- `Project URL` → `SUPABASE_URL`
- clé `anon` publique → `SUPABASE_KEY`
- clé `service_role` → `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur

Ne jamais mettre la clé `service_role` dans le frontend, dans Git ou dans un fichier `.env` partagé.

## 2. Appliquer le schéma

Ouvrir le SQL Editor Supabase et exécuter le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Le script crée :

- profils et rôles ;
- services et tarifs ;
- zones et frais ;
- disponibilités et blocages ;
- réservations ;
- index de créneau ;
- fonction RPC atomique `create_sclean_booking` ;
- politiques RLS.

## 3. Créer le premier administrateur

1. Créer un compte depuis `/account?mode=register`.
2. Vérifier son email si la confirmation est activée.
3. Exécuter dans le SQL Editor :

```sql
update public.sclean_profiles
set role = 'admin', updated_at = now()
where email = 'adresse-admin@example.com';
```

Le compte doit ensuite pouvoir ouvrir `/admin`.

## 4. Configurer les URLs d’authentification

Dans **Authentication → URL Configuration** :

- ajouter l’URL du staging dans `Site URL` ;
- ajouter `https://staging.example.com/auth/callback` dans les redirect URLs ;
- ajouter ensuite l’URL de production lors du passage en production.

Google et Apple restent optionnels. Le formulaire email/mot de passe fonctionne sans ces fournisseurs.

## 5. Lancer localement

```bash
cp .env.example .env
# renseigner les quatre variables Supabase utiles
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
NODE_ENV=production pnpm start
```

L’endpoint de supervision est : `GET /healthz`.

## 6. Déployer le service Node

Le projet doit être déployé sur un hébergeur qui supporte un processus Node/Express, avec :

- commande de build : `pnpm build` ;
- commande de démarrage : `pnpm start` ;
- variable `PORT` fournie par la plateforme ;
- variables Supabase configurées comme secrets ;
- domaine HTTPS configuré avant les tests OAuth.

Un hébergement statique seul ne suffit pas car tRPC et l’authentification passent par Express.

## 7. Déployer sur Render

Le fichier [`render.yaml`](./render.yaml) décrit le service web Node :

- installation reproductible avec `npm ci` ;
- build avec `npm run build` ;
- démarrage avec `npm start` ;
- supervision via `GET /healthz` ;
- secrets Supabase à renseigner dans les variables privées Render.

Dans Render, utiliser **New → Blueprint** et sélectionner le dépôt contenant `render.yaml`. Renseigner ensuite `SUPABASE_URL`, `SUPABASE_KEY` et `SUPABASE_SERVICE_ROLE_KEY`. Render fournit automatiquement `PORT` ; il ne faut pas le remplacer par une valeur fixe en production.

Après création du premier compte, attribuer explicitement le rôle `admin` dans Supabase. Lorsqu’un compte `admin` ou `staff` se connecte depuis `/admin`, il est automatiquement renvoyé vers le terminal administratif. Un compte client authentifié reste dans l’espace client et reçoit `FORBIDDEN` côté serveur s’il tente d’appeler les procédures admin.

## 8. Test de recette staging

Vérifier dans cet ordre :

1. la page `/` charge le logo et le visuel locaux ;
2. `/account` permet une inscription et une connexion ;
3. `/booking` affiche les services de Supabase ;
4. la disponibilité correspond aux réservations réelles ;
5. une réservation est visible après redémarrage du serveur ;
6. deux demandes concurrentes du même créneau ne créent qu’une réservation ;
7. l’administrateur voit les réservations et peut changer leur statut ;
8. un compte client sans rôle reçoit `FORBIDDEN` sur `/admin`.
