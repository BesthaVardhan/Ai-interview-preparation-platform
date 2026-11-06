# PowerShell script to run all tests properly
Write-Host "=== Running Unit Tests ===" -ForegroundColor Green
npm test

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Unit tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Unit tests failed!" -ForegroundColor Red
}

Write-Host "`n=== Running Integration Tests ===" -ForegroundColor Green
npm run test:integration

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Integration tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Integration tests failed!" -ForegroundColor Red
}

Write-Host "`n=== Running E2E Tests ===" -ForegroundColor Green
npm run test:e2e

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ E2E tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ E2E tests failed!" -ForegroundColor Red
}

Write-Host "`n=== Test Run Complete ===" -ForegroundColor Cyan
