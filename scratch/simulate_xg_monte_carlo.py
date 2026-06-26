import urllib.request
import json
import re
import sys
import os
import random

# Set console output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# 1. Fetch user data from Firestore
project_id = 'my-family-ab699'
user_id = 'tomy0304'
url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{user_id}"

def decode_firestore_val(val_dict):
    for k, v in val_dict.items():
        if k == 'stringValue':
            return v
        elif k == 'integerValue':
            return int(v)
        elif k == 'doubleValue':
            return float(v)
        elif k == 'booleanValue':
            return v
        elif k == 'nullValue':
            return None
        elif k == 'mapValue':
            return {mk: decode_firestore_val(mv) for mk, mv in v.get('fields', {}).items()}
        elif k == 'arrayValue':
            return [decode_firestore_val(item) for item in v.get('values', [])]
    return None

print("1. Fetching tomy0304 user data from Firebase...")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        res_json = json.loads(response.read().decode('utf-8'))
        user_data = {k: decode_firestore_val(v) for k, v in res_json['fields'].items()}
except Exception as e:
    print(f"🔴 Firestore fetch failed: {e}")
    sys.exit(1)

squad = user_data.get('squadFormation', {})
deck = user_data.get('playerDeck', {})
current_formation = user_data.get('currentFormation', '5-4-1')

print(f" - Active Formation: {current_formation}")

# 2. Parse player_data.js
player_data_path = "c:/Users/ooks1/OneDrive/바탕 화면/축구카드/player_data.js"
if not os.path.exists(player_data_path):
    print("🔴 player_data.js not found.")
    sys.exit(1)

with open(player_data_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

players_dict = {}
pattern = r'"([a-zA-Z0-9_]+)"\s*:\s*\{'
matches = list(re.finditer(pattern, js_content))

for i, m in enumerate(matches):
    card_key = m.group(1)
    start_pos = m.end()
    end_pos = matches[i+1].start() if i+1 < len(matches) else len(js_content)
    card_body = js_content[start_pos:end_pos]
    
    name_m = re.search(r'name:\s*"([^"]+)"', card_body)
    rating_m = re.search(r'rating:\s*([0-9]+)', card_body)
    pos_m = re.search(r'position:\s*"([^"]+)"', card_body)
    rarity_m = re.search(r'rarity:\s*"([^"]+)"', card_body)
    
    stats_body_m = re.search(r'stats:\s*\{([^}]+)\}', card_body)
    stats = {}
    if stats_body_m:
        stats_body = stats_body_m.group(1)
        for stat_name in ['pac', 'sho', 'pas', 'dri', 'def', 'phy']:
            stat_val_m = re.search(fr'{stat_name}:\s*([0-9]+)', stats_body)
            if stat_val_m:
                stats[stat_name] = int(stat_val_m.group(1))

    if name_m and rating_m and pos_m:
        players_dict[card_key] = {
            'id': card_key,
            'name': name_m.group(1),
            'rating': int(rating_m.group(1)),
            'position': pos_m.group(1),
            'rarity': rarity_m.group(1) if rarity_m else 'normal',
            'stats': stats
        }

print(f"2. Loaded {len(players_dict)} players from player_data.js")

# 3. Calculate Awakened stats
squad_cards = {}
total_rating = 0
count = 0
avg_stats_sums = {'pac': 0, 'sho': 0, 'pas': 0, 'dri': 0, 'def': 0, 'phy': 0}

for pos, card_id in squad.items():
    if not card_id or card_id not in players_dict:
        continue
    base_card = players_dict[card_id]
    deck_item = deck.get(card_id, {})
    awakening = int(deck_item.get('awakening', 0))
    
    awakened_rating = base_card['rating'] + awakening
    awakened_stats = {k: v + awakening for k, v in base_card['stats'].items()}
    
    squad_cards[pos] = {
        'name': base_card['name'],
        'position': base_card['position'],
        'base_rating': base_card['rating'],
        'awakened_rating': awakened_rating,
        'stats': awakened_stats,
        'awakening': awakening
    }
    
    total_rating += awakened_rating
    count += 1
    for k, v in awakened_stats.items():
        avg_stats_sums[k] += v

player_ovr = round(total_rating / count) if count > 0 else 70
print(f"💡 전북 현대 (tomy0304) 최종 OVR: {player_ovr}")

# Calculate average team stats using the exact formula from utils.js
# Note: utils.js getTeamAverageStat sums the stats of starting TACTICAL_POSITIONS
TACTICAL_POSITIONS = ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"]
team_avg_stats = {}
for stat_name in ['pac', 'sho', 'pas', 'dri', 'def', 'phy']:
    total_stat = 0
    for pos in TACTICAL_POSITIONS:
        card_id = squad.get(pos)
        if card_id and card_id in players_dict:
            # get awakened stats
            deck_item = deck.get(card_id, {})
            awk = int(deck_item.get('awakening', 0))
            stat_val = players_dict[card_id]['stats'].get(stat_name, 70) + awk
            total_stat += stat_val
        else:
            total_stat += 70
    team_avg_stats[stat_name] = round(total_stat / 11)

print("💡 팀 평균 스탯:")
for k, v in team_avg_stats.items():
    print(f" - {k.upper()}: {v}")

# 4. Check Playstyle and Suitability
detailed_tactic_bonus = 0.0
detailed_tactic_label = "세부 전술 비활성"
suitability_bonus = 0.0
suitability_label = "전술 적합성 없음"

if current_formation == '5-4-1':
    # Direct Pass Tactic:
    # Requires at least 1 defender (CB, LB, RB) with PAS >= 80
    pass_defenders_count = 0
    defenders = ["LB", "LCB", "CM", "RCB", "RB"] # defenders defined in match_algorithm.js for 5-4-1
    for pos in defenders:
        card_id = squad.get(pos)
        if card_id and card_id in players_dict:
            deck_item = deck.get(card_id, {})
            awk = int(deck_item.get('awakening', 0))
            card_pos = players_dict[card_id]['position']
            card_pas = players_dict[card_id]['stats'].get('pas', 0) + awk
            is_real_defender = card_pos in ['CB', 'LB', 'RB']
            if is_real_defender and card_pas >= 80:
                pass_defenders_count += 1
    
    if pass_defenders_count >= 1:
        detailed_tactic_bonus = 0.05
        detailed_tactic_label = "다이렉트 패스 활성 (+5.0%)"
        
    avg_def = team_avg_stats.get('def', 70)
    suitability_bonus = max(0.0, (avg_def - 60) * 0.005)
    suitability_label = f"전술적합(DEF): +{suitability_bonus * 100:.1f}%"

# Calculate formation Score Boost (5-4-1 Counterattack completed)
formation_score_boost = 0.0
formation_attack_boost = 0.0
has_key_player = False
has_team_tactic = False

lw_card_id = squad.get('LW')
rw_card_id = squad.get('RW')
lw_pac = 0
rw_pac = 0

if lw_card_id and lw_card_id in players_dict:
    deck_item = deck.get(lw_card_id, {})
    awk = int(deck_item.get('awakening', 0))
    pac = players_dict[lw_card_id]['stats'].get('pac', 0) + awk
    if pac >= 80:
        has_key_player = True
        lw_pac = pac

if rw_card_id and rw_card_id in players_dict:
    deck_item = deck.get(rw_card_id, {})
    awk = int(deck_item.get('awakening', 0))
    pac = players_dict[rw_card_id]['stats'].get('pac', 0) + awk
    if pac >= 80:
        has_key_player = True
        rw_pac = pac

avg_def = team_avg_stats.get('def', 70)
has_team_tactic = avg_def >= 60

if has_key_player and has_team_tactic:
    best_pac = max(lw_pac, rw_pac)
    formation_score_boost = (best_pac - 80) * 0.005

print(f"\n💡 전술 보너스 분석:")
print(f" - 세부 전술: {detailed_tactic_label} (Bonus: +{detailed_tactic_bonus * 100:.1f}%)")
print(f" - 전술 적합: {suitability_label} (Bonus: +{suitability_bonus * 100:.1f}%)")
print(f" - 포메이션 득점 보스트 (5-4-1 역습 완성): +{formation_score_boost * 100:.1f}%")

# Setup opponent details
opponent_ovr = player_ovr + 2
diff = player_ovr - opponent_ovr # -2

print(f"\n🛡️ 기대 득점 (Expected Goals - xG) 밸런스 테스트:")
print(f" - 상대팀 OVR: {opponent_ovr}")
print(f" - OVR 차이 (Diff): {diff}")

# Setup Monte Carlo Simulation
sim_runs = 100000
total_player_goals = 0
total_opponent_goals = 0
player_wins = 0
opponent_wins = 0
draws = 0

# Stat for GK and shooter
gk_card_id = squad.get('GK')
if gk_card_id and gk_card_id in players_dict:
    deck_item = deck.get(gk_card_id, {})
    awk = int(deck_item.get('awakening', 0))
    player_gk_stat = players_dict[gk_card_id]['stats'].get('def', 70) + awk
else:
    player_gk_stat = 70

st_card_id = squad.get('ST')
st_sho = 75
if st_card_id and st_card_id in players_dict:
    deck_item = deck.get(st_card_id, {})
    awk = int(deck_item.get('awakening', 0))
    st_sho = players_dict[st_card_id]['stats'].get('sho', 75) + awk

# Precalculate shooter stats per option
# Option 0 (LW):
lw_card_id = squad.get('LW')
if lw_card_id and lw_card_id in players_dict:
    deck_item = deck.get(lw_card_id, {})
    awk = int(deck_item.get('awakening', 0))
    lw_card = players_dict[lw_card_id]
    lw_dri = lw_card['stats'].get('dri', 75) + awk
    lw_sho = lw_card['stats'].get('sho', 75) + awk
    opt_0_stat = round((lw_dri + lw_sho) / 2)
else:
    opt_0_stat = 75

# Option 1 (ST):
opt_1_stat = st_sho

# Option 2 (RW):
rw_card_id = squad.get('RW')
if rw_card_id and rw_card_id in players_dict:
    deck_item = deck.get(rw_card_id, {})
    awk = int(deck_item.get('awakening', 0))
    rw_card = players_dict[rw_card_id]
    rw_pac = rw_card['stats'].get('pac', 75) + awk
    rw_sho = rw_card['stats'].get('sho', 75) + awk
    opt_2_stat = round((rw_pac + rw_sho) / 2)
else:
    opt_2_stat = 75

option_stats = [opt_0_stat, opt_1_stat, opt_2_stat]

# We will run simulation runs
for _ in range(sim_runs):
    player_goals = 0
    opponent_goals = 0
    
    # Track OVR differences that can be modified by red cards
    active_diff = diff
    
    # 5 event minutes: [15, 45, 63, 82, 88]
    for _ in range(5):
        # 1. Roll special event (4% chance)
        if random.random() < 0.04:
            s_rand = random.random()
            if s_rand < 0.25: # pk_player (80% success)
                if random.random() < 0.80:
                    player_goals += 1
            elif s_rand < 0.50: # pk_opponent (75% success)
                if random.random() < 0.75:
                    opponent_goals += 1
            elif s_rand < 0.75: # red_opponent
                active_diff += 5
            else: # red_player
                active_diff -= 5
        else:
            # Recalculate playerAttackProb using modified active_diff
            player_attack_prob = 0.40 + (active_diff * 0.019) + formation_attack_boost + suitability_bonus + detailed_tactic_bonus
            player_attack_prob = min(0.80, max(0.20, player_attack_prob))
            
            if random.random() < player_attack_prob:
                # Player attack
                selected_option = random.choice([0, 1, 2])
                chance_player_stat = option_stats[selected_option]
                
                # scoreProb calculation
                player_chance_bonus = max(0.0, (chance_player_stat - opponent_ovr) * 0.01)
                score_prob = 0.24 + (active_diff * 0.019) + formation_score_boost + player_chance_bonus + suitability_bonus
                score_prob = min(0.50, max(0.10, score_prob))
                
                if random.random() < score_prob:
                    player_goals += 1
            else:
                # Opponent attack
                # oppScoreProb calculation
                player_def_bonus = max(0.0, (team_avg_stats['def'] - 70) * 0.01)
                gk_bonus = (player_gk_stat + 5 - opponent_ovr) * 0.01
                opp_score_prob = 0.40 - (active_diff * 0.026) - player_def_bonus - gk_bonus
                opp_score_prob = min(0.50, max(0.10, opp_score_prob))
                
                if random.random() < opp_score_prob:
                    opponent_goals += 1
                    
    total_player_goals += player_goals
    total_opponent_goals += opponent_goals
    
    if player_goals > opponent_goals:
        player_wins += 1
    elif player_goals < opponent_goals:
        opponent_wins += 1
    else:
        draws += 1

# 5. Compute mathematical expected values (assuming no red cards / special events for simplicity)
base_player_attack_prob = 0.40 + (diff * 0.019) + formation_attack_boost + suitability_bonus + detailed_tactic_bonus
base_player_attack_prob = min(0.80, max(0.20, base_player_attack_prob))

opt_probs = []
for chance_player_stat in option_stats:
    player_chance_bonus = max(0.0, (chance_player_stat - opponent_ovr) * 0.01)
    sp = 0.24 + (diff * 0.019) + formation_score_boost + player_chance_bonus + suitability_bonus
    sp = min(0.50, max(0.10, sp))
    opt_probs.append(sp)
avg_score_prob = sum(opt_probs) / 3.0

player_def_bonus = max(0.0, (team_avg_stats['def'] - 70) * 0.01)
gk_bonus = (player_gk_stat + 5 - opponent_ovr) * 0.01
base_opp_score_prob = 0.40 - (diff * 0.026) - player_def_bonus - gk_bonus
base_opp_score_prob = min(0.50, max(0.10, base_opp_score_prob))

# xG over 5 normal chances
math_player_xg = 5.0 * base_player_attack_prob * avg_score_prob
math_opponent_xg = 5.0 * (1.0 - base_player_attack_prob) * base_opp_score_prob

print("\n--- 📊 [1] 수학적 이론 기대값 (스페셜 이벤트 제외, 5회 찬스 기준) ---")
print(f" - 전북 현대 공격 찬스 확률: {base_player_attack_prob * 100:.2f}%")
print(f" - 전북 현대 평균 슈팅 성공 확률: {avg_score_prob * 100:.2f}%")
print(f"   * 옵션 0 (LW) 성공 확률: {opt_probs[0]*100:.2f}% (스탯: {opt_0_stat})")
print(f"   * 옵션 1 (ST) 성공 확률: {opt_probs[1]*100:.2f}% (스탯: {opt_1_stat})")
print(f"   * 옵션 2 (RW) 성공 확률: {opt_probs[2]*100:.2f}% (스탯: {opt_2_stat})")
print(f" - 🚨 전북 현대 이론 xG: {math_player_xg:.3f} 골")
print(f" - 상대팀 공격 찬스 확률: {(1.0 - base_player_attack_prob) * 100:.2f}%")
print(f" - 상대팀 슈팅 성공 확률: {base_opp_score_prob * 100:.2f}%")
print(f" - 🚨 상대팀 이론 xG: {math_opponent_xg:.3f} 골")

print(f"\n--- 🎲 [2] 몬테카를로 시뮬레이션 결과 ({sim_runs:,}회 시뮬레이션) ---")
print(f" - 🚨 전북 현대 평균 득점 (xG): {total_player_goals / sim_runs:.3f} 골")
print(f" - 🚨 상대팀 평균 득점 (xG): {total_opponent_goals / sim_runs:.3f} 골")
print(f" - 승률 예측:")
print(f"   * 전북 현대 승리: {player_wins / sim_runs * 100:.2f}%")
print(f"   * 무승부: {draws / sim_runs * 100:.2f}%")
print(f"   * 상대팀 승리: {opponent_wins / sim_runs * 100:.2f}%")
