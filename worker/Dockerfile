# Bacaba transcription worker — yt-dlp + ffmpeg + Node
FROM node:20-slim

# System deps: ffmpeg for audio, plus yt-dlp and youtube-transcript-api via pip.
# (Debian bookworm marks the env "externally managed" per PEP 668, so we pass
# --break-system-packages to install system-wide inside the container.)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip ca-certificates \
  && pip install --no-cache-dir --break-system-packages -U yt-dlp "youtube-transcript-api==0.6.2" \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
