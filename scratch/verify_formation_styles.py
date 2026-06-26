import re
import os

def check_file_contains(filepath, patterns):
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
    
    # 1. state.js verification
    success &= check_file_contains(
        'js/state.js',
        [
            (r'\'4-4-2\': \{\s*LW:\s*\'dribble\',\s*RW:\s*\'sprint\'\s*\}', 'Nested wingerStyles initialization'),
            (r'parsed\.LW \|\| parsed\.RW', 'Legacy wingerStyles migration check'),
            (r'\'4-4-2\': \{\s*ST:\s*\'targetman\'\s*\}', 'Nested strikerStyles initialization'),
            (r'parsed\.ST', 'Legacy strikerStyles migration check')
        ]
    )
    
    # 2. match_algorithm.js verification
    success &= check_file_contains(
        'js/match_algorithm.js',
        [
            (r'wingerStyles\[currentFormation\] \|\| wingerStyles', 'getWingerChanceStat fallback to currentFormation'),
            (r'strikerStyles\[currentFormation\] \|\| strikerStyles', 'getStrikerChanceStat fallback to currentFormation'),
            (r'wingerStyles\[formation\] \|\| wingerStyles', 'getDetailedTacticCommentary wingerStyles lookup'),
            (r'strikerStyles\[formation\] \|\| strikerStyles', 'getDetailedTacticCommentary strikerStyles lookup')
        ]
    )
    
    # 3. squad.js verification
    success &= check_file_contains(
        'js/squad.js',
        [
            (r'wingerStyles\[currentFormation\]', 'Pitch badge wingerStyles lookup'),
            (r'strikerStyles\[currentFormation\]', 'Pitch badge strikerStyles lookup'),
            (r'wingerStyles\[currentFormation\]', 'Slot details wingerStyles lookup'),
            (r'strikerStyles\[currentFormation\]', 'Slot details strikerStyles lookup'),
            (r'wingerStyles\[currentFormation\]\[position\]\s*=\s*isChecked', 'toggleWingerStyle write'),
            (r'strikerStyles\[currentFormation\]\[position\]\s*=\s*isChecked', 'toggleStrikerStyle write')
        ]
    )
    
    # 4. auth.js verification
    success &= check_file_contains(
        'js/auth.js',
        [
            (r'const parsedWingers = userData\.wingerStyles', 'syncUserDataOnLogin wingerStyles restore'),
            (r'wingerStyles = parsedWingers;', 'syncUserDataOnLogin wingerStyles assignment'),
            (r'const parsedStrikers = userData\.strikerStyles', 'syncUserDataOnLogin strikerStyles restore'),
            (r'strikerStyles = parsedStrikers;', 'syncUserDataOnLogin strikerStyles assignment')
        ]
    )
    
    # 5. realtime.js verification
    success &= check_file_contains(
        'js/realtime.js',
        [
            (r'wingerStyles: wingerStyles\[currentFormation\]', 'Host wingerStyles flat export'),
            (r'strikerStyles: strikerStyles\[currentFormation\]', 'Host strikerStyles flat export'),
            (r'wingerStyles: wingerStyles\[currentFormation\]', 'Guest wingerStyles flat export'),
            (r'strikerStyles: strikerStyles\[currentFormation\]', 'Guest strikerStyles flat export'),
            (r'wingerStyles: wingerStyles\[formationName\]', 'Tactics change wingerStyles flat export'),
            (r'strikerStyles: strikerStyles\[formationName\]', 'Tactics change strikerStyles flat export')
        ]
    )
    
    if success:
        print("\n[SUCCESS] Per-formation playstyle configurations validation passed successfully!")
    else:
        print("\n[FAILURE] Validation failed.")

if __name__ == '__main__':
    main()
