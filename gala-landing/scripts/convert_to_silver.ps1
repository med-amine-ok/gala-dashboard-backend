Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\GALA-gold-backup.png"
$dstPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\GALA.png"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)
$bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$ptr = $bmpData.Scan0
$bytes = [Math]::Abs($bmpData.Stride) * $bmp.Height
$rgbValues = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($ptr, $rgbValues, 0, $bytes)

# Format32bppArgb is stored as BGRA (Byte 0: Blue, Byte 1: Green, Byte 2: Red, Byte 3: Alpha)
for ($i = 0; $i -lt $bytes; $i += 4) {
    $alpha = $rgbValues[$i + 3]
    if ($alpha -gt 0) {
        $b = [double]$rgbValues[$i]
        $g = [double]$rgbValues[$i + 1]
        $r = [double]$rgbValues[$i + 2]
        
        # Perceived luminance
        $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b
        
        # Enhance metallic silver sheen:
        # Boost contrast and brightness for polished silver reflection
        $norm = $lum / 255.0
        # Contrast adjustment curve (gamma ~ 0.85 and slight S-curve)
        $silver = [Math]::Pow($norm, 0.9) * 1.12
        if ($silver -gt 1.0) { $silver = 1.0 }
        
        $silverVal = [byte]([Math]::Round($silver * 255.0))
        
        # Give a very subtle metallic cool luster
        $blueVal = [byte]([Math]::Min(255, [int]($silverVal * 1.02)))
        $greenVal = [byte]([Math]::Min(255, [int]($silverVal * 1.00)))
        $redVal = [byte]([Math]::Min(255, [int]($silverVal * 0.99)))

        $rgbValues[$i] = $blueVal       # Blue
        $rgbValues[$i + 1] = $greenVal  # Green
        $rgbValues[$i + 2] = $redVal    # Red
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $ptr, $bytes)
$bmp.UnlockBits($bmpData)

# Save to temporary and replace
$tempPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\GALA-silver.png"
$bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Copy-Item $tempPath $dstPath -Force
Write-Host "Successfully converted GALA.png to silver metallic!"
