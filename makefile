# Makefile pour gestion du projet React avec Docker

# Adapter les chemins Dockerfile
up:
	docker compose up -d --build

reload-app:
	docker compose up -d --build app
	docker compose exec app npx prisma generate
	docker compose exec app npx prisma migrate deploy
	docker compose exec app npx prisma db push
	docker compose exec app npx prisma db seed
	docker compose exec app npm run dev

run-dev:
	docker compose exec app npm run dev

run-seed:
	docker compose exec app npx prisma db seed

down:
	- docker compose down

build: down clean
	docker build -f .docker/Dockerfile-prod -t qarpes-v2 .
	make apk

clean:
	- docker rmi qarpes-v2
	@if exist dist rmdir /s /q dist

apk:
	docker build -f .docker/Dockerfile-apk -t qarpes-v2-apk .
	docker create --name qarpes-v2-apk-tmp qarpes-v2-apk
	- docker cp qarpes-v2-apk-tmp:/app/output/. ./output
	docker rm qarpes-v2-apk-tmp
	@echo "APK(s) genere(s) : output/"

# TypeScript check (no emit)
check:
	docker compose exec app npm run check
