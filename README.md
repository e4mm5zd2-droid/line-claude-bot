# LINE Claude Bot

LINE Messaging API と Claude AI を連携させたチャットボット。Google Maps API と Tavily Search API によるツール連携で、道案内やWeb検索にも対応。

## 機能

- **AI対話**: Claude による自然な日本語会話
- **道案内**: Google Maps Directions API による正確なルート案内
- **場所検索**: Google Maps Places API による周辺施設検索
- **住所解析**: Google Maps Geocoding API による地名・住所の位置特定
- **Web検索**: Tavily Search API による最新ニュース・情報検索
- **自律ツール選択**: Claude の Tool Use 機能により、質問内容に応じてAIが自動でツールを使い分け

## 必要なもの

- LINE Developers アカウント
- Anthropic API キー
- Google Cloud Platform アカウント（Maps API キー）
- Tavily アカウント（Search API キー）
- Render アカウント（デプロイ用）

---

## セットアップ手順

### 1. LINE Developers での設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. チャネルを作成（Messaging API）
3. 以下の情報を取得：
   - **Channel Access Token**（長いトークン文字列）
   - **Channel Secret**

### 2. Anthropic API キーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Key を作成（`sk-ant-` で始まるキー）

### 3. Google Maps API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新規プロジェクトを作成
3. 請求先アカウントを設定（$300 無料トライアル + 月 $200 無料枠）
4. 「API とサービス」→「ライブラリ」から以下を有効化：
   - **Directions API**
   - **Geocoding API**
   - **Places API**
5. 「認証情報」→「API キー」を作成

### 4. Tavily API キーの取得

1. [app.tavily.com](https://app.tavily.com) にアクセス
2. アカウント作成（クレジットカード不要）
3. ダッシュボードから API キーをコピー（`tvly-` で始まるキー）
4. 無料枠: 月 1,000 リクエスト

### 5. Render でのデプロイ

#### 5-1. GitHub リポジトリを作成・プッシュ

```bash
cd line-claude-bot
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/line-claude-bot.git
git push -u origin main
```

#### 5-2. Render で新規サービス作成

1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. 「New +」→「Web Service」を選択
3. GitHub リポジトリを接続
4. 以下の設定：
   - **Name**: `line-claude-bot`
   - **Environment**: `Docker`
   - **Plan**: `Free`
   - **Health Check Path**: `/health`

#### 5-3. 環境変数の設定

Render の「Environment」タブで以下を追加：

| 変数名 | 値 |
|--------|-----|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE のチャネルアクセストークン |
| `LINE_CHANNEL_SECRET` | LINE のチャネルシークレット |
| `ANTHROPIC_API_KEY` | Anthropic の API キー |
| `GOOGLE_MAPS_API_KEY` | Google Maps の API キー |
| `TAVILY_API_KEY` | Tavily の API キー |

#### 5-4. デプロイ

「Manual Deploy」→「Deploy latest commit」をクリック

### 6. LINE Developers で Webhook URL を設定

1. Render のサービス URL をコピー（例: `https://line-claude-bot-xxxx.onrender.com`）
2. LINE Developers Console →「Messaging API 設定」
3. **Webhook URL**: `https://your-app.onrender.com/webhook`
4. **Webhook の利用**: 有効化
5. **応答メッセージ**: 無効化
6. 「検証」ボタンで接続テスト

---

## 動作確認

### ヘルスチェック

```bash
curl https://your-app.onrender.com/health
```

レスポンス例：
```json
{
  "status": "ok",
  "tools": { "google_maps": true, "tavily": true }
}
```

### 使用例

LINE で以下のようなメッセージを送信してみてください：

- **一般会話**: 「こんにちは」「Pythonのリスト内包表記を教えて」
- **道案内**: 「大阪駅から鶴野町への行き方を教えて」
- **場所検索**: 「渋谷駅近くのおすすめカフェ」
- **Web検索**: 「今日の日本のニュース」「2026年のAIトレンド」

---

## ディレクトリ構造

```
line-claude-bot/
├── index.js        # メインアプリケーション（ツール連携含む）
├── package.json    # 依存パッケージ
├── Dockerfile      # Docker コンテナ設定
├── render.yaml     # Render 設定
├── .gitignore      # Git 除外設定
└── README.md       # このファイル
```

---

## コスト目安

- **Render**: 無料プラン（月 750 時間）
- **LINE**: 無料（Messaging API）
- **Anthropic API**: Claude Sonnet 4.5 - 入力 $3/MTok、出力 $15/MTok
- **Google Maps**: 月 $200 無料枠（Directions: $0.005-0.01/リクエスト）
- **Tavily**: 月 1,000 リクエスト無料

---

## 参考リンク

- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Anthropic API - Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [Google Maps Platform](https://developers.google.com/maps)
- [Tavily Search API](https://docs.tavily.com/)
- [Render Documentation](https://render.com/docs)
