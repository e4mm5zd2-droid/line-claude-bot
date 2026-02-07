FROM node:22-slim

# 作業ディレクトリ作成
WORKDIR /app

# システムパッケージの更新
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# OpenClawをグローバルインストール
RUN npm install -g openclaw@latest --verbose

# Renderの環境変数PORTを使用
ENV PORT=10000

# 起動コマンド
CMD ["sh", "-c", "openclaw gateway --host 0.0.0.0 --port ${PORT} --config /etc/secrets/openclaw.json"]
