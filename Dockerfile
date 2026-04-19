FROM node:20-slim

# Install ffmpeg + yt-dlp via pip
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost/build" \
    DIRECT_URL="postgresql://build:build@localhost/build" \
    STRIPE_SECRET_KEY="sk_test_build" \
    AUTH_SECRET="build-secret-32-chars-placeholder" \
    npm run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
