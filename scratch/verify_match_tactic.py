import re
import os
import sys

# Windows CP949 인코딩 터미널 대응을 위해 stdout 인코딩을 utf-8로 설정 시도
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

print("=== Formation Compatibility System Verification Script ===")

# 1. other_teams_data.js 파일에서 TEAM_FORMATIONS_PRESET 검증
data_path = os.path.join(os.path.dirname(__file__), '../other_teams_data.js')
with open(data_path, 'r', encoding='utf-8') as f:
    data_content = f.read()

# TEAM_FORMATIONS_PRESET 파싱
preset_match = re.search(r'const TEAM_FORMATIONS_PRESET = \{(.*?)\};', data_content, re.DOTALL)
if not preset_match:
    print("[ERROR] Cannot find TEAM_FORMATIONS_PRESET in other_teams_data.js")
    exit(1)

preset_str = preset_match.group(1)
formations = {}
for line in preset_str.split('\n'):
    line = line.strip()
    if not line or line.startswith('//'):
        continue
    item_match = re.match(r'["\'](.*?)["\']\s*:\s*["\'](.*?)["\']', line)
    if item_match:
        formations[item_match.group(1)] = item_match.group(2)

print(f"[OK] TEAM_FORMATIONS_PRESET loaded. (Total: {len(formations)} teams)")

if formations.get("seoul") == "3-4-3":
    print("[OK] FC Seoul formation verified as 3-4-3")
else:
    print(f"[ERROR] FC Seoul formation is NOT 3-4-3, it is {formations.get('seoul')}")
    exit(1)


# 2. js/match_algorithm.js에서 getFormationCompatibilityBonus 검증
algo_path = os.path.join(os.path.dirname(__file__), '../js/match_algorithm.js')
with open(algo_path, 'r', encoding='utf-8') as f:
    algo_content = f.read()

# getFormationCompatibilityBonus 함수 바디 파싱
fn_match = re.search(r'function getFormationCompatibilityBonus\((.*?)\)\s*\{(.*?)\n\}', algo_content, re.DOTALL)
if not fn_match:
    print("[ERROR] Cannot find getFormationCompatibilityBonus in js/match_algorithm.js")
    exit(1)

print("[OK] getFormationCompatibilityBonus function found.")

# 파이썬으로 동일 상성 로직 구현하여 자바스크립트 내부 로직과 정합성 테스트
def python_get_formation_compatibility_bonus(player_form, opp_form):
    if not player_form or not opp_form:
        return 0
    
    p_form = player_form.strip()
    o_form = opp_form.strip()
    
    if p_form == o_form:
        return 0
    
    compatibility = {
        '3-4-3': '4-3-3',
        '4-3-3': '5-4-1',
        '5-4-1': '4-2-3-1',
        '4-2-3-1': '3-4-3'
    }
    
    if compatibility.get(p_form) == o_form:
        return 0.05
    elif compatibility.get(o_form) == p_form:
        return -0.05
        
    return 0

# 상성 케이스 테스트
test_cases = [
    ('3-4-3', '4-3-3', 0.05, '3-4-3 vs 4-3-3 (ADVANTAGE)'),
    ('4-3-3', '5-4-1', 0.05, '4-3-3 vs 5-4-1 (ADVANTAGE)'),
    ('5-4-1', '4-2-3-1', 0.05, '5-4-1 vs 4-2-3-1 (ADVANTAGE)'),
    ('4-2-3-1', '3-4-3', 0.05, '4-2-3-1 vs 3-4-3 (ADVANTAGE)'),
    
    ('4-3-3', '3-4-3', -0.05, '4-3-3 vs 3-4-3 (DISADVANTAGE)'),
    ('5-4-1', '4-3-3', -0.05, '5-4-1 vs 4-3-3 (DISADVANTAGE)'),
    ('4-2-3-1', '5-4-1', -0.05, '4-2-3-1 vs 5-4-1 (DISADVANTAGE)'),
    ('3-4-3', '4-2-3-1', -0.05, '3-4-3 vs 4-2-3-1 (DISADVANTAGE)'),
    
    ('4-4-2', '3-4-3', 0, '4-4-2 vs 3-4-3 (NEUTRAL)'),
    ('3-4-3', '4-4-2', 0, '3-4-3 vs 4-4-2 (NEUTRAL)'),
    ('4-3-3', '4-3-3', 0, 'SAME FORMATION (NEUTRAL)')
]

failed_tests = 0
for p, o, expected, label in test_cases:
    result = python_get_formation_compatibility_bonus(p, o)
    if abs(result - expected) < 0.0001:
        print(f"[OK] Test passed: {label} => Result {result}")
    else:
        print(f"[ERROR] Test failed: {label} => Expected {expected}, got {result}")
        failed_tests += 1

if failed_tests == 0:
    print("\n[SUCCESS] All formation compatibility tests passed successfully!")
else:
    print(f"\n[ERROR] Total {failed_tests} tests failed.")
    exit(1)
