$srcPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\tickets-01-backup.svg"
$dstPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\tickets-01.svg"

$svg = [System.IO.File]::ReadAllText($srcPath, [System.Text.Encoding]::UTF8)

# 1. Update .cls-8, .cls-9, .cls-10 to use Near-Black Maroon (#2D070D)
$oldCls8 = "      .cls-8, .cls-9, .cls-10 {`r`n        fill: #00080f;`r`n      }"
if (-not $svg.Contains($oldCls8)) {
    # Try LF line endings
    $oldCls8 = "      .cls-8, .cls-9, .cls-10 {`n        fill: #00080f;`n      }"
}
$newCls8 = "      .cls-8, .cls-9, .cls-10 {`n        fill: #2D070D;`n      }`n      .cls-card-bg {`n        fill: #2D070D;`n      }"
$svg = $svg.Replace($oldCls8, $newCls8)

# 2. Separate .cls-17 (cream ticket base) and .cls-18 (PRICE text)
$oldCls17 = "      .cls-17, .cls-18 {`r`n        fill: #dcd4c2;`r`n      }"
if (-not $svg.Contains($oldCls17)) {
    $oldCls17 = "      .cls-17, .cls-18 {`n        fill: #dcd4c2;`n      }"
}
$newCls17 = "      .cls-17 {`n        fill: #F2E8D8;`n      }`n      .cls-18 {`n        fill: #2D070D;`n        font-weight: bold;`n      }"
$svg = $svg.Replace($oldCls17, $newCls17)

# 3. Outer background rect
$svg = $svg.Replace('<rect class="cls-8" width="1200" height="420"/>', '<rect class="cls-card-bg" width="1200" height="420"/>')

# 4. Partner logos (.cls-111)
$svg = $svg.Replace("      .cls-111 {`r`n        fill-rule: evenodd;`r`n      }", "      .cls-111 {`n        fill-rule: evenodd;`n        fill: #2D070D;`n      }")
$svg = $svg.Replace("      .cls-111 {`n        fill-rule: evenodd;`n      }", "      .cls-111 {`n        fill-rule: evenodd;`n        fill: #2D070D;`n      }")

# 5. CSS wave fill replacements
$cssReplaces = @{
    'fill: #67766e;' = 'fill: #430A13;';
    'fill: #7c8883;' = 'fill: #5B0F1A;';
    'fill: #929d99;' = 'fill: #7E1B29;';
    'fill: #9ea8a5;' = 'fill: #8B1E2D;';
    'fill: #b7bfbf;' = 'fill: #B8B8C0;';
    'fill: #aab3b2;' = 'fill: #A0A0A8;';
    'fill: #c4cccd;' = 'fill: #D0D0D5;';
    'fill: #d4dcde;' = 'fill: #E5E5E5;';
    'fill: #42564c;' = 'fill: #6E1624;';
    'fill: #717f78;' = 'fill: #4E0C16;';
    'fill: #54655c;' = 'fill: #2D070D;';
    'fill: #87928e;' = 'fill: #6E1624;';
    'fill: #3a4f45;' = 'fill: #8B1E2D;';
    'fill: #4b5d54;' = 'fill: #5B0F1A;';
    'fill: #5e6d65;' = 'fill: #38080F;';
    'fill: #4e6258;' = 'fill: #5B0F1A;';
}

foreach ($k in $cssReplaces.Keys) {
    $svg = $svg.Replace($k, $cssReplaces[$k])
}

# 6. Transform Dégradé_sans_nom_2 (gold -> silver)
$goldStops = @"
      <stop offset="0" stop-color="#9f603a"/>
      <stop offset=".22" stop-color="#97692f"/>
      <stop offset=".47" stop-color="#f2ae54"/>
      <stop offset=".53" stop-color="#e5a44f"/>
      <stop offset=".63" stop-color="#c58c42"/>
      <stop offset=".75" stop-color="#97692f"/>
      <stop offset="1" stop-color="#784d3e"/>
"@

$silverStops = @"
      <stop offset="0" stop-color="#96969C"/>
      <stop offset=".22" stop-color="#B8B8BE"/>
      <stop offset=".47" stop-color="#FFFFFF"/>
      <stop offset=".53" stop-color="#ECECEF"/>
      <stop offset=".63" stop-color="#C2C2C8"/>
      <stop offset=".75" stop-color="#9C9CA2"/>
      <stop offset="1" stop-color="#76767C"/>
"@

$svg = $svg.Replace($goldStops.Replace("`r`n", "`n"), $silverStops.Replace("`r`n", "`n"))
$svg = $svg.Replace($goldStops, $silverStops)

# 7. Transform White_Gold
$whiteGoldOld = @"
      <stop offset="0" stop-color="#d4dcde"/>
      <stop offset=".25" stop-color="#fcfbe1"/>
      <stop offset=".38" stop-color="#ede9d4"/>
      <stop offset=".6" stop-color="#ccc3b8"/>
      <stop offset=".79" stop-color="#e7e7e7"/>
      <stop offset="1" stop-color="#d0ceb4"/>
"@

$whiteGoldNew = @"
      <stop offset="0" stop-color="#C0C0C0"/>
      <stop offset=".25" stop-color="#FFFFFF"/>
      <stop offset=".38" stop-color="#F2E8D8"/>
      <stop offset=".6" stop-color="#D8D8D8"/>
      <stop offset=".79" stop-color="#E5E5E5"/>
      <stop offset="1" stop-color="#A8A8A8"/>
"@

$svg = $svg.Replace($whiteGoldOld.Replace("`r`n", "`n"), $whiteGoldNew.Replace("`r`n", "`n"))
$svg = $svg.Replace($whiteGoldOld, $whiteGoldNew)

# 8. Transform linear-gradient-14
$grad14Old = @"
      <stop offset="0" stop-color="#00080f"/>
      <stop offset=".4" stop-color="#00191a"/>
      <stop offset=".92" stop-color="#002c26"/>
"@

$grad14New = @"
      <stop offset="0" stop-color="#2D070D"/>
      <stop offset=".4" stop-color="#5B0F1A"/>
      <stop offset=".92" stop-color="#3A0910"/>
"@

$svg = $svg.Replace($grad14Old.Replace("`r`n", "`n"), $grad14New.Replace("`r`n", "`n"))
$svg = $svg.Replace($grad14Old, $grad14New)

# Save to destination
[System.IO.File]::WriteAllText($dstPath, $svg, [System.Text.Encoding]::UTF8)

# Also create public/tickets-01-palette.svg to test Next.js image cache busting
$extraPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\tickets-01-palette.svg"
[System.IO.File]::WriteAllText($extraPath, $svg, [System.Text.Encoding]::UTF8)

Write-Host "Successfully applied palette to tickets-01.svg!"
