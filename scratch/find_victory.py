import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

files = ["index.html", "app.js", "js/league.js", "js/cup.js", "js/acl.js", "js/friendly.js", "js/match_algorithm.js", "js/pack.js", "js/auth.js"]

for fn in files:
    path = f"c:/Users/ooks1/OneDrive/바탕 화면/축구카드/{fn}"
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # search for keywords related to victory, championship, or showing cards / collect button
    matches = []
    for line_num, line in enumerate(content.split('\n'), 1):
        if "우승" in line or "btnCollect" in line or "collectCard" in line or "showReward" in line or "showVictory" in line or "leagueVictory" in line:
            matches.append((line_num, line.strip()))
            
    if matches:
        print(f"=== Matches in {fn} ===")
        for num, line in matches[:20]:
            print(f"  Line {num}: {line}")
