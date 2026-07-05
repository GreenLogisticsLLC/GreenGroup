# Crops reviewer avatars from photos for site/Screenshot_38.png (2x3 Google review grid, 1845x781).
# Writes square PNGs into assets/images/google-review-slides/review-01.png .. review-06.png
# Order: row-major — Michael, Eric, Ed, Mary, Chris, David.
$ErrorActionPreference = "Stop"
# tools/ -> project root (SEO GEO)
$root = Split-Path $PSScriptRoot
if (-not (Test-Path (Join-Path $root "assets"))) {
  $root = Join-Path $PSScriptRoot ".."
}
$srcPath = Join-Path $root "photos for site\Screenshot_38.png"
$outDir = Join-Path $root "assets\images\google-review-slides"
if (-not (Test-Path $srcPath)) { Write-Error "Missing $srcPath"; exit 1 }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($srcPath)
try {
  $W = [double]$src.Width
  $H = [double]$src.Height
  $cols = 3
  $rows = 2
  $cellW = $W / $cols
  $cellH = $H / $rows
  # Per-column X offset (px): avatars sit slightly differently on left/center/right cards
  $offXByCol = @(8, 26, 20)
  $offY = 34
  $s = 96

  $idx = 1
  for ($r = 0; $r -lt $rows; $r++) {
    for ($c = 0; $c -lt $cols; $c++) {
      $baseX = $c * $cellW
      $baseY = $r * $cellH
      $ox = $offXByCol[$c]
      $x = [int][Math]::Floor($baseX + $ox)
      $y = [int][Math]::Floor($baseY + $offY)
      if ($x + $s -gt $src.Width) { $s = $src.Width - $x }
      if ($y + $s -gt $src.Height) { $s = $src.Height - $y }
      if ($s -lt 32) { continue }

      $bmp = New-Object System.Drawing.Bitmap $s, $s
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $srcRect = New-Object System.Drawing.Rectangle $x, $y, $s, $s
      $dstRect = New-Object System.Drawing.Rectangle 0, 0, $s, $s
      $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
      $g.Dispose()

      $outPath = Join-Path $outDir ("review-{0:D2}.png" -f $idx)
      $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
      $bmp.Dispose()
      Write-Host "Wrote $outPath (${s}px)"
      $idx++
    }
  }
}
finally {
  $src.Dispose()
}
