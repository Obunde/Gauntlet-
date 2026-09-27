FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci || npm install

COPY . .

# Baked into the client bundle at build time. The browser calls the
# published backend on the host, not the container network.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_USE_MOCKS=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCKS=$NEXT_PUBLIC_USE_MOCKS
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Bind all interfaces. Next otherwise follows the container HOSTNAME and
# never accepts connections forwarded to localhost:3000.
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
