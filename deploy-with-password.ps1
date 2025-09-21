param(
  [string]$Server = 'REDACTED_IP',
  [string]$User = 'root',
  [string]$Password = 'REDACTED_PASSWORD',
  [string]$Branch = 'main',
  [int]$Port = 3000
)

Write-Host 'Starting deployment to Orange Curium server' -ForegroundColor Green

# Install sshpass if not available (for Linux/WSL)
# For Windows, we'll use plink or expect

$remotePayload = @'
set -euo pipefail
cd /root/prompthub
if [ ! -d .git ]; then
  echo "Repository not found. Cloning..."
  git clone https://github.com/your-username/prompthub.git /root/prompthub
  cd /root/prompthub
fi
git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh
'@

# Encode the payload
$encodedPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remotePayload))

# Create the remote command
$remoteCommand = "BRANCH=$Branch PORT=$Port bash -lc 'echo $encodedPayload | base64 -d | bash'"

Write-Host "Connecting to $User@$Server..." -ForegroundColor Yellow

# Try using plink (PuTTY Link) if available
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "Using plink for connection" -ForegroundColor Cyan
    $plinkArgs = @("-ssh", "-pw", $Password, "$User@$Server", $remoteCommand)
    try {
        $result = & plink @plinkArgs
        Write-Host 'Remote deployment output:' -ForegroundColor Green
        Write-Host $result
        Write-Host 'Deployment finished successfully.' -ForegroundColor Green
    } catch {
        Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "plink not found. Please install PuTTY or use manual SSH connection." -ForegroundColor Yellow
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Connect to server: ssh $User@$Server" -ForegroundColor White
    Write-Host "2. Run: cd /root/prompthub && git fetch origin && git reset --hard origin/main && bash scripts/deploy.sh" -ForegroundColor White
}



