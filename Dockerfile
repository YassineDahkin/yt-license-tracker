FROM node:20-slim

# Install ffmpeg + yt-dlp via pip
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
