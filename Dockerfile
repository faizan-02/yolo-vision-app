# Stage 1: Build the Next.js Frontend
FROM node:20-alpine AS builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with FastAPI
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY *.pt ./
COPY --from=builder /app/frontend/out ./frontend/out

ENV PORT=7994
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
EXPOSE 7994

CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]
