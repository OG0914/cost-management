param(
    [string]$Container = "cost-postgres",
    [string]$BackupDir = "G:\cost_backup",
    [string]$DbName = "cost_analysis",
    [string]$DbUser = "postgres",
    [int]$KeepDays = 30
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "cost_analysis_$Timestamp.dump"
$LogFile = Join-Path $BackupDir "backup.log"

function Write-Log {
    param([string]$Msg)
    $Line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Msg"
    Write-Host $Line
    if (Test-Path $BackupDir) {
        Add-Content -Path $LogFile -Value $Line -Encoding UTF8
    }
}

Write-Log "== Start Backup =="
Write-Log "Container: $Container | DB: $DbName"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Log "Created backup dir: $BackupDir"
}

$DockerCheck = & docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: Docker is not running"
    exit 1
}

$Running = & docker ps --format "{{.Names}}" | Where-Object { $_ -eq $Container }
if (-not $Running) {
    Write-Log "ERROR: Container $Container is not running"
    exit 1
}

Write-Log "Exporting database..."
& docker exec $Container pg_dump -U $DbUser -Fc --no-owner --no-privileges $DbName > $BackupFile

if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: pg_dump failed with code $LASTEXITCODE"
    if (Test-Path $BackupFile) { Remove-Item $BackupFile -Force }
    exit 1
}

if (-not (Test-Path $BackupFile)) {
    Write-Log "ERROR: Backup file not created"
    exit 1
}

$FileInfo = Get-Item $BackupFile
$FileSizeKB = [math]::Round($FileInfo.Length / 1024, 1)

if ($FileInfo.Length -lt 1024) {
    Write-Log "ERROR: Backup file too small ($($FileInfo.Length) bytes)"
    Remove-Item $BackupFile -Force
    exit 1
}

Write-Log "OK: $BackupFile ($FileSizeKB KB)"

$CutoffDate = (Get-Date).AddDays(-$KeepDays)
$OldFiles = Get-ChildItem -Path $BackupDir -Filter "cost_analysis_*.dump" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
$DeletedCount = 0
foreach ($f in $OldFiles) {
    Remove-Item $f.FullName -Force
    $DeletedCount++
}
if ($DeletedCount -gt 0) {
    Write-Log "Cleaned $DeletedCount old backups (older than $KeepDays days)"
}

$AllBackups = Get-ChildItem -Path $BackupDir -Filter "cost_analysis_*.dump"
$TotalSizeMB = [math]::Round(($AllBackups | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
Write-Log "Total: $($AllBackups.Count) backups, $TotalSizeMB MB"
Write-Log "== Backup Complete =="
