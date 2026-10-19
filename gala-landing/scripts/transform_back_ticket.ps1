Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\back-ticket-backup.jpg"
$dstPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\back-ticket.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

$rect = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
$bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)

$ptr = $bmpData.Scan0
$stride = [Math]::Abs($bmpData.Stride)
$bytes = $stride * $height
$rgbValues = New-Object byte[] $bytes
[System.Runtime.InteropServices.Marshal]::Copy($ptr, $rgbValues, 0, $bytes)

# Format24bppRgb is stored as BGR (Byte 0: Blue, Byte 1: Green, Byte 2: Red)
$centerX = $width / 2.0
$centerY = $height / 2.0
$maxDist = [Math]::Sqrt($centerX * $centerX + $centerY * $centerY)

for ($y = 0; $y -lt $height; $y++) {
    $rowStart = $y * $stride
    $dy = ($y - $centerY) / $centerY
    
    for ($x = 0; $x -lt $width; $x++) {
        $idx = $rowStart + ($x * 3)
        $b = [double]$rgbValues[$idx]
        $g = [double]$rgbValues[$idx + 1]
        $r = [double]$rgbValues[$idx + 2]
        
        $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b
        $dx = ($x - $centerX) / $centerX
        $distFactor = [Math]::Sqrt($dx * $dx * 0.7 + $dy * $dy * 1.2)
        if ($distFactor -gt 1.0) { $distFactor = 1.0 }
        
        # 1. Detect GOLD STARS:
        # High Red, medium Green, low Blue, strong difference between R and B
        $isGold = ($r -gt 100 -and $g -gt 60 -and ($r - $b) -gt 35 -and ($r - $g) -gt 5 -and $b -lt 150)
        
        if ($isGold) {
            # Convert to polished metallic silver
            $starNorm = [Math]::Min(1.0, [Math]::Max(0.0, $lum / 240.0))
            $silverCurve = [Math]::Pow($starNorm, 0.85) * 1.15
            if ($silverCurve -gt 1.0) { $silverCurve = 1.0 }
            
            $silverVal = $silverCurve * 255.0
            $finalR = [Math]::Min(255.0, $silverVal * 0.98)
            $finalG = [Math]::Min(255.0, $silverVal * 1.00)
            $finalB = [Math]::Min(255.0, $silverVal * 1.04) # cool silver gleam
            
            $rgbValues[$idx] = [byte][Math]::Round($finalB)
            $rgbValues[$idx + 1] = [byte][Math]::Round($finalG)
            $rgbValues[$idx + 2] = [byte][Math]::Round($finalR)
        }
        # 2. Text (ENGINEERS' GALA and Tagline) - Bright white/cream text
        elseif ($lum -gt 170) {
            # Keep text crisp and luminous (slight warm cream luster)
            $textVal = [Math]::Min(255.0, $lum * 1.03)
            $finalR = [Math]::Min(255.0, $textVal * 1.00)
            $finalG = [Math]::Min(255.0, $textVal * 0.98)
            $finalB = [Math]::Min(255.0, $textVal * 0.94)
            
            $rgbValues[$idx] = [byte][Math]::Round($finalB)
            $rgbValues[$idx + 1] = [byte][Math]::Round($finalG)
            $rgbValues[$idx + 2] = [byte][Math]::Round($finalR)
        }
        # 3. Intermediate tones: Wave lines, Ribbon, Text Antialiasing (lum 25 - 170)
        elseif ($lum -gt 25) {
            $t = ($lum - 25.0) / 145.0
            
            # Base background at this location (Near-black maroon to subtle deep maroon glow)
            # Center has a subtle deep maroon glow (#5B0F1A = 91, 15, 26)
            # Edges have near-black maroon (#2D070D = 45, 7, 13)
            $bgR = 45.0 + (1.0 - $distFactor) * 25.0
            $bgG = 7.0 + (1.0 - $distFactor) * 5.0
            $bgB = 13.0 + (1.0 - $distFactor) * 8.0
            
            # Wave lines shimmer with a blend of burgundy (#8B1E2D) and silver
            $waveR = 139.0 * (1.0 - $t) + 240.0 * $t
            $waveG = 30.0 * (1.0 - $t) + 230.0 * $t
            $waveB = 45.0 * (1.0 - $t) + 220.0 * $t
            
            $blend = [Math]::Pow($t, 1.2)
            $finalR = $bgR * (1.0 - $blend) + $waveR * $blend
            $finalG = $bgG * (1.0 - $blend) + $waveG * $blend
            $finalB = $bgB * (1.0 - $blend) + $waveB * $blend
            
            $rgbValues[$idx] = [byte][Math]::Round([Math]::Min(255.0, $finalB))
            $rgbValues[$idx + 1] = [byte][Math]::Round([Math]::Min(255.0, $finalG))
            $rgbValues[$idx + 2] = [byte][Math]::Round([Math]::Min(255.0, $finalR))
        }
        # 4. Deep Background (lum <= 25)
        else {
            # Map cold black/blue to rich Near-Black Maroon (#2D070D)
            # with subtle center radial warmth
            $factor = 1.0 - $distFactor
            $normLum = $lum / 25.0
            
            # Near-black maroon base: 45, 7, 13
            # Subtle center glow adds up to ~15 to Red, ~3 to Green, ~5 to Blue
            $finalR = 45.0 + ($factor * 15.0) + ($normLum * 10.0)
            $finalG = 7.0 + ($factor * 3.0) + ($normLum * 2.0)
            $finalB = 13.0 + ($factor * 5.0) + ($normLum * 4.0)
            
            $rgbValues[$idx] = [byte][Math]::Round([Math]::Min(255.0, $finalB))
            $rgbValues[$idx + 1] = [byte][Math]::Round([Math]::Min(255.0, $finalG))
            $rgbValues[$idx + 2] = [byte][Math]::Round([Math]::Min(255.0, $finalR))
        }
    }
}

[System.Runtime.InteropServices.Marshal]::Copy($rgbValues, 0, $ptr, $bytes)
$bmp.UnlockBits($bmpData)

# Save with high quality JPEG
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95L)

$bmp.Save($dstPath, $encoder, $encoderParams)
$bmp.Dispose()

Write-Host "Successfully transformed back-ticket.jpg to luxury palette!"
