Write-Host "=== FINAL SITE STATUS CHECK ===" -ForegroundColor Cyan

# Update local config with the API key from last run
$apiKey = "XDHeVahcW+tbd28/7VzYUDIwpKEizNBcCz/z4ybITa8="
"API_BASE_URL=https://prompt-hub.site`nAPI_KEY=$apiKey" | Out-File "D:\BulkPromptUploader\.env.local" -Encoding UTF8
Write-Host "✅ API key configured: $($apiKey.Substring(0,12))..." -ForegroundColor Green

# Test site multiple times
for ($test = 1; $test -le 30; $test++) {
    Write-Host "Status check $test/30..." -ForegroundColor Yellow
    Start-Sleep 15
    
    try {
        $response = Invoke-WebRequest "https://prompt-hub.site" -UseBasicParsing -TimeoutSec 30
        Write-Host "🎉 SITE FULLY RESTORED! HTTP Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "🌐 Site URL: https://prompt-hub.site" -ForegroundColor White
        Write-Host "🔧 Bulk uploader ready: D:\BulkPromptUploader" -ForegroundColor White
        Write-Host "🔑 API Key configured for bulk upload" -ForegroundColor White
        break
    } catch {
        Write-Host "❌ Test $test failed: Site still starting..." -ForegroundColor Red
        if ($test -eq 30) {
            Write-Host "⚠️ Final attempt - testing direct server..." -ForegroundColor Yellow
            try {
                $direct = Invoke-WebRequest "http://83.166.244.71:3000" -UseBasicParsing -TimeoutSec 20
                Write-Host "✅ Direct server access works: $($direct.StatusCode)" -ForegroundColor Green
                Write-Host "❌ Issue may be with domain/nginx configuration" -ForegroundColor Red
            } catch {
                Write-Host "❌ No response from server on port 3000" -ForegroundColor Red
            }
        }
    }
}
