.PHONY: up logs logs-web down health

up:
	docker-compose up --build -d
	@echo "\nBackend server started at http://localhost:8000\n"
	@echo "Frontend server started at http://localhost:3000\n"

logs:
	docker-compose logs -f api

logs-web:
	docker-compose logs -f web

down:
	docker-compose down

health:
	curl -fsS http://localhost:8000/health || true
