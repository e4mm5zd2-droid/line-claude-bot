const express = require('express');
const line = require('@line/bot-sdk');
const Anthropic = require('@anthropic-ai/sdk').default;

// 環境変数から設定を読み込み
const PORT = process.env.PORT || 10000;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// LINE SDK設定
const lineConfig = {
  channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
});

// Anthropic SDK設定
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Expressアプリ
const app = express();

// Webhook用のエンドポイント
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// イベントハンドラー
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userMessage = event.message.text;
  console.log('Received message:', userMessage);

  try {
    // Claude APIに送信
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: 'あなたは親切で丁寧なアシスタントです。日本語で応答してください。',
    });

    const replyText = message.content[0].text;
    console.log('Claude response:', replyText);

    // LINEに返信
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: replyText,
        },
      ],
    });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    
    // エラーメッセージを返信
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: '申し訳ございません。エラーが発生しました。',
        },
      ],
    });
  }
}

// サーバー起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- LINE_CHANNEL_ACCESS_TOKEN:', LINE_CHANNEL_ACCESS_TOKEN ? '✓ Set' : '✗ Not set');
  console.log('- LINE_CHANNEL_SECRET:', LINE_CHANNEL_SECRET ? '✓ Set' : '✗ Not set');
  console.log('- ANTHROPIC_API_KEY:', ANTHROPIC_API_KEY ? '✓ Set' : '✗ Not set');
});
