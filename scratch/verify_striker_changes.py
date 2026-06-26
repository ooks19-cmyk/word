import re
import os

def check_file_contains(filepath, patterns, label):
    print(f"Checking {filepath}...")
    if not os.path.exists(filepath):
        print(f"  [ERROR] File not found: {filepath}")
        return False
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    all_found = True
    for pattern in patterns:
        if isinstance(pattern, tuple):
            pat, name = pattern
        else:
            pat = pattern
            name = pattern
            
        if re.search(pat, content):
            print(f"  [OK] Found: {name}")
        else:
            print(f"  [ERROR] Missing: {name}")
            all_found = False
            
    return all_found

def main():
    success = True
    
    # 1. Endo position verification
    success &= check_file_contains(
        'player_data.js',
        [
            (r'"wataru_endo":\s*\{\s*id:\s*"wataru_endo",\s*name:\s*"엔도 와타루",\s*rating:\s*85,\s*position:\s*"CB"', 'Endo position CB in player_data.js')
        ],
        'Endo player_data.js'
    )
    
    success &= check_file_contains(
        '선수데이터.csv',
        [
            (r'wataru_endo,엔도 와타루,85,CB,Japan', 'Endo position CB in 선수데이터.csv')
        ],
        'Endo 선수데이터.csv'
    )
    
    # 2. state.js verification
    success &= check_file_contains(
        'js/state.js',
        [
            (r'let strikerStyles =', 'strikerStyles state definition'),
            (r'localStorage\.getItem\(\'fc_star_striker_styles\'\)', 'strikerStyles localStorage load')
        ],
        'state.js'
    )
    
    # 3. match_algorithm.js verification
    success &= check_file_contains(
        'js/match_algorithm.js',
        [
            (r'function getStrikerChanceStat\(', 'getStrikerChanceStat function'),
            (r'customStrikerStyles = null', 'getDetailedTacticCommentary signature customStrikerStyles'),
            (r'stCardId && getAwakenedCard\(stCardId, deck\)\.stats && getAwakenedCard\(stCardId, deck\)\.stats\.phy >= 80', '4-3-3 detailed tactic Physical >= 80 check unchanged'),
            (r'detailedTacticLabel = ` \[세부전술: 타겟맨 활성 \(\+5\.0%\)\]`;', '4-3-3 Target Man activation label')
        ],
        'match_algorithm.js'
    )
    
    # 4. squad.js verification
    success &= check_file_contains(
        'js/squad.js',
        [
            (r'strikerStyles\[pos\]', 'strikerStyles check on pitch'),
            (r'strikerStyleToggle', 'strikerStyleToggle input checkbox'),
            (r'function toggleStrikerStyle', 'toggleStrikerStyle handler')
        ],
        'squad.js'
    )
    
    # 5. auth.js verification
    success &= check_file_contains(
        'js/auth.js',
        [
            (r'strikerStyles:\s*typeof\s*strikerStyles', 'strikerStyles in progressData'),
            (r'strikerStyles\s*=\s*userData\.strikerStyles', 'strikerStyles restore on login'),
            (r'localStorage\.setItem\(\'fc_star_striker_styles\'', 'strikerStyles save to localStorage')
        ],
        'auth.js'
    )
    
    # 6. db.js verification
    success &= check_file_contains(
        'db.js',
        [
            (r'strikerStyles: cleanUndefined\(squadData\.strikerStyles', 'strikerStyles in createPvpRoom'),
            (r'strikerStyles: cleanUndefined\(squadData\.strikerStyles', 'strikerStyles in joinPvpRoom'),
            (r'\[`\$\{updateKey\}\.strikerStyles`\]: cleanUndefined\(squadData\.strikerStyles', 'strikerStyles in updatePvpRoomTactic')
        ],
        'db.js'
    )
    
    # 7. realtime.js verification
    success &= check_file_contains(
        'js/realtime.js',
        [
            (r'strikerStyles: strikerStyles', 'strikerStyles in host/guest squadData'),
            (r'attStSho = getStrikerChanceStat\(\'ST\', card, attackerInfo\.strikerStyles\)', 'ST chance stat with strikerStyles in PVP'),
            (r'getDetailedTacticCommentary\(option, attackerInfo\.formation, isTacticActive, activePlayers, attackerInfo\.squad, attackerInfo\.playerDeck, attackerInfo\.wingerStyles, attackerInfo\.strikerStyles\)', 'wingerStyles and strikerStyles passed to getDetailedTacticCommentary')
        ],
        'realtime.js'
    )
    
    # 8. Simulators verification (league, friendly, cup, acl)
    success &= check_file_contains(
        'js/league.js',
        [
            (r'chancePlayerStat = getStrikerChanceStat\(\'ST\', card, strikerStyles\)', 'ST chance stat with strikerStyles'),
            (r'getDetailedTacticCommentary\(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles\)', 'strikerStyles passed to getDetailedTacticCommentary')
        ],
        'league.js'
    )
    
    success &= check_file_contains(
        'js/friendly.js',
        [
            (r'chancePlayerStat = getStrikerChanceStat\(\'ST\', card, strikerStyles\)', 'ST chance stat with strikerStyles'),
            (r'getDetailedTacticCommentary\(selectedOption, currentFormation, isDetailedActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles\)', 'strikerStyles passed to getDetailedTacticCommentary')
        ],
        'friendly.js'
    )
    
    success &= check_file_contains(
        'js/cup.js',
        [
            (r'chancePlayerStat = getStrikerChanceStat\(\'ST\', getAwakenedCard\(stCardId\), strikerStyles\)', 'ST chance stat with strikerStyles'),
            (r'getDetailedTacticCommentary\(selectedOption, currentFormation, isTacticActive, activePlayers, squadFormation, playerDeck, wingerStyles, strikerStyles\)', 'strikerStyles passed to getDetailedTacticCommentary')
        ],
        'cup.js'
    )
    
    success &= check_file_contains(
        'js/acl.js',
        [
            (r'chancePlayerStat = getStrikerChanceStat\(\'ST\', card, strikerStyles\)', 'ST chance stat with strikerStyles'),
            (r'getDetailedTacticCommentary\(option, currentFormation, isDetailedActive, commDataLocal, squadFormation, playerDeck, wingerStyles, strikerStyles\)', 'strikerStyles passed to getDetailedTacticCommentary')
        ],
        'acl.js'
    )
    
    if success:
        print("\n[SUCCESS] All checks passed successfully!")
    else:
        print("\n[FAILURE] Some checks failed. Please check errors above.")

if __name__ == '__main__':
    main()
