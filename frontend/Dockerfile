FROM node:22-alpine

WORKDIR /app

# パッケージ管理ファイルを先にコピーし、レイヤーキャッシュを有効化
COPY package*.json ./
RUN npm install

COPY . .

# セキュリティ対策のため、非ルートユーザー（nodejs）を作成
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# アプリケーションディレクトリの所有権を新ユーザーに変更
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

