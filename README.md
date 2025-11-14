# 売上管理システム (uriage-kannri)

シンプルで使いやすい売上管理システムのWebアプリケーションです。

## 機能

- 📝 売上データの入力・編集・削除
- 📊 データ一覧表示とフィルタリング
- 📦 データのアーカイブ管理
- 📈 売上分析とレポート表示
- 🌙 ダークモード対応
- 💾 ローカルデータ保存（IndexedDB/LocalStorage）

## Docker を使用した開発環境セットアップ

### 前提条件

- Docker
- Docker Compose

### クイックスタート

1. **アプリケーションをビルドして起動**
   ```bash
   make build
   make run
   ```

2. **ブラウザでアクセス**
   ```
   http://localhost:8080
   ```

### 開発用コマンド

```bash
# ヘルプを表示
make help

# 開発モードで起動（ログ表示）
make dev

# アプリケーションを停止
make stop

# ログを確認
make logs

# 完全クリーンアップ
make clean
```

### 手動での Docker コマンド

```bash
# イメージをビルド
docker-compose build

# バックグラウンドで起動
docker-compose up -d

# フォアグラウンドで起動
docker-compose up

# 停止
docker-compose down
```

## 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **データベース**: IndexedDB (フォールバック: LocalStorage)
- **グラフ**: Chart.js
- **コンテナ**: Docker + Nginx

## ファイル構成

```
uriage-kannri/
├── Dockerfile          # Docker設定ファイル
├── docker-compose.yml  # Docker Compose設定
├── Makefile            # 開発用コマンド
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── script.js           # メインJavaScript
├── db.js              # データベース管理
└── README.md          # このファイル
```
