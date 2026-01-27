# Build stage for Rust contracts
FROM rust:1.82-slim-bookworm AS contract-builder

# Install required dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install wasm32 target
RUN rustup target add wasm32-unknown-unknown

# Set working directory
WORKDIR /app

# Copy contract source
COPY contracts/ ./contracts/

# Build the contracts
WORKDIR /app/contracts/type_arena
RUN cargo build --target wasm32-unknown-unknown --release

# Frontend build stage
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# Runtime stage with Linera CLI
FROM rust:1.82-slim-bookworm AS runtime

# Install required dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    git \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install Linera CLI
RUN cargo install linera-service@0.15.7 --locked || true
RUN cargo install linera-storage-server@0.15.7 --locked || true

# Copy built artifacts
COPY --from=contract-builder /app/contracts/type_arena/target/wasm32-unknown-unknown/release/*.wasm /app/contracts/
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy deployment script
COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.sh

EXPOSE 80 8080

CMD ["nginx", "-g", "daemon off;"]
