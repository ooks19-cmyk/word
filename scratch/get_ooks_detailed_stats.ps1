# C:\Users\ooks1\OneDrive\바탕 화면\축구카드\scratch\get_ooks_detailed_stats.ps1

$playerDataPath = ".\player_data.js"
$playerDataContent = Get-Content -Path $playerDataPath -Raw -Encoding utf8

$cardsDb = @{}
$pattern = '(?s)"([^"]+)"\s*:\s*\{\s*id\s*:\s*"[^"]+",\s*name\s*:\s*"([^"]+)",\s*rating\s*:\s*(\d+),\s*position\s*:\s*"([^"]+)".*?stats\s*:\s*\{\s*pac\s*:\s*(\d+),\s*sho\s*:\s*(\d+),\s*pas\s*:\s*(\d+),\s*dri\s*:\s*(\d+),\s*def\s*:\s*(\d+),\s*phy\s*:\s*(\d+)\s*\}'
$matches = [regex]::Matches($playerDataContent, $pattern)

foreach ($m in $matches) {
    $cardId = $m.Groups[1].Value
    $name = $m.Groups[2].Value
    $rating = [int]$m.Groups[3].Value
    $position = $m.Groups[4].Value
    $pac = [int]$m.Groups[5].Value
    $sho = [int]$m.Groups[6].Value
    $pas = [int]$m.Groups[7].Value
    $dri = [int]$m.Groups[8].Value
    $def = [int]$m.Groups[9].Value
    $phy = [int]$m.Groups[10].Value

    $cardsDb[$cardId] = @{
        name = $name
        rating = $rating
        position = $position
        stats = @{
            pac = $pac; sho = $sho; pas = $pas; dri = $dri; def = $def; phy = $phy
        }
    }
}

$squad = @{
    "LW" = "lee_kang_in"
    "ST" = "son_heung_min"
    "RW" = "lee_seung_woo"
    "LCM" = "choi_chol_soon"
    "CM" = "park_ji_sung"
    "RCM" = "oberdan"
    "LB" = "lee_jae_sung"
    "LCB" = "kim_min_jae"
    "RCB" = "kim_tae_hwan"
    "RB" = "jens_castrop"
    "GK" = "song_bum_keun"
}

$deck = @{
    "lee_kang_in" = 5
    "son_heung_min" = 5
    "lee_seung_woo" = 5
    "choi_chol_soon" = 5
    "park_ji_sung" = 4
    "oberdan" = 5
    "lee_jae_sung" = 2
    "kim_min_jae" = 2
    "kim_tae_hwan" = 5
    "jens_castrop" = 1
    "song_bum_keun" = 5
}

$totalOvr = 0
$totalPas = 0
$positions = @("ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK")

$awakenedSquad = @{}

foreach ($pos in $positions) {
    $cardId = $squad[$pos]
    $awk = 0
    if ($deck[$cardId]) {
        $awk = $deck[$cardId]
    }
    $card = $cardsDb[$cardId]
    
    if (-not $card) {
        Write-Host "Card not found: $cardId"
        continue
    }
    
    $actRating = $card.rating + $awk
    $totalOvr += $actRating
    
    # Awaken individual stats
    $actPac = $card.stats.pac + $awk
    $actSho = $card.stats.sho + $awk
    $actPas = $card.stats.pas + $awk
    $actDri = $card.stats.dri + $awk
    $actDef = $card.stats.def + $awk
    $actPhy = $card.stats.phy + $awk
    
    $totalPas += $actPas

    $awakenedSquad[$pos] = @{
        name = $card.name
        rating = $actRating
        pac = $actPac
        sho = $actSho
        pas = $actPas
        dri = $actDri
        def = $actDef
        phy = $actPhy
    }
}

$baseOvr = [Math]::Round($totalOvr / 11)
$avgPas = [Math]::Round($totalPas / 11)

# CM is park_ji_sung
$cmCard = $awakenedSquad["CM"]
$cmPas = $cmCard.pas

# ST is son_heung_min
$stCard = $awakenedSquad["ST"]
$stPhy = $stCard.phy

# 4-3-3 Target Man activation check
$isDetailedActive = $stPhy -ge 80
$detailedTacticBonus = 0.0
if ($isDetailedActive) {
    $detailedTacticBonus = 0.05
}

# 4-3-3 suitability check
$suitabilityBonus = [Math]::Max(0.0, ($avgPas - 70) * 0.01)

# formation OVR completion check
$hasKeyPlayer = $cmPas -ge 80
$hasTeamTactic = $avgPas -ge 70
$formationBonus = 0
if ($hasKeyPlayer) { $formationBonus += 1 }
if ($hasTeamTactic) { $formationBonus += 1 }

$activePlayerOvr = $baseOvr + $formationBonus

# formationAttackBoost
$formationAttackBoost = 0.0
if ($hasKeyPlayer -and $hasTeamTactic) {
    $formationAttackBoost = ($cmPas - 80) * 0.005
}

# Strikers stats (LW, ST, RW)
# Option 0 (LW): (dri + sho)/2
# Option 1 (ST): sho
# Option 2 (RW): (pac + sho)/2
$lwStat = [Math]::Round(($awakenedSquad["LW"].dri + $awakenedSquad["LW"].sho) / 2)
$stStat = $awakenedSquad["ST"].sho
$rwStat = [Math]::Round(($awakenedSquad["RW"].pac + $awakenedSquad["RW"].sho) / 2)

$opponentOvrBase = 90
$oppOvrMatch = 90 + 2 # Away match: opponent gets +2 home buff

$lwChanceBonus = [Math]::Max(0.0, ($lwStat - $opponentOvrBase) * 0.01)
$stChanceBonus = [Math]::Max(0.0, ($stStat - $opponentOvrBase) * 0.01)
$rwChanceBonus = [Math]::Max(0.0, ($rwStat - $opponentOvrBase) * 0.01)
$avgPlayerChanceBonus = ($lwChanceBonus + $stChanceBonus + $rwChanceBonus) / 3

# GK song_bum_keun
$gkRating = $awakenedSquad["GK"].rating
$gkBonus = ($gkRating + 5 - $oppOvrMatch) * 0.01

# Defense average (LB, LCB, RCB, RB, GK)
$defList = @($awakenedSquad["LB"].def, $awakenedSquad["LCB"].def, $awakenedSquad["RCB"].def, $awakenedSquad["RB"].def, $awakenedSquad["GK"].def)
$defSum = 0
foreach ($df in $defList) {
    $defSum += $df
}
$avgDef = $defSum / $defList.Count
$playerDefBonus = [Math]::Max(0.0, ($avgDef - 70) * 0.01)

# activeDiff in Away match
$activeDiff = $activePlayerOvr - $oppOvrMatch

# Probabilities
$playerAttackProb = [Math]::Min(0.80, [Math]::Max(0.20, 0.40 + ($activeDiff * 0.019) + $formationAttackBoost + $suitabilityBonus + $detailedTacticBonus))
$scoreProb = [Math]::Min(0.50, [Math]::Max(0.10, 0.24 + ($activeDiff * 0.019) + $avgPlayerChanceBonus + $suitabilityBonus))
$oppScoreProb = [Math]::Min(0.50, [Math]::Max(0.10, 0.40 - ($activeDiff * 0.026) - $playerDefBonus - $gkBonus))

$playerXG = 5 * $playerAttackProb * $scoreProb
$oppXG = 5 * (1 - $playerAttackProb) * $oppScoreProb

Write-Host "--- DETAILED VALUES ---"
Write-Host "Base OVR: $baseOvr"
Write-Host "Average PAS: $avgPas"
Write-Host "CM PAS: $cmPas (Key Player: $hasKeyPlayer)"
Write-Host "ST PHY: $stPhy (Target Man Active: $isDetailedActive)"
Write-Host "Avg Def: $avgDef"
Write-Host "GK Rating: $gkRating"
Write-Host "Active Player OVR: $activePlayerOvr"
Write-Host "Active Opponent OVR (Away): $oppOvrMatch"
Write-Host "Active Diff: $activeDiff"
Write-Host "detailedTacticBonus: $detailedTacticBonus"
Write-Host "suitabilityBonus: $suitabilityBonus"
Write-Host "formationAttackBoost: $formationAttackBoost"
Write-Host "Average Player Chance Bonus: $avgPlayerChanceBonus"
Write-Host "playerDefBonus: $playerDefBonus"
Write-Host "gkBonus: $gkBonus"
Write-Host "--- FINAL MATCH PROBABILITIES ---"
Write-Host "Player Attack Prob: $playerAttackProb"
Write-Host "Player Score Prob: $scoreProb"
Write-Host "Opponent Score Prob: $oppScoreProb"
Write-Host "Player xG: $playerXG"
Write-Host "Opponent xG: $oppXG"
