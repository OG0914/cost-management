param(
    [string]$TaskName = "CostManagement-DB-Backup",
    [string]$TriggerTime = "02:00",
    [string]$ScriptPath = ""
)

$ErrorActionPreference = "Stop"

if (-not $ScriptPath) {
    $ScriptPath = Join-Path $PSScriptRoot "backup.ps1"
}

if (-not (Test-Path $ScriptPath)) {
    Write-Host "ERROR: Backup script not found at $ScriptPath" -ForegroundColor Red
    exit 1
}

Write-Host "== Register Backup Task ==" -ForegroundColor Cyan
Write-Host "Task Name: $TaskName"
Write-Host "Time: Daily at $TriggerTime"
Write-Host "Script: $ScriptPath"
Write-Host "=========================="

$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $IsAdmin) {
    Write-Host "ERROR: Please run as Administrator!" -ForegroundColor Red
    exit 1
}

$Existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($Existing) {
    Write-Host "Task '$TaskName' already exists." -ForegroundColor Yellow
    $Overwrite = Read-Host "Overwrite? (Y/N)"
    if ($Overwrite -ne "Y") {
        Write-Host "Cancelled"
        exit 0
    }
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

$Trigger = New-ScheduledTaskTrigger -Daily -At $TriggerTime
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:$false -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $TaskName -Trigger $Trigger -Action $Action -Settings $Settings -User "SYSTEM" -RunLevel Highest -Description "Cost Management System - PostgreSQL Daily Backup" -Force

Write-Host "OK: Task registered successfully!" -ForegroundColor Green
Write-Host "Check it in Task Scheduler or run: Start-ScheduledTask -TaskName '$TaskName'"
