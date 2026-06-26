# C:\Users\ooks1\OneDrive\바탕 화면\축구카드\scratch\get_tomy_541_exact.ps1

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
    "LW" = "lee_seung_woo_kr"
    "ST" = "son_heung_min"
    "RW" = "jeon_jin_woo"
    "LCM" = "lee_jae_sung"
    "CM" = "lee_gi_hyeok"
    "RCM" = "park_ji_sung"
    "LB" = "kim_tae_hwan"
    "LCB" = "kim_min_jae"
    "RCB" = "hong_jeong_ho"
    "RB" = "park_jin_seob"
    "GK" = "jo_hyeon_woo"
}

$deck = @{
    "lee_seung_woo_kr" = 4
    "son_heung_min" = 5
    "jeon_jin_woo" = 5
    "lee_jae_sung" = 3
    "lee_gi_hyeok" = 1
    "park_ji_sung" = 5
    "kim_tae_hwan" = 5
    "kim_min_jae" = 5
    "hong_jeong_ho" = 5
    "park_jin_seob" = 5
    "jo_hyeon_woo" = 5
}

$totalOvr = 0
$totalPas = 0
$totalPac = 0
$totalDri = 0
$totalDef = 0
$positions = @("ST", "LW", "RW", "CM", "LCM", "RCM", "LB", "LCB", "RCB", "RB", "GK")

$awakenedSquad = @{}

foreach ($pos in $positions) {
    $cardId = $squad[$pos]
    $awk = 0
    if ($deck[$cardId]) {
        $awk = $deck[$cardId]
    }
    $card = $cardsDb[$cardId]
    
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
    $totalPac += $actPac
    $totalDri += $actDri
    $totalDef += $actDef

    $awakenedSquad[$pos] = @{
        name = $card.name
        originalPosition = $card.position
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
$avgPac = [Math]::Round($totalPac / 11)
$avgDri = [Math]::Round($totalDri / 11)
$avgDef = [Math]::Round($totalDef / 11)

# Key Player (LW/RW PAC >= 80)
# LW is lee_seung_woo_kr (94 PAC), RW is jeon_jin_woo (91 PAC)
$hasKeyPlayer = ($awakenedSquad["LW"].pac -ge 80) -or ($awakenedSquad["RW"].pac -ge 80)

# Team Tactic (DEF average >= 60)
$hasTeamTactic = $avgDef -ge 60

$formationBonus = 0
if ($hasKeyPlayer) { $formationBonus += 1 }
if ($hasTeamTactic) { $formationBonus += 1 }

$activePlayerOvr = $baseOvr + $formationBonus

# detailedTacticBonus (Direct Pass): At least one defender (LB, LCB, CM, RCB, RB)
# is naturally CB, LB, RB and has PAS >= 80
$passDefenders = 0
$defenders = @("LB", "LCB", "CM", "RCB", "RB")
foreach ($pos in $defenders) {
    $c = $awakenedSquad[$pos]
    $isRealDef = ($c.originalPosition -eq "CB" -or $c.originalPosition -eq "LB" -or $c.originalPosition -eq "RB")
    if ($isRealDef -and $c.pas -ge 80) {
        $passDefenders++
    }
}
$isDetailedActive = $passDefenders -ge 1
$detailedTacticBonus = 0.0
if ($isDetailedActive) {
    $detailedTacticBonus = 0.05
}

# 5-4-1 suitability check (DEF average)
$suitabilityBonus = [Math]::Max(0.0, ($avgDef - 60) * 0.01)

# formationScoreBoost: (LM/RM best PAC - 80) * 0.005
$bestPac = [Math]::Max($awakenedSquad["LW"].pac, $awakenedSquad["RW"].pac)
$formationScoreBoost = [Math]::Max(0.0, ($bestPac - 80) * 0.005)

# Strikers stats (LW, ST, RW)
# Option 0 (LW): (dri + sho)/2
# Option 1 (ST): sho
# Option 2 (RW): (pac + sho)/2
$lwStat = [Math]::Round(($awakenedSquad["LW"].dri + $awakenedSquad["LW"].sho) / 2)
$stStat = $awakenedSquad["ST"].sho
$rwStat = [Math]::Round(($awakenedSquad["RW"].pac + $awakenedSquad["RW"].sho) / 2)

$opponentOvrBase = 90
$oppOvrMatch = 90 + 2 # Away match

$lwChanceBonus = [Math]::Max(0.0, ($lwStat - $opponentOvrBase) * 0.01)
$stChanceBonus = [Math]::Max(0.0, ($stStat - $opponentOvrBase) * 0.01)
$rwChanceBonus = [Math]::Max(0.0, ($rwStat - $opponentOvrBase) * 0.01)
$avgPlayerChanceBonus = ($lwChanceBonus + $stChanceBonus + $rwChanceBonus) / 3

# GK jo_hyeon_woo
$gkRating = $awakenedSquad["GK"].rating
$gkBonus = ($gkRating + 5 - $oppOvrMatch) * 0.01

# Defense average (All 11 players for getTeamAverageStat('def'))
$playerDefBonus = [Math]::Max(0.0, ($avgDef - 70) * 0.01)

# activeDiff in Away match
$activeDiff = $activePlayerOvr - $oppOvrMatch

# Probabilities
# 5-4-1 doesn't have formationAttackBoost on attack prob (it goes to scoreProb)
$playerAttackProb = [Math]::Min(0.80, [Math]::Max(0.20, 0.40 + ($activeDiff * 0.019) + $suitabilityBonus + $detailedTacticBonus))
$scoreProb = [Math]::Min(0.50, [Math]::Max(0.10, 0.24 + ($activeDiff * 0.019) + $formationScoreBoost + $avgPlayerChanceBonus + $suitabilityBonus))
$oppScoreProb = [Math]::Min(0.50, [Math]::Max(0.10, 0.40 - ($activeDiff * 0.026) - $playerDefBonus - $gkBonus))

$playerXG = 5 * $playerAttackProb * $scoreProb
$oppXG = 5 * (1 - $playerAttackProb) * $oppScoreProb

Write-Host "--- DETAILED VALUES ---"
Write-Host "Base OVR: $baseOvr"
Write-Host "Average PAC: $avgPac"
Write-Host "Average DEF: $avgDef"
Write-Host "LM/RM best PAC: $bestPac"
Write-Host "Defenders with natural position CB/LB/RB and PAS >= 80: $passDefenders (Direct Pass Active: $isDetailedActive)"
Write-Host "GK Rating: $gkRating"
Write-Host "Active Player OVR: $activePlayerOvr"
Write-Host "Active Opponent OVR (Away): $oppOvrMatch"
Write-Host "Active Diff: $activeDiff"
Write-Host "detailedTacticBonus: $detailedTacticBonus"
Write-Host "suitabilityBonus: $suitabilityBonus"
Write-Host "formationScoreBoost: $formationScoreBoost"
Write-Host "Average Player Chance Bonus: $avgPlayerChanceBonus"
Write-Host "playerDefBonus: $playerDefBonus"
Write-Host "gkBonus: $gkBonus"
Write-Host "--- FINAL MATCH PROBABILITIES ---"
Write-Host "Player Attack Prob: $playerAttackProb"
Write-Host "Player Score Prob: $scoreProb"
Write-Host "Opponent Score Prob: $oppScoreProb"
Write-Host "Player xG: $playerXG"
Write-Host "Opponent xG: $oppXG"
