# Makefile pour gestion du projet QARPES-v2 avec Docker
# Dockerfile unifié multi-stage (dev/prod)

# ============================================================================
# Commandes de développement
# ============================================================================

# Démarre tous les services (mode dev)
up:
	docker compose up -d --build

# Rebuild app + réinitialisation database
reload-app:
	docker compose up -d --build app
	docker compose exec app npx prisma generate
	docker compose exec app npx prisma migrate deploy
	docker compose exec app npx prisma db seed
	docker compose exec app npm run dev

# Lance le serveur de dev dans le container existant
run-dev:
	docker compose exec app npm run dev

# Seed la base de données
run-seed:
	docker compose exec app npx prisma db seed

# Arrête tous les services
down:
	docker compose down

# Shell dans le container app
sh:
	docker compose exec app sh

# TypeScript type check (no emit)
check:
	docker compose exec app npm run check

# Lance Prisma Studio
studio:
	docker compose exec app npx prisma studio

# ============================================================================
# Commandes de production
# ============================================================================

# Build l'image de production
build:
	docker build -t qarpes-v2:latest .
	@echo "Image de production créée : qarpes-v2:latest"

# Test l'image de production en local
test-prod:
	docker run --rm -p 8080:8080 --env-file .env qarpes-v2:latest

# ============================================================================
# Nettoyage
# ============================================================================

# Supprime les images de production et le dossier dist
clean:
	-docker rmi qarpes-v2:latest
	@if [ -d dist ]; then rm -rf dist; fi
	@echo "Nettoyage terminé"

# Nettoyage complet (containers + volumes)
clean-all: clean down
	docker compose down -v
	@echo "Nettoyage complet effectué"

# ============================================================================
# Utilitaires
# ============================================================================

# Affiche le statut des containers
status:
	@echo "=== Services Docker Compose ==="
	docker compose ps
	@echo "\n=== Images Docker ==="
	docker images | grep qarpes || echo "Aucune image qarpes trouvée"

# Affiche les logs de tous les services
logs:
	docker compose logs -f

.PHONY: up reload-app run-dev run-seed down sh check studio build test-prod clean clean-all status logs
