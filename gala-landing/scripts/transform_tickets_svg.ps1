$svgPath = "c:\Users\OASIS\Documents\gala-dashboard-backend\gala-landing\public\tickets-01.svg"
$svg = [System.IO.File]::ReadAllText($svgPath, [System.Text.Encoding]::UTF8)

Write-Host "Original SVG size: $($svg.Length)"

# 1. Update .cls-8, .cls-9, .cls-10 to use Near-Black Maroon (#2D070D) instead of cold #00080f
$svg = $svg -replace '\.cls-8,\s*\.cls-9,\s*\.cls-10\s*\{\s*fill:\s*#00080f;\s*\}', @"
      .cls-8, .cls-9, .cls-10 {
        fill: #2D070D;
      }
      .cls-card-bg {
        fill: #2D070D;
      }
"@

# 2. Separate .cls-17 (ticket body) and .cls-18 (PRICE text)
# .cls-17 becomes Cream (#F2E8D8)
# .cls-18 becomes Near-Black Maroon (#2D070D) with bold font
$svg = $svg -replace '\.cls-17,\s*\.cls-18\s*\{\s*fill:\s*#dcd4c2;\s*\}', @"
      .cls-17 {
        fill: #F2E8D8;
      }
      .cls-18 {
        fill: #2D070D;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
"@

# 3. Make partner logos/VIC emblem (.cls-111) use #2D070D
$svg = $svg -replace '\.cls-111\s*\{\s*fill-rule:\s*evenodd;\s*\}', @"
      .cls-111 {
        fill-rule: evenodd;
        fill: #2D070D;
      }
"@

# 4. Update the background rect to use .cls-card-bg so it is Near-Black Maroon (#2D070D)
$svg = $svg.Replace('<rect class="cls-8" width="1200" height="420"/>', '<rect class="cls-card-bg" width="1200" height="420"/>')

# 5. Update wave line fills in background
$waveMap = @{
    '.cls-7'  = '#430A13';
    '.cls-11' = '#5B0F1A';
    '.cls-12' = '#7E1B29';
    '.cls-13' = '#8B1E2D';
    '.cls-14' = '#B8B8C0';
    '.cls-15' = '#A0A0A8';
    '.cls-16' = '#D0D0D5';
    '.cls-19' = '#E5E5E5';
    '.cls-20' = '#6E1624';
    '.cls-21' = '#4E0C16';
    '.cls-22' = '#2D070D';
    '.cls-23' = '#6E1624';
    '.cls-24' = '#8B1E2D';
    '.cls-25' = '#5B0F1A';
    '.cls-26' = '#38080F';
    '.cls-27' = '#5B0F1A';
}

foreach ($entry in $waveMap.GetEnumerator()) {
    $c = [regex]::Escape($entry.Key)
    $val = $entry.Value
    $pattern = "($c\s*\{\s*fill:\s*)(#[0-9a-fA-F]{6})(;\s*\})"
    $svg = [regex]::Replace($svg, $pattern, "${1}$val`${3}")
}

# 6. Transform the gold gradient Dégradé_sans_nom_2 to polished metallic silver
$newSilverGradient = @"
<linearGradient id="Dégradé_sans_nom_2" data-name="Dégradé sans nom 2" x1="249.24" y1="199" x2="668.43" y2="199" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#96969C"/>
      <stop offset=".22" stop-color="#B8B8BE"/>
      <stop offset=".47" stop-color="#FFFFFF"/>
      <stop offset=".53" stop-color="#ECECEF"/>
      <stop offset=".63" stop-color="#C2C2C8"/>
      <stop offset=".75" stop-color="#9C9CA2"/>
      <stop offset="1" stop-color="#76767C"/>
    </linearGradient>
"@
$svg = [regex]::Replace($svg, '<linearGradient id="Dégradé_sans_nom_2"[\s\S]*?<\/linearGradient>', $newSilverGradient)

# 7. Transform White_Gold to Silver / Platinum with subtle Cream highlight
$newWhiteGold = @"
<linearGradient id="White_Gold" data-name="White Gold" x1="100.74" y1="12.82" x2="1426.96" y2="12.82" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#C0C0C0"/>
      <stop offset=".25" stop-color="#FFFFFF"/>
      <stop offset=".38" stop-color="#F2E8D8"/>
      <stop offset=".6" stop-color="#D8D8D8"/>
      <stop offset=".79" stop-color="#E5E5E5"/>
      <stop offset="1" stop-color="#A8A8A8"/>
    </linearGradient>
"@
$svg = [regex]::Replace($svg, '<linearGradient id="White_Gold"[\s\S]*?<\/linearGradient>', $newWhiteGold)

# 8. Transform linear-gradient-14 (sponsor logos gradient at bottom) to deep maroon / burgundy
$newGrad14 = @"
<linearGradient id="linear-gradient-14" x1="440.51" y1="349.38" x2="440.51" y2="338.05" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2D070D"/>
      <stop offset=".4" stop-color="#5B0F1A"/>
      <stop offset=".92" stop-color="#3A0910"/>
    </linearGradient>
"@
$svg = [regex]::Replace($svg, '<linearGradient id="linear-gradient-14"[\s\S]*?<\/linearGradient>', $newGrad14)

# 9. Update the subtle wave line gradients (linear-gradient to linear-gradient-13)
$gradColorMap = @{
    '#c6ced0' = '#C0C0C8';
    '#e8e7d1' = '#D8D8DF';
    '#d8d5c4' = '#8B1E2D';
    '#c0baaf' = '#7A1A27';
    '#d6d8d7' = '#D0D0D8';
    '#c3c3ab' = '#5B0F1A';
    '#bbc3c4' = '#B0B0B8';
    '#d8d8c4' = '#C8C8D0';
    '#c8c6b6' = '#8B1E2D';
    '#b6b2a7' = '#6E1624';
    '#c9ccca' = '#C0C0C8';
    '#b8baa3' = '#4E0C16';
    '#b0b9b8' = '#A0A0A8';
    '#caccb9' = '#B8B8C0';
    '#babaab' = '#8B1E2D';
    '#acaa9f' = '#5B0F1A';
    '#bdc1be' = '#B0B0B8';
    '#adb19c' = '#38080F';
    '#a6b0ae' = '#909098';
    '#bcbfae' = '#A8A8B0';
    '#acada0' = '#8B1E2D';
    '#a2a297' = '#5B0F1A';
    '#b1b6b2' = '#A0A0A8';
    '#a3a894' = '#2D070D';
    '#9ca6a3' = '#808088';
    '#afb4a3' = '#9898A0';
    '#9fa295' = '#7E1B29';
    '#989b90' = '#4E0C16';
    '#a5aca7' = '#909098';
    '#99a08d' = '#2D070D';
    '#929d9a' = '#707078';
    '#a3a999' = '#8B1E2D';
    '#93978c' = '#6E1624';
    '#8f9389' = '#4E0C16';
    '#9aa29d' = '#808088';
    '#909887' = '#2D070D';
    '#889590' = '#606068';
    '#979e90' = '#8B1E2D';
    '#868c82' = '#5B0F1A';
    '#8f9993' = '#707078';
    '#879080' = '#2D070D';
    '#7f8d87' = '#505058';
    '#8b9486' = '#8B1E2D';
    '#7e867b' = '#5B0F1A';
    '#859089' = '#606068';
    '#7e897a' = '#2D070D';
    '#76857e' = '#404048';
    '#808b7e' = '#8B1E2D';
    '#757f75' = '#5B0F1A';
    '#7b8780' = '#505058';
    '#758274' = '#2D070D';
    '#6e7d76' = '#383840';
    '#758275' = '#8B1E2D';
    '#6d796f' = '#5B0F1A';
    '#727f77' = '#484850';
    '#6d7b6e' = '#2D070D';
    '#66766e' = '#303038';
    '#6b796d' = '#8B1E2D';
    '#657369' = '#5B0F1A';
    '#68776f' = '#404048';
    '#657568' = '#2D070D';
    '#5e6f66' = '#282830';
    '#617166' = '#7E1B29';
    '#5d6d63' = '#4E0C16';
    '#5f7067' = '#383840';
    '#5d6e63' = '#2D070D';
    '#56695f' = '#202028';
    '#576a5f' = '#6E1624';
    '#56685d' = '#38080F';
}

foreach ($entry in $gradColorMap.GetEnumerator()) {
    $oldCol = [regex]::Escape($entry.Key)
    $newCol = $entry.Value
    $svg = [regex]::Replace($svg, "stop-color=""$oldCol""", "stop-color=""$newCol""", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

[System.IO.File]::WriteAllText($svgPath, $svg, [System.Text.Encoding]::UTF8)
Write-Host "Successfully converted tickets-01.svg to palette!"
