# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install client dependencies and build
COPY client/package*.json ./client/
RUN cd client && npm ci

COPY client/ ./client/
RUN cd client && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --production

# Copy server code
COPY server/ ./server/

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Copy audio files
COPY public/audio/ ./public/audio/

# Copy loto data
COPY data/ ./data/

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server/server.js"]
