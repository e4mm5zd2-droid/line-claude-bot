# line-claude-bot プロジェクト説明

## このプロジェクトについて

LINE Messaging APIとClaude APIを連携させたチャットボットです。LINEでメッセージを送ると、Claude AIが応答します。

## 主な機能

1. **LINE連携**: LINE公式アカウントでメッセージを受信
2. **Claude AI応答**: Anthropicの最新モデル（Claude 3.5 Sonnet）で自然な会話
3. **カスタマイズ可能**: システムプロンプト、モデル、温度などを調整可能
4. **無料デプロイ**: Renderの無料プランで運用可能

## 技術スタック

- **Runtime**: Node.js 22
- **Framework**: OpenClaw（Anthropic製のLINE連携ツール）
- **Hosting**: Render（Docker環境）
- **APIs**: 
  - LINE Messaging API
  - Anthropic Claude API

## セットアップの流れ

1. LINE Developersでチャネル作成
2. Anthropic APIキー取得
3. GitHubにコードをプッシュ
4. Renderでデプロイ
5. Webhook URLをLINEに設定
6. 完成！

## 必要な情報

| 項目 | 取得場所 |
|------|---------|
| LINE Channel Access Token | LINE Developers Console |
| LINE Channel Secret | LINE Developers Console |
| Anthropic API Key | Anthropic Console |

## 使い方

1. LINE公式アカウントを友だち追加
2. メッセージを送信
3. Claude AIが応答

## カスタマイズ例

### ビジネスアシスタント
```json
{
  "systemPrompt": "あなたはビジネスアシスタントです。スケジュール管理、タスク整理、ビジネス文書の作成をサポートします。"
}
```

### 英語学習サポート
```json
{
  "systemPrompt": "あなたは英語学習のサポーターです。英語の質問に答え、文法を訂正し、例文を提供します。"
}
```

### カスタマーサポート
```json
{
  "systemPrompt": "あなたは〇〇社のカスタマーサポート担当です。製品に関する質問に丁寧に答えてください。"
}
```

## 注意事項

- Renderの無料プランは15秒のタイムアウト制限があります
- Anthropic APIは使用量に応じて課金されます
- LINE Messaging APIは月1,000通まで無料です

## トラブル時の確認ポイント

1. Renderのログを確認
2. Secret Fileが正しく設定されているか
3. LINE側で「応答メッセージ」が無効化されているか
4. Webhook URLが正しく設定されているか

## 今後の拡張案

- 会話履歴の保存
- 画像認識機能の追加
- マルチユーザー対応
- データベース連携
- 管理画面の作成

---

作成日: 2026年2月4日
作成者: aiueo.
