# otodoki2 アーキテクチャ

このドキュメントでは、otodoki2 のシステムアーキテクチャを説明します。

## システム全体構成

```mermaid
graph TB
    subgraph "クライアント層"
        WEB[Web フロントエンド<br/>Next.js]
        MOBILE[モバイルアプリ<br/>React Native + Expo]
    end
    
    subgraph "アプリケーション層"
        API[バックエンド API<br/>FastAPI]
        WORKER[補充ワーカー<br/>Background Worker]
    end
    
    subgraph "データ層"
        DB[(PostgreSQL<br/>Database)]
        CACHE[キャッシュ<br/>Track Cache]
    end
    
    subgraph "外部サービス"
        ITUNES[iTunes API]
        GEMINI[Gemini API]
    end
    
    WEB --> API
    MOBILE --> API
    API --> DB
    WORKER --> DB
    WORKER --> CACHE
    WORKER --> ITUNES
    WORKER --> GEMINI
    API --> CACHE
    
    style WEB fill:#4FC3F7
    style MOBILE fill:#4FC3F7
    style API fill:#66BB6A
    style WORKER fill:#FFA726
    style DB fill:#EF5350
    style CACHE fill:#EF5350
    style ITUNES fill:#BDBDBD
    style GEMINI fill:#BDBDBD
```

## コンポーネント詳細

### クライアント層

#### Web フロントエンド (Next.js)

- **技術スタック**: Next.js 14 (App Router), React, TypeScript
- **主要機能**:
  - ユーザー認証 (JWT)
  - スワイプ UI による楽曲評価
  - 楽曲ライブラリ管理
  - オーディオプレビュー再生

#### モバイルアプリ (React Native + Expo)

- **技術スタック**: React Native, Expo, TypeScript
- **主要機能**:
  - Web 版と同様の機能をモバイルで提供
  - ネイティブジェスチャーサポート
  - オフライン対応 (AsyncStorage)

### アプリケーション層

#### バックエンド API (FastAPI)

```mermaid
graph LR
    subgraph "API エンドポイント"
        AUTH[/auth/*<br/>認証]
        TRACKS[/tracks/*<br/>楽曲]
        EVAL[/evaluations/*<br/>評価]
        HIST[/history/*<br/>履歴]
    end
    
    subgraph "ビジネスロジック"
        SCHED[Scheduler<br/>Service]
        QUEUE[Queue<br/>Service]
        SEARCH[Search<br/>Service]
    end
    
    AUTH --> SCHED
    TRACKS --> QUEUE
    TRACKS --> SEARCH
    EVAL --> QUEUE
    HIST --> QUEUE
```

**主要エンドポイント**:
- `POST /api/v1/auth/register` - ユーザー登録
- `POST /api/v1/auth/login` - ログイン
- `GET /api/v1/tracks/suggestions` - 楽曲推薦
- `POST /api/v1/evaluations` - 評価登録
- `POST /api/v1/history/played` - 再生履歴記録

#### 補充ワーカー (Background Worker)

```mermaid
sequenceDiagram
    participant Worker
    participant Scheduler
    participant Search
    participant iTunes API
    participant Database
    
    Worker->>Scheduler: キュー状態確認
    Scheduler-->>Worker: 補充が必要
    Worker->>Search: 検索戦略選択
    Search->>iTunes API: 楽曲検索リクエスト
    iTunes API-->>Search: 楽曲データ
    Search->>Database: キャッシュに保存
    Database-->>Worker: 保存完了
```

**機能**:
- iTunes API からの自動楽曲取得
- PostgreSQL へのキャッシュ
- 検索戦略の動的選択 (Genre-Based, Keyword-Based)
- Gemini API によるキーワード生成

### データ層

#### PostgreSQL Database

**主要テーブル**:

```mermaid
erDiagram
    USER ||--o{ EVALUATION : creates
    USER ||--o{ PLAY_HISTORY : has
    TRACK ||--o{ EVALUATION : evaluated_by
    TRACK ||--o{ PLAY_HISTORY : played_in
    
    USER {
        int id PK
        string email UK
        string hashed_password
        datetime created_at
    }
    
    TRACK {
        int id PK
        string external_id UK
        string title
        string artist
        string album
        string preview_url
    }
    
    EVALUATION {
        int id PK
        int user_id FK
        int track_id FK
        bool is_liked
        datetime created_at
    }
    
    PLAY_HISTORY {
        int id PK
        int user_id FK
        int track_id FK
        datetime played_at
    }
```

#### キャッシュ

- トラックデータを PostgreSQL にキャッシュ
- 重複検索を防止し、API コールを削減
- `external_id` でユニーク管理

### 外部サービス

#### iTunes API

- 楽曲メタデータの取得
- プレビュー URL の提供
- 検索クエリ: ジャンル、キーワード、アーティスト

#### Gemini API

- AI によるキーワード生成
- 検索クエリの多様化
- オプショナル (開発環境ではダミー値可)

## データフロー

### 楽曲推薦フロー

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Queue
    participant Worker
    participant iTunes
    
    User->>Frontend: スワイプ画面アクセス
    Frontend->>API: GET /api/v1/tracks/suggestions
    API->>Queue: キューから楽曲取得
    
    alt キューが十分
        Queue-->>API: 楽曲データ
        API-->>Frontend: 楽曲リスト
    else キューが不足
        Queue-->>API: 不足を通知
        API->>Worker: 補充リクエスト
        Worker->>iTunes: 楽曲検索
        iTunes-->>Worker: 新規楽曲
        Worker->>Queue: キューに追加
        Queue-->>API: 補充後の楽曲データ
        API-->>Frontend: 楽曲リスト
    end
    
    Frontend-->>User: 楽曲カード表示
```

### 評価登録フロー

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: 楽曲をスワイプ
    Frontend->>API: POST /api/v1/evaluations
    Note right of API: {<br/>  track_id: 123,<br/>  is_liked: true<br/>}
    API->>Database: 評価を保存
    Database-->>API: 保存完了
    API-->>Frontend: 成功レスポンス
    Frontend-->>User: 次の楽曲を表示
```

### 認証フロー

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    
    User->>Frontend: メール・パスワード入力
    Frontend->>API: POST /api/v1/auth/login
    API->>Database: ユーザー検証
    Database-->>API: ユーザー情報
    API->>API: JWT トークン生成
    API-->>Frontend: アクセストークン<br/>リフレッシュトークン
    Frontend->>Frontend: localStorage に保存
    Frontend-->>User: ログイン成功
    
    Note over Frontend,API: 以降のリクエストは<br/>Authorization ヘッダーで認証
```

## デプロイメント構成

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Web Tier"
            WEB1[Next.js Instance 1]
            WEB2[Next.js Instance 2]
        end
        
        subgraph "API Tier"
            API1[FastAPI Instance 1]
            API2[FastAPI Instance 2]
        end
        
        subgraph "Worker Tier"
            WORKER[Background Worker]
        end
        
        subgraph "Data Tier"
            DB_PRIMARY[(PostgreSQL Primary)]
            DB_REPLICA[(PostgreSQL Replica)]
        end
    end
    
    LB --> WEB1
    LB --> WEB2
    WEB1 --> API1
    WEB1 --> API2
    WEB2 --> API1
    WEB2 --> API2
    API1 --> DB_PRIMARY
    API2 --> DB_PRIMARY
    API1 --> DB_REPLICA
    API2 --> DB_REPLICA
    WORKER --> DB_PRIMARY
    DB_PRIMARY -.Replication.-> DB_REPLICA
```

## スケーラビリティ

### 水平スケーリング

- **Web/API**: Docker コンテナで複数インスタンスを起動可能
- **Worker**: 複数ワーカーで並行処理
- **Database**: PostgreSQL レプリケーションでリードスケール

### 垂直スケーリング

- コンテナのリソース制限調整
- データベースのスペック向上

## セキュリティ

```mermaid
graph LR
    subgraph "セキュリティ層"
        JWT[JWT 認証]
        HASH[パスワードハッシュ<br/>bcrypt]
        ENV[環境変数<br/>シークレット管理]
    end
    
    subgraph "保護されたリソース"
        EVAL[評価 API]
        LIB[ライブラリ API]
        HIST[履歴 API]
    end
    
    JWT --> EVAL
    JWT --> LIB
    JWT --> HIST
```

**セキュリティ対策**:
- JWT によるステートレス認証
- bcrypt によるパスワードハッシュ
- 環境変数でのシークレット管理
- CORS 設定による API アクセス制御

## パフォーマンス最適化

1. **キャッシュ戦略**:
   - トラックデータの PostgreSQL キャッシュ
   - 重複検索の削減

2. **非同期処理**:
   - FastAPI の非同期エンドポイント
   - SQLModel による非同期 DB アクセス

3. **バックグラウンドワーカー**:
   - ユーザーリクエストをブロックしない楽曲補充
   - スケジューラーによる効率的な補充タイミング

## 監視とロギング

```mermaid
graph LR
    API[API Server] --> LOGS[Application Logs]
    WORKER[Worker] --> LOGS
    LOGS --> STDOUT[Docker Logs]
    
    API --> HEALTH[Health Check<br/>/health]
```

**ログ確認**:
```bash
# API ログ
docker compose logs -f api

# ワーカーログ
docker compose logs -f worker

# すべてのログ
docker compose logs --tail=200
```

## 関連ドキュメント

- [WORKER_README.md](./WORKER_README.md) - バックグラウンドワーカーの詳細
- [DEPLOYMENT.md](./DEPLOYMENT.md) - デプロイメント手順
- [VISUAL_GUIDE.md](./VISUAL_GUIDE.md) - ビジュアルガイド
- [メイン README](../README.md) - プロジェクト概要

## 今後の改善点

- [ ] Redis によるセッションキャッシュ
- [ ] Elasticsearch による高度な楽曲検索
- [ ] WebSocket によるリアルタイム通知
- [ ] CDN による静的コンテンツ配信
- [ ] レート制限の実装
