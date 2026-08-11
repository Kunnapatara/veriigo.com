Write-Host "===================================================="
Write-Host "  VERIIGO V2 - SPRINT 3 ONE-COMMAND VERIFICATION"
Write-Host "===================================================="

Write-Host "[1/4] Checking Node.js and NPM environment..."
node -v
npm -v

Write-Host "[2/4] Verifying dependencies..."
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}

Write-Host "[3/4] Running Reproducibility Verification Engine..."
npx tsx verification-kit/verify.ts

Write-Host "[4/4] Verification process completed."
