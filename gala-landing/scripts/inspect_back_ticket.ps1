Add-Type -AssemblyName System.Drawing

$src = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\back-ticket.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($src)
Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"

# Sample colors at different regions:
# Center text (ENGINEERS' GALA): approx x = Width/2, y = Height/2
# Stars: left and right of GALA
# Background: top-left (0, 0), top-right, bottom-left
$bgSample = $bmp.GetPixel(10, 10)
Write-Host "Top-left BG: R=$($bgSample.R), G=$($bgSample.G), B=$($bgSample.B)"

$centerSample = $bmp.GetPixel([int]($bmp.Width / 2), [int]($bmp.Height / 2))
Write-Host "Center sample: R=$($centerSample.R), G=$($centerSample.G), B=$($centerSample.B)"

# Scan for gold pixels (where R > 150 and G > 100 and B < 100 and R - B > 50)
$goldCount = 0
for ($y = 0; $y -lt $bmp.Height; $y += 5) {
    for ($x = 0; $x -lt $bmp.Width; $x += 5) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -gt 150 -and $p.G -gt 90 -and $p.B -lt 120 -and ($p.R - $p.B) -gt 60) {
            $goldCount++
        }
    }
}
Write-Host "Gold pixel samples found: $goldCount"

$bmp.Dispose()
