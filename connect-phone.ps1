<#
  Connects the Android phone to adb over Wi-Fi.

  Normal case : phone listens on fixed port 5555 -> just connects.
  After phone reboot : port 5555 is reset. The script asks for the port shown on
                       the phone's "Wireless debugging" screen, connects, and switches
                       the phone back to port 5555.

  Usage:
    .\connect-phone.ps1 -PhoneIp <phone-ip>
    .\connect-phone.ps1 -PhoneIp <phone-ip> -FixedPort <fixed-port>

  <phone-ip>: shown on the phone under Settings > System > Developer options >
  Wireless debugging > "IP address & Port".

  One-time requirements: phone paired with this PC ("Pair device with pairing code"),
  Wireless debugging ON, phone and PC on the same Wi-Fi.
#>
param(
    [Parameter(Mandatory = $true, HelpMessage = "Phone IP address shown on the Wireless debugging screen")]
    [string]$PhoneIp,
    [int]$FixedPort = 5555
)

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { Write-Host "adb not found at $adb" -ForegroundColor Red; exit 1 }

function Test-Port([int]$port) {
    $c = [System.Net.Sockets.TcpClient]::new()
    try { return $c.ConnectAsync($PhoneIp, $port).Wait(2000) -and $c.Connected } catch { return $false } finally { $c.Dispose() }
}

function Connect-Adb([int]$port) {
    $target = "${PhoneIp}:$port"
    & $adb connect $target 2>&1 | Out-Null
    Start-Sleep -Milliseconds 800
    return ((& $adb -s $target get-state 2>&1) -eq "device")
}

# Clean up stale "offline" entries for this phone
& $adb devices | Select-String "^$([regex]::Escape($PhoneIp)):\d+\s+offline" | ForEach-Object {
    & $adb disconnect $_.Line.Split()[0] | Out-Null
}

$fixed = "${PhoneIp}:$FixedPort"

# 1. Fixed port (works until the phone reboots)
if ((Test-Port $FixedPort) -and (Connect-Adb $FixedPort)) {
    Write-Host "Connected to $fixed" -ForegroundColor Green
    & $adb devices -l
    exit 0
}

# 2. After a reboot: use the Wireless debugging port, then switch back to the fixed port
Write-Host "Port $FixedPort is not open (phone probably restarted)." -ForegroundColor Yellow
Write-Host "On the phone open: Settings > System > Developer options > Wireless debugging"
$port = Read-Host "Enter the port shown under 'IP address & Port' (the number after the colon)"
if (-not ($port -as [int])) { Write-Host "Invalid port." -ForegroundColor Red; exit 1 }

if (-not (Connect-Adb ([int]$port))) {
    Write-Host "Could not connect to ${PhoneIp}:$port. If the phone shows no paired PC, pair again:" -ForegroundColor Red
    Write-Host "  & `"$adb`" pair ${PhoneIp}:<pairing-port> <6-digit-code>"
    exit 1
}

Write-Host "Switching phone to fixed port $FixedPort..."
& $adb -s "${PhoneIp}:$port" tcpip $FixedPort | Out-Null
Start-Sleep -Seconds 3
& $adb disconnect "${PhoneIp}:$port" | Out-Null

if (Connect-Adb $FixedPort) {
    Write-Host "Connected to $fixed" -ForegroundColor Green
} else {
    Write-Host "Connected on ${PhoneIp}:$port, but switching to $FixedPort failed. Re-run this script." -ForegroundColor Yellow
}
& $adb devices -l
