# Loup-Garou - Jeu de Formation

Application web de jeu de formation inspiree du Loup-Garou, concue pour etre jouee de maniere asynchrone sur plusieurs jours de formation.

## Prerequis

- Node.js v18 ou superieur
- pnpm v8 ou superieur

## Installation et demarrage

### 1. Installer les dependances

```bash
pnpm install
```

### 2. Initialiser la base de donnees

```bash
pnpm db:setup
```

Cela cree le fichier SQLite `packages/server/prisma/dev.db` et genere le client Prisma.

### 3. Demarrer l'application

```bash
pnpm dev
```

L'application demarre sur deux ports :
- Frontend : http://localhost:5173
- Backend API + Socket.io : http://localhost:3001

## Comment jouer

### Pour l'administrateur

1. Ouvrir http://localhost:5173/admin
2. Creer une session en choisissant un mot de passe et la composition des roles
3. Partager le code de session aux joueurs
4. Dans le tableau de bord admin, attendre que les joueurs rejoignent
5. Cliquer sur "Assigner les roles et demarrer"
6. Gerer chaque nuit via le tableau de bord
7. Pendant la journee, animer le debat en presentiel, puis enregistrer l'elimine dans l'app

### Pour les joueurs

1. Ouvrir le lien partage par l'admin (ou http://localhost:5173)
2. Entrer le code de session et choisir un pseudo
3. Attendre dans le lobby que la partie commence
4. A la revelation du role : toucher la carte pour la retourner
5. Suivre les instructions selon votre role

## Roles disponibles

- Villageois (v): Vote lors des debats
- Loup-Garou (v): Elimine une victime chaque nuit
- Voyante (v): Inspecte le role d'un joueur par nuit
- Sorciere (v): 1 potion de vie + 1 potion de mort
- Chasseur (v): Emporte quelqu'un a sa mort
- Cupidon (v): Lie deux amoureux (nuit 1 uniquement)
- Petite Fille (v): Peut espionner les loups (risque)

## Structure du projet

```
loupGarou/
+-packages/
  +-client/     # Frontend React + TypeScript + Tailwind
  +-server/     # Backend Express + Socket.io + Prisma
+-package.json  # Scripts racine (monorepo)
```

## Scripts disponibles

- `pnpm dev`      : Demarre le frontend et le backend en parallele
- `pnpm build`    : Build de production
- `pnpm db:setup` : Initialise la base de donnees

## Deploiement Docker

Le fichier [docker-compose.yml](docker-compose.yml) permet de deploiement en production avec un reverse proxy Caddy externe.

Avant de lancer la stack, creer le reseau externe si besoin:

```bash
docker network create caddy
```

Puis definir `APP_HOST` avec le nom de domaine public, par exemple dans un fichier `.env` a la racine:

```bash
APP_HOST=jeu.example.com
```

Demarrage:

```bash
docker compose up -d --build
```

## Conditions de victoire

- Village : Tous les loups-garous ont ete elimines
- Loups-Garous : Les loups sont en nombre egal ou superieur aux villageois
- Amoureux : Les deux amoureux sont les seuls survivants

## Depannage

La base de donnees n'existe pas :
```bash
pnpm db:setup
```

Reinitialiser la partie :
Supprimer `packages/server/prisma/dev.db` et relancer `pnpm db:setup`.
