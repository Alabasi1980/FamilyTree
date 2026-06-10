<#
deploy-local.ps1

آمن وبسيط: يضغط مجلد `app`, يرفع الأرشيف إلى الخادم، يقوم بمرحلة التحضير على الخادم
(فك، تثبيت، توليد، بناء) بعد تأكيدك، ثم يطلب تأكيدًا منفصلاً لخطوة التبديل (swap + pm2 restart).

تشغيل: من جذر المشروع (d:\Families Tree) في PowerShell:
  .\app\deploy\deploy-local.ps1

ملاحظات أمان: يتطلب وجود `ssh` و`scp` على جهازك ومسار المفتاح الصحيح في `$HOME/.ssh/copilot_bustanalosool`.
#>

Param()

function Confirm([string]$msg) {
    $r = Read-Host "$msg (y/N)"
    return $r -match '^[yY]'
}

$RemoteHost = '142.93.100.200'
$Key = "$HOME/.ssh/copilot_bustanalosool"
$LocalArchive = Join-Path (Get-Location) 'server-sync.tar.gz'
$RemoteArchive = '/root/server-sync.tar.gz'
$RemotePrepare = '/root/deploy-prepare.sh'
$RemoteSwap = '/root/deploy-swap.sh'
$AppFolder = 'app'

Write-Host "Using SSH host: $RemoteHost" -ForegroundColor Cyan

if (-not (Test-Path $Key)) {
    Write-Error "SSH key not found: $Key`nضع الملف أو حدّث متغير المسار في السكربت."; exit 1
}

if (-not (Confirm "إنشاء أرشيف وتغطيته من '$AppFolder' إلى $LocalArchive الآن؟")) { Write-Host 'Aborted by user.'; exit 0 }

if (Test-Path $LocalArchive) { Remove-Item $LocalArchive -Force }

$tarArgs = @('--exclude=app/node_modules','--exclude=app/.next','--exclude=app/.git','--exclude=app/.env','--exclude=app/tsconfig.tsbuildinfo','-czf',$LocalArchive,$AppFolder)
Write-Host "Running: tar.exe $($tarArgs -join ' ')"
& tar.exe @tarArgs

if (-not (Test-Path $LocalArchive)) { Write-Error "Archive was not created."; exit 1 }
Write-Host "Archive created: $LocalArchive" -ForegroundColor Green

if (-not (Confirm "Upload archive to $RemoteHost ?")) { Write-Host 'Upload skipped by user.'; exit 0 }

Write-Host "Uploading archive to root@$($RemoteHost):$RemoteArchive" -ForegroundColor Cyan
& scp -i $Key $LocalArchive "root@$($RemoteHost):$RemoteArchive"
if ($LASTEXITCODE -ne 0) { Write-Error "scp failed (exit $LASTEXITCODE)"; exit $LASTEXITCODE }

# prepare script content (no swap)
$prepareScript = @'
#!/usr/bin/env bash
set -e
rm -rf /var/www/bustanalosool/release
mkdir -p /var/www/bustanalosool/release
tar -xzf /root/server-sync.tar.gz -C /var/www/bustanalosool/release --strip-components=1
if [ -f /var/www/bustanalosool/repo/.env ]; then cp /var/www/bustanalosool/repo/.env /var/www/bustanalosool/release/.env; fi
cd /var/www/bustanalosool/release
if [ -f package-lock.json ]; then npm ci --loglevel=warn; else npm install --loglevel=warn; fi
npx prisma generate
npx prisma migrate deploy
npm run build
echo PREPARE_DONE
'@

$localPrepare = [IO.Path]::GetTempFileName() + '.sh'
$prepareText = $prepareScript -replace "`r`n","`n"
[System.IO.File]::WriteAllText($localPrepare, $prepareText, [System.Text.UTF8Encoding]::new($false))

Write-Host "Copying prepare script to $($RemoteHost):$RemotePrepare" -ForegroundColor Cyan
& scp -i $Key $localPrepare "root@$($RemoteHost):$RemotePrepare"
if ($LASTEXITCODE -ne 0) { Write-Error "scp prepare script failed"; exit $LASTEXITCODE }

Write-Host "Executing prepare script on remote host (this will unpack, install, generate, build)." -ForegroundColor Yellow
& ssh -i $Key "root@$RemoteHost" "bash $RemotePrepare"
if ($LASTEXITCODE -ne 0) { Write-Error "Remote prepare failed (exit $LASTEXITCODE). Check pm2 logs on server."; exit $LASTEXITCODE }

Write-Host "Remote prepare finished." -ForegroundColor Green

if (-not (Confirm "Run swap (move release->repo and restart pm2) on $RemoteHost now? This will make the new release live."))
{
    Write-Host 'Swap skipped. You can run swap later manually on the server.'; exit 0
}

$swapScript = @'
#!/usr/bin/env bash
set -e
ts=$(date +%s)
if [ -d /var/www/bustanalosool/repo ]; then
  mv /var/www/bustanalosool/repo /var/www/bustanalosool/repo_prev_$ts
fi
mv /var/www/bustanalosool/release /var/www/bustanalosool/repo
pm2 restart bustan-alosool --update-env
pm2 save
echo SWAPPED
'@

$localSwap = [IO.Path]::GetTempFileName() + '.sh'
$swapText = $swapScript -replace "`r`n","`n"
[System.IO.File]::WriteAllText($localSwap, $swapText, [System.Text.UTF8Encoding]::new($false))

Write-Host "Copying swap script to $($RemoteHost):$RemoteSwap" -ForegroundColor Cyan
& scp -i $Key $localSwap "root@$($RemoteHost):$RemoteSwap"
if ($LASTEXITCODE -ne 0) { Write-Error "scp swap script failed"; exit $LASTEXITCODE }

Write-Host "Executing swap script on remote host (this will make the release live)." -ForegroundColor Yellow
& ssh -i $Key "root@$RemoteHost" "bash $RemoteSwap"
if ($LASTEXITCODE -ne 0) { Write-Error "Remote swap failed (exit $LASTEXITCODE)."; exit $LASTEXITCODE }

Write-Host "Deployment complete and swapped. Check PM2 status on server." -ForegroundColor Green

# cleanup local temp files
Remove-Item $localPrepare -ErrorAction SilentlyContinue
Remove-Item $localSwap -ErrorAction SilentlyContinue

Write-Host "Done." -ForegroundColor Cyan
