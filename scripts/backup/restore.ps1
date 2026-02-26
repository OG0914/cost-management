param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$Container = "cost-postgres",
    [string]$DbName = "cost_analysis",
    [string]$DbUser = "postgres"
)

$ErrorActionPreference = "Continue"

if (-not (Test-Path $BackupFile)) {
    Write-Host "ERROR: Backup file not found - $BackupFile" -ForegroundColor Red
    exit 1
}

$FileInfo = Get-Item $BackupFile
$FileSizeKB = [math]::Round($FileInfo.Length / 1024, 1)

Write-Host "== Database Restore ==" -ForegroundColor Cyan
Write-Host "File: $BackupFile ($FileSizeKB KB)"
Write-Host "Target: $Container / $DbName"
Write-Host "======================"

Write-Host "WARNING: This will overwrite ALL data in $DbName!" -ForegroundColor Yellow
$Confirm = Read-Host "Type YES to continue"
if ($Confirm -ne "YES") {
    Write-Host "Cancelled"
    exit 0
}

$Running = & docker ps --format "{{.Names}}" | Where-Object { $_ -eq $Container }
if (-not $Running) {
    Write-Host "ERROR: Container $Container is not running" -ForegroundColor Red
    exit 1
}

Write-Host "Creating safety backup..." -ForegroundColor Cyan
$SafetyDir = Split-Path $BackupFile -Parent
$SafetyFile = Join-Path $SafetyDir "cost_analysis_pre_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

try {
    & docker exec $Container pg_dump -U $DbUser -Fc $DbName > $SafetyFile
    if (Test-Path $SafetyFile) {
        Write-Host "Safety backup created: $SafetyFile" -ForegroundColor Green
    }
}
catch {
    Write-Host "Safety backup skipped: $_"
}

Write-Host "Restoring database..." -ForegroundColor Cyan
& docker exec $Container psql -U $DbUser -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DbName' AND pid <> pg_backend_pid();" postgres > $null
& docker exec $Container dropdb -U $DbUser --if-exists $DbName > $null
& docker exec $Container createdb -U $DbUser $DbName > $null

Get-Content $BackupFile -Raw -Encoding Byte | & docker exec -i $Container pg_restore -U $DbUser -d $DbName --no-owner --no-privileges --single-transaction

Write-Host "Verifying..." -ForegroundColor Cyan
$TableCount = & docker exec $Container psql -U $DbUser -d $DbName -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
$UserCount = & docker exec $Container psql -U $DbUser -d $DbName -t -c "SELECT count(*) FROM users;"

Write-Host "== Restore Complete ==" -ForegroundColor Green
Write-Host "Tables: $($TableCount.Trim())"
Write-Host "Users: $($UserCount.Trim())"
Write-Host "======================"
