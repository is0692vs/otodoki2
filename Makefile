.PHONY: up logs logs-web down health test-itunes test-worker clean

up:
	docker-compose up --build
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

# スクリプト実行コマンド
test-itunes:
	cd backend && python ../scripts/itunes_test.py

test-itunes-params:
	cd backend && python ../scripts/itunes_param_test.py

test-worker:
	cd backend && python ../scripts/test_queue_worker.py

# クリーンアップ
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
