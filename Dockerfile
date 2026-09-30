FROM node:22-bookworm-slim

WORKDIR /app

RUN npm install --global npm@11.19.0

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npm run db:generate && npm run db:deploy && npm run start:dev"]