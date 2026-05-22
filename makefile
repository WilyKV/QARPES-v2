# Makefile pour gestion du projet ROVER avec Docker
# Dockerfile unifié multi-stage (dev/prod)

# ============================================================================
# Commandes de développement
# ============================================================================

# Démarre tous les services (mode dev) et lance automatiquement le serveur
up:
	docker compose up -d --build

# Rebuild app + redémarre le container (l'entrypoint gère migrations/seed/dev server)
reload-app:
	docker compose up -d --build app

# Lance le serveur de dev manuellement dans le container existant (si besoin de restart)
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
	docker build -t rover:latest .
	@echo "Image de production créée : rover:latest"

# Test l'image de production en local
test-prod:
	docker run --rm -p 8080:8080 --env-file .env rover:latest

# ============================================================================
# Nettoyage
# ============================================================================

# Supprime les images de production et le dossier dist
clean:
	-docker rmi rover:latest
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
	docker images | grep rover || echo "Aucune image rover trouvée"

# Affiche les logs de tous les services
logs:
	docker compose logs -f

# Affiche les logs de l'app (serveur de dev)
logs-app:
	docker compose logs -f app

.PHONY: up reload-app run-dev run-seed down sh check studio build test-prod clean clean-all status logs logs-app
