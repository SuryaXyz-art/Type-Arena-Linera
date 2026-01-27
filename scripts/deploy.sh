#!/bin/bash
# Type Arena - Conway Testnet Deployment Script

set -e

echo "🎮 Type Arena - Linera Deployment"
echo "=================================="

# Configuration
TESTNET_URL="https://testnet-conway.linera.net"
CONTRACT_DIR="contracts/type_arena"

echo ""
echo "📦 Building contracts..."
cd $CONTRACT_DIR
cargo build --target wasm32-unknown-unknown --release
cd ../..

echo ""
echo "🚀 Deploying to Conway Testnet..."

# Get the WASM files
CONTRACT_WASM="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/type_arena_contract.wasm"
SERVICE_WASM="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/type_arena_service.wasm"

# Deploy using linera CLI
APP_ID=$(linera publish-and-create \
    --faucet $TESTNET_URL \
    $CONTRACT_WASM \
    $SERVICE_WASM \
    --json-parameters '{}' \
    --json-argument '{}' \
    2>&1 | grep -oP 'Application ID: \K[a-f0-9]+' || echo "")

if [ -z "$APP_ID" ]; then
    echo "❌ Deployment failed. Please check the output above."
    exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Application Details:"
echo "   Application ID: $APP_ID"
echo "   Testnet URL: $TESTNET_URL"
echo ""
echo "🔧 Next steps:"
echo "   1. Update frontend/.env with VITE_TYPE_ARENA_APP_ID=$APP_ID"
echo "   2. Run 'cd frontend && npm run dev' to start the frontend"
echo "   3. Open http://localhost:5173 in your browser"
echo ""

# Update .env file
echo "Updating frontend/.env..."
sed -i "s/VITE_TYPE_ARENA_APP_ID=.*/VITE_TYPE_ARENA_APP_ID=$APP_ID/" frontend/.env 2>/dev/null || \
    echo "VITE_TYPE_ARENA_APP_ID=$APP_ID" >> frontend/.env

echo "🎉 Done! Happy typing!"
