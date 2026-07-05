# Crops avatars from photos for site/google-reviews-source-41.png (1024x142, 3 cards in one row).
# Writes: avatar-mary-cissell.png, avatar-chris-weaver.png, avatar-david-castellanos.png
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot
$srcPath = Join-Path $root "photos for site\google-reviews-source-41.png"
$outDir = Join-Path $root "assets\images\google-review-slides"
if (-not (Test-Path $srcPath)) { Write-Error "Missing $srcPath"; exit 1 }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($srcPath)
try {
  $W = [double]$src.Width
  $H = [double]$src.Height
  if ($W -ne 1024 -or $H -ne 142) {
    Write-Warning "Expected 1024x142 source; got ${W}x${H}. Re-tune offsets in this script."
  }

  # Tuned for this exact screenshot: three cards + side arrows.
  $sidePad = 36
  $innerW = $W - 2 * $sidePad
  $cellW = $innerW / 3
  # Crop inner avatar area to avoid red markup strokes around circles.
  $offXByCol = @(14, 22, 20)
  $y = 26
  $s = 32

  $names = @("avatar-mary-cissell.png", "avatar-chris-weaver.png", "avatar-david-castellanos.png")
  for ($c = 0; $c -lt 3; $c++) {
    $x = [int][Math]::Floor($sidePad + $c * $cellW + $offXByCol[$c])
    $size = $s
    if ($x + $size -gt $src.Width) { $size = $src.Width - $x }
    if ($y + $size -gt $src.Height) { $size = $src.Height - $y }

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle $x, $y, $size, $size
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
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
