# Crops avatars from photos for site/google-reviews-source-39.png (1024x318, 3 cards in one row).
# Writes: avatar-tony-guan.png, avatar-samantha-wendling.png, avatar-asha-wallen.png
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot
$srcPath = Join-Path $root "photos for site\google-reviews-source-39.png"
$outDir = Join-Path $root "assets\images\google-review-slides"
if (-not (Test-Path $srcPath)) { Write-Error "Missing $srcPath"; exit 1 }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($srcPath)
try {
  $W = [double]$src.Width
  $H = [double]$src.Height
  if ($W -ne 1024 -or $H -ne 318) {
    Write-Warning "Expected 1024x318 source; got ${W}x${H}. Re-tune offsets in this script."
  }
  $sidePad = [int][Math]::Floor(0.052 * $W)
  $innerW = $W - 2 * $sidePad
  $cellW = $innerW / 3
  $headerH = [int][Math]::Floor(0.14 * $H)
  $offXByCol = @(10, 26, 6)
  $offYByCol = @(10, 4, 10)
  $s = 86

  $names = @("avatar-tony-guan.png", "avatar-samantha-wendling.png", "avatar-asha-wallen.png")
  for ($c = 0; $c -lt 3; $c++) {
    $x = [int][Math]::Floor($sidePad + $c * $cellW + $offXByCol[$c])
    $y = [int][Math]::Floor($headerH + $offYByCol[$c])
    if ($x + $s -gt $src.Width) { $s = $src.Width - $x }
    if ($y + $s -gt $src.Height) { $s = $src.Height - $y }

    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle $x, $y, $s, $s
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $s, $s
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $outPath = Join-Path $outDir $names[$c]
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Wrote $outPath"
  }
}
finally {
  $src.Dispose()
}
