FROM node:22-slim

# 作業ディレクトリ作成
WORKDIR /app

# package.jsonをコピー
COPY package.json ./

# 依存関係をインストール
RUN npm install --only=production

# アプリケーションコードをコピー
COPY index.js ./

# ポート設定
ENV PORT=10000
EXPOSE 10000

# アプリケーション起動
CMD ["node", "index.js"]
