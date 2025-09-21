# PowerShell SSH Deployment using .NET
Add-Type -AssemblyName System.Security

$server = $env:DEPLOY_SERVER_IP
$username = $env:DEPLOY_SSH_USER
$password = $env:DEPLOY_SSH_PASS # optional; prefer key auth

Write-Host "🚀 Starting automated SSH deployment..." -ForegroundColor Green

try {
    # Создаем процесс SSH
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "ssh"
    $psi.Arguments = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $username@$server"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $process = [System.Diagnostics.Process]::Start($psi)
    
    # Отправляем пароль
    Start-Sleep -Seconds 2
    $process.StandardInput.WriteLine($password)
    
    # Отправляем команды деплоя
    $commands = @(
        "cd /root/prompthub",
        "git fetch origin && git reset --hard origin/main",
        "bash scripts/deploy.sh",
        "echo 'Deployment completed!'",
        "exit"
    )
    
    foreach ($cmd in $commands) {
        Write-Host "Executing: $cmd" -ForegroundColor Yellow
        $process.StandardInput.WriteLine($cmd)
        Start-Sleep -Seconds 3
    }
    
    # Читаем вывод
    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    
    $process.WaitForExit()
    
    Write-Host "📤 Output:" -ForegroundColor Cyan
    Write-Host $output -ForegroundColor White
    
    if ($error) {
        Write-Host "⚠️ Errors:" -ForegroundColor Yellow  
        Write-Host $error -ForegroundColor Red
    }
    
    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed with exit code: $($process.ExitCode)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📋 Manual deployment required:" -ForegroundColor Yellow
    Write-Host "ssh $username@$server" -ForegroundColor White
    Write-Host "Password: $password" -ForegroundColor Gray
}

    Write-Host "🌐 Check result at: http://$server" -ForegroundColor Green
