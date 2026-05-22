# Guide de deploiement ROVER

## Vue d'ensemble

Le deploiement de ROVER suit un flux automatise a 2 environnements : **staging** et **production**.
Chaque environnement dispose de sa propre infrastructure Azure (Container App, base de donnees, variables).

```
Tag Git
  |
  |--- staging-vX.Y.Z --------+
  |                            |
  |--- release-vX.Y.Z ---+    |
                          |    |
                          v    v
                GitHub Actions CD (.github/workflows/cd.yml)
                    |   - Lint, typecheck, tests
                    |   - Build image Docker production
                    |   - Push vers Azure Container Registry
                    v
                Azure Container Registry (ACR)
                    |
       +------------+------------+
       |                         |
       v                         v
  rover:staging-X.Y.Z      rover:X.Y.Z
  rover:staging-latest      rover:latest
       |                         |
       v                         v
  Azure DevOps Pipeline     Azure DevOps Pipeline
  (env: staging)            (env: production)
       |                         |
       v                         v
  Container App STAGING     Container App PRODUCTION
```

---

## Workflow recommande

Le deploiement suit un flux staging-first pour minimiser les risques :

1. **Deployer en staging** d'abord pour valider les changements
2. **Tester manuellement** sur l'environnement staging
3. **Deployer en production** une fois le staging valide

```
main (stable)
  |
  +-- staging-v1.2.3  →  CI/CD staging  →  test  →  OK ?
  |                                                    |
  +-- release-v1.2.3  ←  ←  ←  ←  ←  ←  ←  ←  ←  ← oui
```

---

## Conventions de tags Git

| Prefixe du tag       | Environnement cible | Tags image Docker                          |
| -------------------- | ------------------- | ------------------------------------------ |
| `staging-vX.Y.Z`    | Staging             | `rover:staging-X.Y.Z`, `rover:staging-latest` |
| `release-vX.Y.Z`    | Production          | `rover:X.Y.Z`, `rover:latest`             |

La version doit suivre le format **semver** : `X.Y.Z` (ex: `1.2.3`, `2.0.0`).

---

## Prerequis

### Infrastructure Azure

- **Azure Container Registry (ACR)** : registre Docker pour stocker les images
- **Azure Container Apps (x2)** : une Container App par environnement (staging + production)
- **Azure Database for PostgreSQL (x2)** : une base par environnement
- **Azure DevOps** : pipeline de deploiement avec 2 environnements configures

### Outils locaux

- Git
- Docker (pour les tests locaux)
- Azure CLI (`az`) pour les operations manuelles

---

## Configuration des secrets GitHub

Dans le depot GitHub, aller dans **Settings > Secrets and variables > Actions** et creer les secrets suivants :

| Secret                       | Description                                    | Exemple                        |
| ---------------------------- | ---------------------------------------------- | ------------------------------ |
| `AZURE_REGISTRY_URL`        | URL du registre ACR                            | `monregistry.azurecr.io`      |
| `AZURE_REGISTRY_USERNAME`   | Nom d'utilisateur ACR                          | `monregistry`                  |
| `AZURE_REGISTRY_PASSWORD`   | Mot de passe ACR                               | `xxxxxxxxxxxxxxxxxxxxxxxx`     |

Ces secrets sont partages entre les deploiements staging et production (meme registre ACR).

---

## Configuration Azure DevOps

### Variable Groups

Deux Variable Groups sont necessaires dans **Azure DevOps > Pipelines > Library** :

#### Variable Group `rover-staging`

Variables pour l'environnement staging :

| Variable                    | Type   | Description                                        |
| --------------------------- | ------ | -------------------------------------------------- |
| `DATABASE_URL`             | Secret | URL PostgreSQL de staging                          |
| `SESSION_SECRET`           | Secret | Secret de session staging (min 64 chars)           |
| `MICROSOFT_CLIENT_ID`     | Secret | App Registration Azure AD (staging)                |
| `MICROSOFT_TENANT_ID`     | Secret | Tenant Azure AD                                    |
| `MICROSOFT_CLIENT_SECRET` | Secret | Secret Azure AD (staging)                          |
| `ALLOWED_DOMAIN`          | Normal | Domaine autorise (ex: `omneseducation.com`)        |
| `ALLOWED_ORIGINS`         | Normal | Origines CORS staging (ex: `https://rover-staging.omneseducation.com`) |
| `AZURE_REGISTRY_URL`      | Normal | URL du registre ACR                                |
| `AZURE_REGISTRY_USERNAME` | Normal | Nom d'utilisateur ACR                              |
| `AZURE_REGISTRY_PASSWORD` | Secret | Mot de passe ACR                                   |
| `AZURE_SERVICE_CONNECTION`| Normal | Nom de la connexion de service Azure               |
| `CONTAINER_APP_NAME`      | Normal | Nom de la Container App staging                    |
| `RESOURCE_GROUP`           | Normal | Nom du Resource Group staging                      |
| `CONTAINER_APP_FQDN`      | Normal | FQDN de la Container App staging                   |

#### Variable Group `rover-prod`

Meme structure que `rover-staging`, mais avec les valeurs de production :

| Variable                    | Type   | Description                                        |
| --------------------------- | ------ | -------------------------------------------------- |
| `DATABASE_URL`             | Secret | URL PostgreSQL de production                       |
| `SESSION_SECRET`           | Secret | Secret de session production (min 64 chars)        |
| `MICROSOFT_CLIENT_ID`     | Secret | App Registration Azure AD (production)             |
| `MICROSOFT_TENANT_ID`     | Secret | Tenant Azure AD                                    |
| `MICROSOFT_CLIENT_SECRET` | Secret | Secret Azure AD (production)                       |
| `ALLOWED_DOMAIN`          | Normal | Domaine autorise (ex: `omneseducation.com`)        |
| `ALLOWED_ORIGINS`         | Normal | Origines CORS production (ex: `https://rover.omneseducation.com`) |
| `AZURE_REGISTRY_URL`      | Normal | URL du registre ACR                                |
| `AZURE_REGISTRY_USERNAME` | Normal | Nom d'utilisateur ACR                              |
| `AZURE_REGISTRY_PASSWORD` | Secret | Mot de passe ACR                                   |
| `AZURE_SERVICE_CONNECTION`| Normal | Nom de la connexion de service Azure               |
| `CONTAINER_APP_NAME`      | Normal | Nom de la Container App production                 |
| `RESOURCE_GROUP`           | Normal | Nom du Resource Group production                   |
| `CONTAINER_APP_FQDN`      | Normal | FQDN de la Container App production                |

### Connexion de service Azure

1. Aller dans **Project Settings > Service connections**
2. Creer une connexion de type **Azure Resource Manager**
3. Utiliser le mode **Service principal (automatic)** ou **manual** selon les permissions
4. Nommer la connexion et utiliser ce nom dans la variable `AZURE_SERVICE_CONNECTION`

Note : La meme connexion de service peut etre partagee entre staging et production si les deux
environnements sont dans le meme abonnement Azure. Sinon, creer une connexion par environnement.

### Environnements de deploiement

Creer 2 environnements dans **Pipelines > Environments** :

1. **`staging`** : deploiement sans approbation manuelle (flux rapide)
2. **`production`** : ajouter une approbation manuelle pour securiser le deploiement

Pour configurer les approbations :
- Cliquer sur l'environnement `production`
- Aller dans le menu **...** > **Approvals and checks**
- Ajouter une approbation avec les personnes autorisees

---

## Deploiement

### Deploiement staging

1. **Verifier que la branche `main` est stable** :
   ```bash
   git checkout main
   git pull origin main
   npm run lint
   npm run check
   npm test
   ```

2. **Creer un tag staging** :
   ```bash
   git tag -a staging-v1.2.3 -m "Staging 1.2.3 : description des changements"
   git push origin staging-v1.2.3
   ```

3. **Le workflow GitHub CD se declenche automatiquement** :
   - Execute la CI complete (lint, typecheck, tests)
   - Build l'image Docker production
   - Pousse l'image vers ACR avec les tags `rover:staging-1.2.3` et `rover:staging-latest`

4. **Declencher le pipeline Azure DevOps** :
   - Aller dans Azure DevOps > Pipelines
   - Selectionner le pipeline ROVER
   - Cliquer sur **Run pipeline**
   - Choisir `environment` = **staging**
   - Renseigner `imageTag` = **staging-1.2.3** (ou **staging-latest**)
   - Le pipeline execute : migration DB staging, deploiement, health check

5. **Tester manuellement** l'application sur l'URL staging

### Deploiement production

Une fois le staging valide :

1. **Creer un tag release** (meme version que le staging valide) :
   ```bash
   git tag -a release-v1.2.3 -m "Release 1.2.3 : description des changements"
   git push origin release-v1.2.3
   ```

2. **Le workflow GitHub CD se declenche automatiquement** :
   - Meme CI que le staging
   - Pousse l'image vers ACR avec les tags `rover:1.2.3` et `rover:latest`

3. **Declencher le pipeline Azure DevOps** :
   - Choisir `environment` = **production**
   - Renseigner `imageTag` = **1.2.3** (ou **latest**)
   - L'approbation manuelle sera demandee si configuree sur l'environnement `production`
   - Le pipeline execute : migration DB production, deploiement, health check

### Verifier le deploiement

Apres le deploiement, verifier manuellement :

```bash
# Health check staging
curl -s -o /dev/null -w "%{http_code}" https://<STAGING_FQDN>/api/auth/user

# Health check production
curl -s -o /dev/null -w "%{http_code}" https://<PRODUCTION_FQDN>/api/auth/user

# Doit retourner 401 (non authentifie) ou 200 (si cookie valide)
```

---

## Rollback

### Rollback staging

1. **Via Azure DevOps** :
   - Relancer le pipeline avec `environment` = **staging** et le tag de la version precedente
     (ex: `imageTag` = `staging-1.1.0`)

2. **Via Azure CLI** (urgence) :
   ```bash
   az containerapp update \
     --name <STAGING_CONTAINER_APP_NAME> \
     --resource-group <STAGING_RESOURCE_GROUP> \
     --image <AZURE_REGISTRY_URL>/rover:staging-<VERSION_PRECEDENTE>
   ```

### Rollback production

1. **Via Azure DevOps** :
   - Relancer le pipeline avec `environment` = **production** et le tag de la version precedente
     (ex: `imageTag` = `1.1.0`)

2. **Via Azure CLI** (urgence) :
   ```bash
   az containerapp update \
     --name <PROD_CONTAINER_APP_NAME> \
     --resource-group <PROD_RESOURCE_GROUP> \
     --image <AZURE_REGISTRY_URL>/rover:<VERSION_PRECEDENTE>
   ```

### Rollback de migration

Les rollbacks de migration Prisma ne sont pas automatises. En cas de besoin :

1. Identifier la migration problematique dans `prisma/migrations/`
2. Se connecter a la base de donnees de l'environnement concerne (staging ou production)
3. Executer manuellement les operations inverses
4. Marquer la migration comme rollbackee dans `_prisma_migrations`

**Important** : Toujours tester les migrations sur staging avant la production. C'est l'un des
principaux avantages du flux staging-first.

---

## Variables d'environnement

| Variable                    | Obligatoire | Description                                        |
| --------------------------- | ----------- | -------------------------------------------------- |
| `DATABASE_URL`             | Oui         | URL PostgreSQL (format: `postgresql://user:pass@host:5432/db?sslmode=require`) |
| `SESSION_SECRET`           | Oui         | Secret de session (min 64 chars aleatoires)        |
| `NODE_ENV`                 | Oui         | Toujours `production`                              |
| `PORT`                     | Oui         | `8080` (port par defaut de Container Apps)         |
| `MICROSOFT_CLIENT_ID`     | Oui         | Client ID Azure AD pour OAuth                      |
| `MICROSOFT_TENANT_ID`     | Oui         | Tenant ID Azure AD                                 |
| `MICROSOFT_CLIENT_SECRET` | Oui         | Client Secret Azure AD                             |
| `ALLOWED_DOMAIN`          | Non         | Domaine email autorise (ex: `omneseducation.com`)  |
| `ALLOWED_ORIGINS`         | Non         | Origines CORS autorisees                           |

### Generation du SESSION_SECRET

Generer un secret different pour chaque environnement :

```bash
# Secret pour staging
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Secret pour production (different de staging !)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Architecture Docker

Le Dockerfile multi-stage produit une image de production minimale :

```
base (node:22-alpine)
  +-- dependencies (npm ci avec toutes les deps)
       +-- development (pour le dev local avec hot reload)
       +-- builder (compile TypeScript + build Vite)
            +-- production (image finale, deps prod uniquement)
```

L'image de production contient :
- Node.js 22 Alpine
- Dependances de production uniquement (`npm ci --omit=dev`)
- Backend compile (`dist/server/index.js`)
- Frontend build (`dist/public/`)
- Client Prisma genere
- Types partages (`shared/`)

Taille estimee : ~250-350 Mo (selon les dependances).

La meme image Docker est utilisee en staging et en production. Seules les variables
d'environnement different (configurees via les Variable Groups Azure DevOps).

---

## Resume des fichiers CI/CD

| Fichier                             | Role                                            | Declenchement                        |
| ----------------------------------- | ----------------------------------------------- | ------------------------------------ |
| `.github/workflows/ci.yml`         | CI : lint, typecheck, tests, build Docker (dry)  | Push main, PR vers main              |
| `.github/workflows/cd.yml`         | CD : CI + build + push Docker vers ACR           | Tags `staging-v*` et `release-v*`   |
| `azure-pipelines.yml`              | Deploiement : migration, deploy, health check    | Manuel (Run pipeline)                |

---

## Depannage

### L'image Docker ne se build pas en CI

- Verifier que le `Dockerfile` est a la racine du projet
- Verifier que `.dockerignore` n'exclut pas de fichiers necessaires
- Consulter les logs du job `docker-build-push` dans GitHub Actions

### La migration echoue

- Verifier que `DATABASE_URL` est correct dans le Variable Group (staging ou prod)
- Verifier que la base de donnees est accessible depuis Azure (firewall, VNet)
- Consulter les logs de l'ACI ephemere dans le portail Azure

### Le health check echoue

- Verifier que la Container App est en cours d'execution (`az containerapp show`)
- Verifier les logs de la Container App (`az containerapp logs show`)
- Verifier que `CONTAINER_APP_FQDN` est correct dans le Variable Group
- Verifier que l'ingress est configure sur le port 8080

### Problemes de connexion a ACR

- Verifier que les credentials ACR sont corrects dans les secrets GitHub
- Verifier que le registre ACR autorise les connexions depuis GitHub Actions
- Tester la connexion manuellement : `docker login <registry>.azurecr.io`

### Mauvais environnement deploye

- Verifier le prefixe du tag Git (`staging-v` vs `release-v`)
- Verifier le parametre `environment` dans Azure DevOps lors du Run pipeline
- Verifier que le `imageTag` correspond au bon environnement
  (ex: `staging-1.2.3` pour staging, `1.2.3` pour production)
