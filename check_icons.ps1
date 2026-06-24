Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot 'public\icon.png'))
Write-Host "icon.png: $($img.Width)x$($img.Height)"
$img.Dispose()

$img2 = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot 'public\Logo.png'))
Write-Host "Logo.png: $($img2.Width)x$($img2.Height)"
$img2.Dispose()
