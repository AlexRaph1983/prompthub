param(
  [string]$Server = '83.166.244.71',
  [string]$User = 'root',
  [string]$Branch = 'main',
  [int]$Port = 3000
)

Write-Host 'Starting deployment' -ForegroundColor Green

$remotePayload = 'c2V0IC1ldW8gcGlwZWZhaWwKY2Qgfi9wcm9tcHRodWIKaWYgWyAhIC1kIC5naXQgXTsgdGhlbgogIGVjaG8gIlJlcG9zaXRvcnkgbm90IGZvdW5kIGluIH4vcHJvbXB0aHViIiA+JjIKICBleGl0IDEKZmkKZ2l0IGZldGNoIC0tYWxsIC0tcHJ1bmUKQlJBTkNIPSR7QlJBTkNIOi1tYWlufQpnaXQgcmVzZXQgLS1oYXJkICJvcmlnaW4vJHtCUkFOQ0h9IgpjaG1vZCAreCBzY3JpcHRzL2RlcGxveS5zaCB8fCB0cnVlCkFQUF9ESVI9fi9wcm9tcHRodWIgQVBQX05BTUU9cHJvbXB0aHViIFBPUlQ9JHtQT1JUOi0zMDAwfSBiYXNoIC4vc2NyaXB0cy9kZXBsb3kuc2g='
$remoteCommand = "BRANCH=$Branch PORT=$Port bash -lc 'echo $remotePayload | base64 -d | bash'"
$sshArgs = @('-o', 'StrictHostKeyChecking=no', "$User@$Server", $remoteCommand)

try {
  Write-Host "Connecting to $User@$Server..." -ForegroundColor Yellow
  $result = & ssh @sshArgs
  Write-Host 'Remote deployment output:' -ForegroundColor Green
  Write-Host $result
  Write-Host 'Deployment finished successfully.' -ForegroundColor Green
} catch {
  Write-Host "Deployment failed: $(.Exception.Message)" -ForegroundColor Red
  exit 1
}

