# Audit de sécurité — Drizzle ORM

Date : 29 septembre 2026

## Correction appliquée

La dépendance directe `drizzle-orm` a été mise à jour de `0.44.7` installée (`^0.44.5` déclarée) vers `0.45.3` :

```json
"drizzle-orm": "^0.45.3"
```

Le fichier `package-lock.json` a été régénéré avec `npm install`. La version `0.45.3` est supérieure à la version corrigée minimale `0.45.2` indiquée par l’avis de sécurité.

Vérification effectuée :

```text
npm audit --omit=dev
0 vulnerabilities
```

## Nature de la vulnérabilité

L’avis `GHSA-gpj5-g38j-94v9`, également référencé comme `CVE-2026-39356`, concerne l’échappement incorrect des identifiants SQL quotés dans plusieurs dialectes Drizzle : PostgreSQL, MySQL, SQLite, SingleStore et Gel.

Le risque apparaît lorsqu’une application transmet une donnée contrôlée par un attaquant à une API qui construit un nom de colonne, de table ou d’alias, par exemple `sql.identifier()` ou un alias dynamique. Un délimiteur SQL injecté peut alors fermer l’identifiant et introduire une nouvelle portion de requête.

La vulnérabilité a une sévérité CVSS 3.1 de 7.5 (High). Elle ne concerne pas les applications qui utilisent uniquement des objets de schéma statiques ou qui limitent les noms dynamiques à une liste blanche.

## Audit du code S’Clean

L’usage Drizzle restant dans le projet est une couche MySQL legacy située dans `server/db.ts`, avec son schéma dans `drizzle/schema.ts`. Les requêtes observées utilisent :

- des tables et colonnes importées statiquement depuis `drizzle/schema.ts` ;
- des filtres `eq` et `and` sur des colonnes connues ;
- des tris statiques sur `bookings.date` et `bookings.startTime` ;
- aucune entrée utilisateur utilisée comme nom de table, colonne ou alias SQL.

La recherche du code n’a trouvé aucune utilisation de `sql.identifier()` ou `sql.raw()`. Les appels `.orderBy()` utilisent uniquement des colonnes du schéma. Le chemin métier actuellement utilisé pour les réservations et l’administration est Supabase, pas cette couche MySQL legacy.

La mise à jour de la dépendance est donc la correction nécessaire au niveau du paquet, et aucun changement de requête n’était requis pour supprimer une exploitation présente dans le code actuel.

## Résultats de validation

- `drizzle-orm` installé : `0.45.3`.
- `drizzle-kit` installé : `0.31.11`.
- Audit production (`npm audit --omit=dev`) : **0 vulnérabilité**.
- Typecheck TypeScript : **OK**.
- Tests du projet : **5 tests passés, 2 suites d’intégration ignorées** faute de variables Supabase.
- Build frontend et serveur : **OK**.

L’audit complet incluant les outils de développement signale encore des vulnérabilités dans `vitest`, `vite`, `esbuild` et des dépendances de `drizzle-kit`. Elles ne sont pas dans le bundle d’exécution Render, mais doivent faire l’objet d’un chantier séparé de mise à niveau des outils de développement.

## Recommandations conservées

1. Ne jamais construire un nom de colonne, de table ou d’alias à partir d’un paramètre HTTP sans liste blanche stricte.
2. Utiliser les colonnes importées du schéma pour les tris et filtres dynamiques.
3. Ne pas utiliser `sql.raw()` avec des données utilisateur.
4. Supprimer à terme la couche MySQL/Drizzle legacy si Supabase reste la source canonique, ce qui réduira encore la surface de dépendances.

## Références

[1]: https://github.com/advisories/GHSA-gpj5-g38j-94v9 "GitHub Advisory — Drizzle ORM SQL identifier escaping"
[2]: https://osv.dev/vulnerability/GHSA-gpj5-g38j-94v9 "OSV — GHSA-gpj5-g38j-94v9"
[3]: https://www.npmjs.com/package/drizzle-orm "npm — drizzle-orm"
[4]: https://orm.drizzle.team/docs/sql "Drizzle documentation — SQL template and parameterization"
