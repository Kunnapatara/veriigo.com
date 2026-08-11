#!/usr/bin/env bash
set -e

echo "===================================================="
echo "  VERIIGO V2 - SPRINT 3 ONE-COMMAND VERIFICATION"
echo "===================================================="

echo "[1/4] Checking Node.js and NPM environment..."
node -v
npm -v

echo "[2/4] Verifying dependencies..."
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "[3/4] Running Reproducibility Verification Engine..."
npx tsx verification-kit/verify.ts

echo "[4/4] Verification process completed."
