FROM node:22-slim

# 作業ディレクトリ作成
WORKDIR /app

# OpenClawをグローバルインストール
RUN npm install -g openclaw@latest

# Renderの環境変数PORTを使用するように変更
# Renderはランダムなポートを割り当てるため、環境変数から取得する必要があります
ENV PORT=18789

# ヘルスチェック用のエンドポイント
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 起動コマンド
# $PORT を使ってRenderが指定したポートを使用
CMD openclaw gateway \
    --host 0.0.0.0 \
    --port ${PORT} \
    --config /etc/secrets/openclaw.json
