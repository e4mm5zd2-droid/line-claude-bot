# LINE Claude Bot

LINE Messaging APIとClaude APIを連携させたチャットボット

## 必要なもの

- LINE Developers アカウント
- Anthropic API キー
- Render アカウント（デプロイ用）

---

## セットアップ手順

### 1. LINE Developersでの設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. チャネルを作成（Messaging API）
3. 以下の情報を取得：
   - Channel Access Token
   - Channel Secret

### 2. Anthropic API キーの取得

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. API Keyを作成

### 3. Renderでのデプロイ

#### 3-1. GitHubリポジトリを作成

```bash
cd line-claude-bot
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/line-claude-bot.git
git push -u origin main
```

#### 3-2. Renderで新規サービス作成

1. [Render Dashboard](https://dashboard.render.com/) にアクセス
2. 「New +」→「Web Service」を選択
3. GitHubリポジトリを接続
4. 以下の設定：
   - **Name**: `line-claude-bot`
   - **Environment**: `Docker`
   - **Plan**: `Free`
   - **Health Check Path**: `/health`

#### 3-3. Secret Fileの設定

Renderの「Environment」タブで：

1. 「Secret Files」をクリック
2. 「Add Secret File」をクリック
3. 以下を設定：
   - **Filename**: `/etc/secrets/openclaw.json`
   - **Contents**: `openclaw.json.template` の内容をコピーし、実際のトークンに置き換え

```json
{
  "anthropic": {
    "apiKey": "sk-ant-YOUR_ACTUAL_KEY_HERE"
  },
  "line": {
    "channelAccessToken": "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
    "channelSecret": "YOUR_LINE_CHANNEL_SECRET"
  },
  "webhook": {
    "path": "/webhook",
    "verifySignature": true
  },
  "bot": {
    "name": "Claude Bot",
    "model": "claude-3-5-sonnet-20241022",
    "maxTokens": 4096,
    "temperature": 1.0,
    "systemPrompt": "あなたは親切で丁寧なアシスタントです。日本語で応答してください。"
  },
  "logging": {
    "level": "info"
  }
}
```

4. 「Save Changes」をクリック

#### 3-4. デプロイ

「Manual Deploy」→「Deploy latest commit」をクリック

### 4. LINE DevelopersでWebhook URLを設定

デプロイ完了後：

1. RenderのサービスURLをコピー（例: `https://line-claude-bot-xxxx.onrender.com`）
2. LINE Developers Consoleに戻る
3. 「Messaging API設定」タブ
4. **Webhook URL**: `https://your-app.onrender.com/webhook`
5. **Webhookの利用**: 有効化
6. **応答メッセージ**: 無効化
7. 「検証」ボタンをクリックして接続テスト

---

## 動作確認

### 1. ヘルスチェック

```bash
curl https://your-app.onrender.com/health
```

成功した場合、HTTPステータス200が返されます。

### 2. LINEで友だち追加

LINE Developers Consoleの「Messaging API設定」からQRコードを取得し、友だち追加します。

### 3. メッセージ送信

LINEでメッセージを送信すると、Claudeが応答します。

---

## カスタマイズ

### システムプロンプトの変更

`openclaw.json` の `systemPrompt` を編集：

```json
{
  "bot": {
    "systemPrompt": "あなたはAI専門家です。技術的な質問に詳しく答えてください。"
  }
}
```

### モデルの変更

```json
{
  "bot": {
    "model": "claude-3-opus-20240229"  // より高性能なモデル
  }
}
```

---

## トラブルシューティング

### Webhook検証エラー

LINE側で「Webhookの検証」が失敗する場合：

1. Renderのログを確認
2. Secret Fileが正しく設定されているか確認
3. 一時的に `verifySignature: false` に設定してテスト

### 応答がない

1. Renderのログで以下を確認：
   ```
   [INFO] Received message from LINE
   [INFO] Sending to Claude API
   [INFO] Received response from Claude
   ```

2. Anthropic APIキーが有効か確認

3. LINE側で「応答メッセージ」が無効化されているか確認

### タイムアウトエラー

Renderの無料プランでは15秒の制限があります。長い応答の場合：

```json
{
  "bot": {
    "maxTokens": 2048  // トークン数を減らす
  }
}
```

---

## ディレクトリ構造

```
line-claude-bot/
├── Dockerfile              # Dockerコンテナ設定
├── render.yaml             # Render設定
├── openclaw.json.template  # 設定ファイルテンプレート
└── README.md               # このファイル
```

---

## コスト

- **Render**: 無料プラン（月750時間）
- **LINE**: 無料（Messaging API）
- **Anthropic API**: 使用量に応じて課金
  - Claude 3.5 Sonnet: 入力 $3/MTok、出力 $15/MTok

---

## 参考リンク

- [OpenClaw Documentation](https://github.com/anthropics/openclaw)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Anthropic API](https://docs.anthropic.com/)
- [Render Documentation](https://render.com/docs)
