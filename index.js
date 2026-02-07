const express = require('express');
const line = require('@line/bot-sdk');
const Anthropic = require('@anthropic-ai/sdk').default;
const { Client: GoogleMapsClient } = require('@googlemaps/google-maps-services-js');
const { tavily } = require('@tavily/core');

// ============================================================
// 環境変数から設定を読み込み
// ============================================================
const PORT = process.env.PORT || 10000;
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// ============================================================
// SDK初期化
// ============================================================

// LINE SDK設定
const lineConfig = {
  channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: LINE_CHANNEL_SECRET,
};

const lineClient = new line.messagingApi.MessagingApiClient({
  channelAccessToken: LINE_CHANNEL_ACCESS_TOKEN,
});

// Anthropic SDK設定
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Google Maps SDK設定
const googleMaps = new GoogleMapsClient({});

// Tavily SDK設定
const tavilyClient = TAVILY_API_KEY ? tavily({ apiKey: TAVILY_API_KEY }) : null;

// ============================================================
// Claude Tool Use: ツール定義
// ============================================================
const tools = [
  {
    name: 'search_places',
    description: '場所や店舗を検索します。「梅田近くのカフェ」「東京タワー周辺のレストラン」など、特定エリアの場所を探すときに使います。',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '検索クエリ（例: "梅田 カフェ"、"東京タワー レストラン"）',
        },
        language: {
          type: 'string',
          description: '結果の言語コード（デフォルト: "ja"）',
          default: 'ja',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_directions',
    description: '2地点間のルート案内（距離・所要時間・経路手順）を取得します。道順を聞かれたときに使います。',
    input_schema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: '出発地（例: "大阪駅"、"東京都渋谷区"）',
        },
        destination: {
          type: 'string',
          description: '目的地（例: "鶴野町1-3"、"東京タワー"）',
        },
        mode: {
          type: 'string',
          enum: ['driving', 'walking', 'bicycling', 'transit'],
          description: '移動手段（デフォルト: transit）',
          default: 'transit',
        },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'geocode',
    description: '住所や地名から緯度経度と正式な住所情報を取得します。場所の正確な位置を確認したいときに使います。',
    input_schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: '住所または地名（例: "大阪市北区鶴野町"、"東京スカイツリー"）',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'web_search',
    description: '最新のニュースや情報をWeb検索します。リアルタイムの情報、最新ニュース、現在の状況など、学習データにない最新情報が必要なときに使います。',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '検索クエリ（例: "2026年 AI最新ニュース"、"大阪 天気 今日"）',
        },
        max_results: {
          type: 'number',
          description: '取得する検索結果の最大数（デフォルト: 5）',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
];

// ============================================================
// ツール実行関数
// ============================================================

/**
 * Google Maps Places API: テキスト検索
 */
async function searchPlaces({ query, language = 'ja' }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API キーが設定されていません' };
  }

  try {
    const response = await googleMaps.textSearch({
      params: {
        query,
        language,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const results = response.data.results.slice(0, 5).map((place) => ({
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || 'N/A',
      user_ratings_total: place.user_ratings_total || 0,
      open_now: place.opening_hours?.open_now ?? '不明',
      location: place.geometry?.location,
      maps_url: place.place_id
        ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.formatted_address)}`,
    }));

    return {
      places: results,
      total_found: response.data.results.length,
      search_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    };
  } catch (error) {
    console.error('Places API error:', error.message);
    return { error: `場所検索に失敗しました: ${error.message}` };
  }
}

/**
 * Google Maps Directions API: ルート案内
 */
async function getDirections({ origin, destination, mode = 'transit' }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API キーが設定されていません' };
  }

  try {
    const response = await googleMaps.directions({
      params: {
        origin,
        destination,
        mode,
        language: 'ja',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.routes.length === 0) {
      return { error: 'ルートが見つかりませんでした' };
    }

    const route = response.data.routes[0];
    const leg = route.legs[0];

    const steps = leg.steps.map((step) => ({
      instruction: step.html_instructions?.replace(/<[^>]*>/g, '') || '',
      distance: step.distance?.text || '',
      duration: step.duration?.text || '',
      travel_mode: step.travel_mode,
      transit_details: step.transit_details
        ? {
            line: step.transit_details.line?.short_name || step.transit_details.line?.name,
            departure_stop: step.transit_details.departure_stop?.name,
            arrival_stop: step.transit_details.arrival_stop?.name,
            num_stops: step.transit_details.num_stops,
          }
        : undefined,
    }));

    // Google Maps URLを生成（タップでアプリが開く）
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;

    return {
      origin: leg.start_address,
      destination: leg.end_address,
      distance: leg.distance?.text,
      duration: leg.duration?.text,
      steps,
      summary: route.summary,
      maps_url: mapsUrl,
    };
  } catch (error) {
    console.error('Directions API error:', error.message);
    return { error: `ルート検索に失敗しました: ${error.message}` };
  }
}

/**
 * Google Maps Geocoding API: 住所→座標変換
 */
async function geocode({ address }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return { error: 'Google Maps API キーが設定されていません' };
  }

  try {
    const response = await googleMaps.geocode({
      params: {
        address,
        language: 'ja',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.results.length === 0) {
      return { error: '住所が見つかりませんでした' };
    }

    const results = response.data.results.slice(0, 3).map((result) => ({
      formatted_address: result.formatted_address,
      location: result.geometry.location,
      place_id: result.place_id,
      types: result.types,
      maps_url: `https://www.google.com/maps/search/?api=1&query=${result.geometry.location.lat},${result.geometry.location.lng}`,
    }));

    return { results };
  } catch (error) {
    console.error('Geocoding API error:', error.message);
    return { error: `ジオコーディングに失敗しました: ${error.message}` };
  }
}

/**
 * Tavily Search API: Web検索
 */
async function webSearch({ query, max_results = 5 }) {
  if (!tavilyClient) {
    return { error: 'Tavily API キーが設定されていません' };
  }

  try {
    const response = await tavilyClient.search(query, {
      maxResults: max_results,
      searchDepth: 'basic',
      includeAnswer: true,
    });

    const results = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content?.substring(0, 300),
    }));

    return {
      answer: response.answer || null,
      results,
    };
  } catch (error) {
    console.error('Tavily API error:', error.message);
    return { error: `Web検索に失敗しました: ${error.message}` };
  }
}

// ツール名→実行関数のマッピング
const toolHandlers = {
  search_places: searchPlaces,
  get_directions: getDirections,
  geocode: geocode,
  web_search: webSearch,
};

// ============================================================
// システムプロンプト
// ============================================================
const SYSTEM_PROMPT = `あなたは親切で丁寧なアシスタントです。日本語で応答してください。

あなたには以下のツールが利用可能です。適切な場面で積極的に活用してください：

【場所・道案内ツール】
- search_places: 場所や店舗の検索（「近くのカフェ」「おすすめのレストラン」など）
- get_directions: 2地点間のルート案内（道順、距離、所要時間）
- geocode: 住所や地名の正確な位置情報の取得

【Web検索ツール】
- web_search: 最新ニュース、天気、時事情報など、リアルタイム情報の検索

ツール使用のガイドライン：
- 道順や場所について聞かれたら、必ず get_directions や search_places を使って正確な情報を提供する
- 最新のニュースや現在の状況について聞かれたら、web_search を使う
- ツールで取得した情報をもとに、わかりやすく自然な日本語で回答する
- ツールのエラーが返ってきた場合は、その旨をユーザーに伝え、代替案を提示する
- 複数のツールを組み合わせて使うことも可能（例: geocodeで場所を特定してからget_directionsでルート案内）

回答時の注意：
- LINE のメッセージなので、簡潔でわかりやすい表現を使う
- 長すぎる回答は避け、重要なポイントに絞る
- 絵文字は控えめに使用可

Google Maps リンクのルール：
- ツール結果に maps_url や search_url が含まれている場合、回答の最後に必ずそのURLを含める
- 「Google Mapsで開く」のような案内文を添えてURLを貼る（ユーザーがタップするとGoogle Mapsアプリが開く）
- URLは省略せず、そのまま貼り付ける`;

// ============================================================
// Expressアプリ
// ============================================================
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
  res.json({
    status: 'ok',
    tools: {
      google_maps: !!GOOGLE_MAPS_API_KEY,
      tavily: !!TAVILY_API_KEY,
    },
  });
});

// ============================================================
// イベントハンドラー（Tool Useループ対応）
// ============================================================
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userMessage = event.message.text;
  console.log('Received message:', userMessage);

  try {
    // Claude APIにツール定義付きで送信
    const messages = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    console.log('Claude initial response stop_reason:', response.stop_reason);

    // Tool Useループ: Claudeがツールを呼ぶ限り繰り返す（最大5回）
    let loopCount = 0;
    const MAX_TOOL_LOOPS = 5;

    while (response.stop_reason === 'tool_use' && loopCount < MAX_TOOL_LOOPS) {
      loopCount++;
      console.log(`Tool use loop #${loopCount}`);

      // Claudeのレスポンスをメッセージ履歴に追加
      messages.push({
        role: 'assistant',
        content: response.content,
      });

      // ツール呼び出しを実行
      const toolResults = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          console.log(`Calling tool: ${block.name}`, JSON.stringify(block.input));

          const handler = toolHandlers[block.name];
          let result;

          if (handler) {
            try {
              result = await handler(block.input);
            } catch (err) {
              console.error(`Tool ${block.name} error:`, err.message);
              result = { error: `ツール実行エラー: ${err.message}` };
            }
          } else {
            result = { error: `不明なツール: ${block.name}` };
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }

      // ツール結果をメッセージ履歴に追加
      messages.push({
        role: 'user',
        content: toolResults,
      });

      // Claudeに再度問い合わせ
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      console.log(`Claude loop #${loopCount} stop_reason:`, response.stop_reason);
    }

    // 最終テキスト応答を抽出
    const textBlocks = response.content.filter((block) => block.type === 'text');
    const replyText = textBlocks.map((block) => block.text).join('\n') || '回答を生成できませんでした。';

    console.log('Final reply length:', replyText.length);

    // LINEメッセージの5000文字制限に対応
    const truncatedReply =
      replyText.length > 4900
        ? replyText.substring(0, 4900) + '\n\n（続きは再度お尋ねください）'
        : replyText;

    // LINEに返信
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: 'text',
          text: truncatedReply,
        },
      ],
    });
  } catch (error) {
    console.error('Error in handleEvent:', error);

    // エラーメッセージを返信
    await lineClient.replyMessage({
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

// ============================================================
// サーバー起動
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- LINE_CHANNEL_ACCESS_TOKEN:', LINE_CHANNEL_ACCESS_TOKEN ? '✓ Set' : '✗ Not set');
  console.log('- LINE_CHANNEL_SECRET:', LINE_CHANNEL_SECRET ? '✓ Set' : '✗ Not set');
  console.log('- ANTHROPIC_API_KEY:', ANTHROPIC_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('- GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('- TAVILY_API_KEY:', TAVILY_API_KEY ? '✓ Set' : '✗ Not set');
  console.log('Available tools:', tools.map((t) => t.name).join(', '));
});
