# Guide de deploiement ROVER

## Vue d'ensemble

Le deploiement de ROVER suit un flux automatise a 2 environnements : **staging** et **production**.
Chaque environnement dispose de sa propre infrastructure Azure (Container App, base de donnees, variables).

Le code source transite de GitHub vers Azure DevOps Git, ou le pipeline Azure DevOps prend le relais
pour builder l'image Docker, la pousser vers ACR, migrer la base de donnees et deployer.

```
GitHub (code source)
  |
  +-- push main → CI (lint, typecheck, tests, build, docker validation)
  |
  +-- tag staging-vX.Y.Z ou release-vX.Y.Z
        |
        → GitHub Actions CD :
            1. Relance CI (qualite + build)
            2. Push le code source vers Azure DevOps Git
        |
        → Azure DevOps Pipeline (declenche par le tag) :
            1. Detecte l'environnement depuis le tag
            2. Build image Docker production
            3. Push image vers ACR
               +-----------------------------+
               |                             |
               v                             v
          rover:staging-X.Y.Z          rover:X.Y.Z
          rover:staging-latest          rover:latest
               |                             |
               v                             v
            4. Migrate DB (Prisma)
            5. Deploy sur Container App
            6. Health check
               |                             |
               v                             v
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
  +-- staging-v1.2.3  →  CI + push Azure DevOps  →  build + deploy staging  →  test  →  OK ?
  |                                                                                       |
  +-- release-v1.2.3  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ←  ← oui
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
- **Azure DevOps** : repo Git (miroir) + pipeline de deploiement avec 2 environnements configures

### Outils locaux

- Git
- Docker (pour les tests locaux)
- Azure CLI (`az`) pour les operations manuelles

---

## Configuration de l'environnement GitHub `ToAzureDevOps`

L'environnement GitHub `ToAzureDevOps` est utilise par le workflow CD pour pousser le code vers
Azure DevOps Git. Il isole les credentials Azure DevOps du reste du repo.

### Creation de l'environnement

1. Dans le depot GitHub, aller dans **Settings > Environments**
2. Cliquer sur **New environment**
3. Nommer l'environnement : `ToAzureDevOps`
4. (Optionnel) Ajouter des regles de protection (branches autorisees, reviewers)

### Secret a configurer

| Secret               | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `AZURE_DEVOPS_PAT`  | Personal Access Token Azure DevOps avec permission **Code (Read & Write)** sur le repo cible |

Pour generer le PAT :
1. Aller dans Azure DevOps > **User Settings** (icone profil) > **Personal access tokens**
2. Cliquer sur **New Token**
3. Configurer :
   - **Name** : `rover-github-push` (ou similaire)
   - **Organization** : selectionner l'organisation cible
   - **Scopes** : **Code** > **Read & Write**
   - **Expiration** : selon la politique de securite (max 1 an)
4. Copier le token et le sauvegarder dans le secret GitHub

### Variables a configurer

| Variable              | Description                                           | Exemple                    |
| --------------------- | ----------------------------------------------------- | -------------------------- |
| `AZURE_DEVOPS_ORG`   | Nom de l'organisation Azure DevOps                    | `MonOrg`                  |
| `AZURE_DEVOPS_PROJECT`| Nom du projet Azure DevOps                           | `ROVER`                   |
| `AZURE_DEVOPS_REPO`  | Nom du repo Git Azure DevOps (miroir)                 | `rover`                   |

---

## Configuration Azure DevOps

### Repo Git Azure DevOps

Le repo Azure DevOps est un **miroir** du repo GitHub. Il est mis a jour automatiquement par
le workflow CD GitHub via un `git push --force`. Ne pas modifier directement le code dans ce repo.

1. Creer un repo Git dans Azure DevOps : **Repos > New repository**
2. Nommer le repo (ex: `rover`)
3. Ne pas initialiser avec un README (le contenu viendra de GitHub)

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

### Configuration du pipeline

1. Aller dans **Pipelines > New pipeline**
2. Selectionner **Azure Repos Git** comme source
3. Selectionner le repo miroir (ex: `rover`)
4. Selectionner **Existing Azure Pipelines YAML file**
5. Pointer vers `azure-pipelines.yml` a la racine

Le pipeline se declenchera automatiquement quand GitHub Actions poussera un tag.

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
   - Build applicatif (esbuild + Vite) pour validation
   - Pousse le code source + le tag vers Azure DevOps Git

4. **Le pipeline Azure DevOps se declenche automatiquement** :
   - Detecte l'environnement depuis le tag (`staging`)
   - Build l'image Docker production
   - Pousse l'image vers ACR avec les tags `rover:staging-1.2.3` et `rover:staging-latest`
   - Execute la migration Prisma sur la base staging
   - Deploie sur la Container App staging
   - Effectue un health check

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
   - Pousse le code source + le tag vers Azure DevOps Git

3. **Le pipeline Azure DevOps se declenche automatiquement** :
   - Detecte l'environnement depuis le tag (`production`)
   - Build l'image Docker production
   - Pousse l'image vers ACR avec les tags `rover:1.2.3` et `rover:latest`
   - L'approbation manuelle sera demandee si configuree sur l'environnement `production`
   - Execute la migration Prisma sur la base production
   - Deploie sur la Container App production
   - Effectue un health check

### Deploiement manuel (fallback)

Si le declenchement automatique ne fonctionne pas, le pipeline Azure DevOps peut etre lance
manuellement :

1. Aller dans Azure DevOps > Pipelines
2. Selectionner le pipeline ROVER
3. Cliquer sur **Run pipeline**
4. Choisir `environment` = **staging** ou **production**
5. Le pipeline detectera automatiquement le tag si present, sinon utilisera le parametre

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
   - Relancer le pipeline manuellement avec `environment` = **staging**
   - Pousser un ancien tag depuis GitHub pour re-declencher le flux complet

2. **Via Azure CLI** (urgence) :
   ```bash
   az containerapp update \
     --name <STAGING_CONTAINER_APP_NAME> \
     --resource-group <STAGING_RESOURCE_GROUP> \
     --image <AZURE_REGISTRY_URL>/rover:staging-<VERSION_PRECEDENTE>
   ```

### Rollback production

1. **Via Azure DevOps** :
   - Relancer le pipeline manuellement avec `environment` = **production**
   - Pousser un ancien tag depuis GitHub pour re-declencher le flux complet

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

**Important** : L'image Docker est maintenant buildee par le pipeline Azure DevOps (et non plus
par GitHub Actions). Les credentials ACR ne sont plus necessaires dans les secrets GitHub.

---

## Resume des fichiers CI/CD

| Fichier                             | Role                                                        | Declenchement                        |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `.github/workflows/ci.yml`         | CI : lint, typecheck, tests, build, Docker validation (dry) | Push main, PR vers main              |
| `.github/workflows/cd.yml`         | CD : CI + push code vers Azure DevOps Git                   | Tags `staging-v*` et `release-v*`   |
| `azure-pipelines.yml`              | Build Docker, push ACR, migration, deploy, health check     | Tags pousses par GitHub Actions (auto) ou manuel |

---

## Depannage

### Le push vers Azure DevOps echoue

- Verifier que le PAT (`AZURE_DEVOPS_PAT`) est valide et non expire
- Verifier que le PAT a la permission **Code (Read & Write)** sur le repo cible
- Verifier les variables `AZURE_DEVOPS_ORG`, `AZURE_DEVOPS_PROJECT`, `AZURE_DEVOPS_REPO`
  dans l'environnement GitHub `ToAzureDevOps`
- Verifier que le repo Azure DevOps existe et est accessible

### Le pipeline Azure DevOps ne se declenche pas

- Verifier que le tag a bien ete pousse vers Azure DevOps (`git tag -l` dans le repo Azure DevOps)
- Verifier que le pipeline est configure avec le trigger sur les tags `staging-v*` et `release-v*`
- Verifier que le pipeline pointe vers le bon fichier YAML (`azure-pipelines.yml`)
- En fallback, lancer le pipeline manuellement

### L'image Docker ne se build pas dans Azure DevOps

- Verifier que le `Dockerfile` est present dans le repo miroir Azure DevOps
- Verifier que `.dockerignore` n'exclut pas de fichiers necessaires
- Consulter les logs du stage `BuildAndPush` dans le pipeline

### La migration echoue

- Verifier que `DATABASE_URL` est correct dans le Variable Group (staging ou prod)
- Verifier que la base de donnees est accessible depuis Azure (firewall, VNet)
- Consulter les logs de l'ACI ephemere dans le portail Azure

### Le health check echoue

- Verifier que la Container App est en cours d'execution (`az containerapp show`)
- Verifier les logs de la Container App (`az containerapp logs show`)
- Verifier que `CONTAINER_APP_FQDN` est correct dans le Variable Group
- Verifier que l'ingress est configure sur le port 8080

### Problemes de connexion a ACR depuis Azure DevOps

- Verifier que les credentials ACR sont corrects dans le Variable Group
  (`AZURE_REGISTRY_URL`, `AZURE_REGISTRY_USERNAME`, `AZURE_REGISTRY_PASSWORD`)
- Verifier que le registre ACR autorise les connexions depuis Azure DevOps
- Tester la connexion manuellement : `docker login <registry>.azurecr.io`

### Mauvais environnement deploye

- Verifier le prefixe du tag Git (`staging-v` vs `release-v`)
- Verifier que le tag a ete correctement detecte dans le stage `DetectEnvironment`
- En run manuel, verifier le parametre `environment` dans Azure DevOps
