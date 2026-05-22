# Guide de deploiement ROVER

## Vue d'ensemble

Le deploiement de ROVER suit un flux automatise en 4 etapes :

```
Git tag (v1.2.3)
    |
    v
GitHub Actions CI/CD (.github/workflows/cd.yml)
    |   - Lint, typecheck, tests
    |   - Build image Docker production
    |   - Push vers Azure Container Registry
    v
Azure Container Registry (ACR)
    |
    v
Azure DevOps Pipeline (azure-pipelines.yml)
    |   - Migration Prisma (ACI ephemere)
    |   - Mise a jour Container App
    |   - Health check post-deploiement
    v
Azure Container Apps (production)
```

---

## Prerequis

### Infrastructure Azure

- **Azure Container Registry (ACR)** : registre Docker pour stocker les images
- **Azure Container Apps** : service de deploiement pour l'application
- **Azure Database for PostgreSQL** : base de donnees de production
- **Azure DevOps** : pipeline de deploiement

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
| `AZURE_REGISTRY_PASSWORD`   | Mot de passe ou PAT Azure DevOps               | `xxxxxxxxxxxxxxxxxxxxxxxx`     |

Ces secrets sont utilises par le workflow `cd.yml` pour pousser l'image Docker vers ACR.

---

## Configuration Azure DevOps

### Variable Group "rover-prod"

Dans Azure DevOps, aller dans **Pipelines > Library** et creer un Variable Group nomme `rover-prod` avec les variables suivantes :

| Variable                    | Type   | Description                                        |
| --------------------------- | ------ | -------------------------------------------------- |
| `DATABASE_URL`             | Secret | URL PostgreSQL de production                       |
| `SESSION_SECRET`           | Secret | Secret de session (min 64 chars, `crypto.randomBytes(64).toString('hex')`) |
| `MICROSOFT_CLIENT_ID`     | Secret | App Registration Azure AD                          |
| `MICROSOFT_TENANT_ID`     | Secret | Tenant Azure AD                                    |
| `MICROSOFT_CLIENT_SECRET` | Secret | Secret Azure AD                                    |
| `ALLOWED_DOMAIN`          | Normal | Domaine autorise (ex: `omneseducation.com`)        |
| `ALLOWED_ORIGINS`         | Normal | Origines CORS (ex: `https://rover.omneseducation.com`) |
| `AZURE_REGISTRY_URL`      | Normal | URL du registre ACR                                |
| `AZURE_REGISTRY_USERNAME` | Normal | Nom d'utilisateur ACR                              |
| `AZURE_REGISTRY_PASSWORD` | Secret | Mot de passe ACR                                   |
| `AZURE_SERVICE_CONNECTION`| Normal | Nom de la connexion de service Azure               |
| `CONTAINER_APP_NAME`      | Normal | Nom de la Container App                            |
| `RESOURCE_GROUP`           | Normal | Nom du Resource Group Azure                        |
| `CONTAINER_APP_FQDN`      | Normal | FQDN de la Container App (ex: `rover.bluedesert-xxxx.westeurope.azurecontainerapps.io`) |

### Connexion de service Azure

1. Aller dans **Project Settings > Service connections**
2. Creer une connexion de type **Azure Resource Manager**
3. Utiliser le mode **Service principal (automatic)** ou **manual** selon les permissions
4. Nommer la connexion et utiliser ce nom dans la variable `AZURE_SERVICE_CONNECTION`

### Environnement de deploiement

1. Aller dans **Pipelines > Environments**
2. Creer un environnement nomme `production`
3. Optionnel : ajouter des approbations manuelles pour securiser le deploiement

---

## Deploiement

### Processus standard

1. **Verifier que la branche `main` est stable** :
   ```bash
   git checkout main
   git pull origin main
   npm run lint
   npm run check
   npm test
   ```

2. **Creer un tag de version** :
   ```bash
   # Versioning semantique : majeur.mineur.patch
   git tag -a v1.2.3 -m "Release 1.2.3 : description des changements"
   git push origin v1.2.3
   ```

3. **Le workflow GitHub CD se declenche automatiquement** :
   - Execute la CI complete (lint, typecheck, tests)
   - Build l'image Docker production
   - Pousse l'image vers ACR avec les tags `rover:1.2.3` et `rover:latest`

4. **Declencher le pipeline Azure DevOps** :
   - Aller dans Azure DevOps > Pipelines
   - Selectionner le pipeline ROVER
   - Cliquer sur **Run pipeline**
   - Renseigner le tag de l'image (ex: `1.2.3`)
   - Le pipeline execute : migration DB, deploiement, health check

### Verifier le deploiement

Apres le deploiement, verifier manuellement :

```bash
# Health check basique
curl -s -o /dev/null -w "%{http_code}" https://<CONTAINER_APP_FQDN>/api/auth/user

# Doit retourner 401 (non authentifie) ou 200 (si cookie valide)
```

---

## Rollback

### Rollback rapide (image precedente)

Si un deploiement pose probleme, revenir a l'image precedente :

1. **Via Azure DevOps** :
   - Relancer le pipeline avec le tag de la version precedente (ex: `1.1.0`)
   - Le pipeline redeploiera l'ancienne image

2. **Via Azure CLI** (urgence) :
   ```bash
   # Remplacer par la version stable precedente
   az containerapp update \
     --name <CONTAINER_APP_NAME> \
     --resource-group <RESOURCE_GROUP> \
     --image <AZURE_REGISTRY_URL>/rover:<VERSION_PRECEDENTE>
   ```

### Rollback de migration

Les rollbacks de migration Prisma ne sont pas automatises. En cas de besoin :

1. Identifier la migration problematique dans `prisma/migrations/`
2. Se connecter a la base de donnees de production
3. Executer manuellement les operations inverses
4. Marquer la migration comme rollbackee dans `_prisma_migrations`

**Important** : Toujours tester les migrations sur un environnement de staging avant la production.

---

## Variables d'environnement de production

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

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Architecture Docker

Le Dockerfile multi-stage produit une image de production minimale :

```
base (node:22-alpine)
  └─ dependencies (npm ci avec toutes les deps)
       ├─ development (pour le dev local avec hot reload)
       └─ builder (compile TypeScript + build Vite)
            └─ production (image finale, deps prod uniquement)
```

L'image de production contient :
- Node.js 22 Alpine
- Dependances de production uniquement (`npm ci --omit=dev`)
- Backend compile (`dist/server/index.js`)
- Frontend build (`dist/public/`)
- Client Prisma genere
- Types partages (`shared/`)

Taille estimee : ~250-350 Mo (selon les dependances).

---

## Depannage

### L'image Docker ne se build pas en CI

- Verifier que le `Dockerfile` est a la racine du projet
- Verifier que `.dockerignore` n'exclut pas de fichiers necessaires
- Consulter les logs du job `docker` dans GitHub Actions

### La migration echoue

- Verifier que `DATABASE_URL` est correct dans le Variable Group
- Verifier que la base de donnees est accessible depuis Azure (firewall, VNet)
- Consulter les logs de l'ACI ephemere dans le portail Azure

### Le health check echoue

- Verifier que la Container App est en cours d'execution (`az containerapp show`)
- Verifier les logs de la Container App (`az containerapp logs show`)
- Verifier que le FQDN est correct dans le Variable Group
- Verifier que l'ingress est configure sur le port 8080

### Problemes de connexion a ACR

- Verifier que les credentials ACR sont corrects dans les secrets GitHub
- Verifier que le registre ACR autorise les connexions depuis GitHub Actions
- Tester la connexion manuellement : `docker login <registry>.azurecr.io`
