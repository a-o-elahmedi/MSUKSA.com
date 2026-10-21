# Builds, checks and uploads dist/ to the Oracle server, then swaps it into /var/www/msuksa.com.
# Usage (PowerShell, from the project root): .\scripts\deploy.ps1
$ErrorActionPreference = 'Stop'
$server = 'ubuntu@84.13.154.40'
$key = "$HOME\.ssh\oracle-msu"
$env:PATH = "$PSScriptRoot\..\.tools\node-v24.21.0-win-x64;$env:PATH"

node scripts/build.mjs; if ($LASTEXITCODE) { throw 'Build failed' }
node scripts/check.mjs; if ($LASTEXITCODE) { throw 'Checks failed' }

$archive = Join-Path $env:TEMP 'msuksa-dist.tar.gz'
tar -czf $archive -C dist .
scp -i $key -o BatchMode=yes $archive "${server}:/tmp/msuksa-dist.tar.gz"; if ($LASTEXITCODE) { throw 'Upload failed' }
# Extract into a fresh folder and swap it in, so visitors never see a half-copied site.
$remote = @'
set -e
sudo rm -rf /var/www/msuksa.com.new
sudo mkdir -p /var/www/msuksa.com.new
sudo tar --warning=no-unknown-keyword -xzf /tmp/msuksa-dist.tar.gz -C /var/www/msuksa.com.new
sudo chown -R root:root /var/www/msuksa.com.new
sudo find /var/www/msuksa.com.new -type d -exec chmod 755 {} + && sudo find /var/www/msuksa.com.new -type f -exec chmod 644 {} +
[ -d /var/www/msuksa.com ] && sudo mv /var/www/msuksa.com /var/www/msuksa.com.old
sudo mv /var/www/msuksa.com.new /var/www/msuksa.com
sudo rm -rf /var/www/msuksa.com.old /tmp/msuksa-dist.tar.gz
echo "Deployed $(find /var/www/msuksa.com -name index.html | wc -l) pages"
'@
# Written without BOM or CR characters, which bash would otherwise misread.
$script = Join-Path $env:TEMP 'msuksa-deploy.sh'
[IO.File]::WriteAllText($script, ($remote -replace "`r", '') + "`n", (New-Object System.Text.UTF8Encoding $false))
scp -i $key -o BatchMode=yes $script "${server}:/tmp/msuksa-deploy.sh"; if ($LASTEXITCODE) { throw 'Upload failed' }
ssh -i $key -o BatchMode=yes $server 'bash /tmp/msuksa-deploy.sh; s=$?; rm -f /tmp/msuksa-deploy.sh; exit $s'
if ($LASTEXITCODE) { throw 'Remote deploy failed' }
Remove-Item $archive, $script
