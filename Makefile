.PHONY: up logs down health

up:
	docker-compose up --build -d

logs:
	docker-compose logs -f api

down:
	docker-compose down

health:
	curl -fsS http://localhost:8000/health || true