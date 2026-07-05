# 軽くて爆速なNode.jsイメージを使うよ！
FROM node:22-alpine

WORKDIR /app

# 先にパッケージ情報をコピーしてキャッシュを効かせるのが「デキる男」のやり方
COPY package*.json ./
RUN npm install

# 残りのファイルを全部コピー！
COPY . .

# 非ルートユーザーを作成
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# アプリケーションディレクトリの所有権を変更
RUN chown -R nodejs:nodejs /app

# nodejsユーザーに切り替え
USER nodejs

# Viteのデフォルトポートを開けるよ
EXPOSE 5173

# コンテナ起動時にViteを立ち上げる！ホスト指定を忘れずに✨
CMD ["npm", "run", "dev", "--", "--host"]