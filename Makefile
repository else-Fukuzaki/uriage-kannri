# 売上管理システム - 開発用Makefile

.PHONY: help build run stop logs clean dev

# デフォルトタスク
help:
	@echo "利用可能なコマンド:"
	@echo "  make build  - Dockerイメージをビルド"
	@echo "  make run    - アプリケーションを起動"
	@echo "  make dev    - 開発モードで起動（ホットリロード有効）"
	@echo "  make stop   - アプリケーションを停止"
	@echo "  make logs   - ログを表示"
	@echo "  make clean  - Docker関連リソースをクリーンアップ"

# Dockerイメージをビルド
build:
	docker-compose build

# アプリケーションを起動
run:
	docker-compose up -d
	@echo "アプリケーションが http://localhost:8080 で起動しました"

# 開発モードで起動（フォアグラウンド、ログ表示）
dev:
	docker-compose up
	@echo "開発モードで起動中... Ctrl+C で停止"

# アプリケーションを停止
stop:
	docker-compose down

# ログを表示
logs:
	docker-compose logs -f

# クリーンアップ
clean:
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f