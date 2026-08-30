import argparse
import urllib.request
import json
import re
import sys
import os
import random

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

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    
    parser = argparse.ArgumentParser(description="FC Star Squad xG Balance Simulator")
    parser.add_argument("-u", "--user", type=str, default="tomy0304", help="Firestore User ID")
    parser.add_argument("-d", "--diff", type=int, default=2, help="Opponent OVR difference relative to player (e.g. 2 for +2 opponent OVR)")
    parser.add_argument("-r", "--runs", type=int, default=100000, help="Number of Monte Carlo simulation runs")
    parser.add_argument("-p", "--project", type=str, default="my-family-ab699", help="Firestore project ID")
    parser.add_argument("-db", "--database", type=str, default="player_data.js", help="Path to player_data.js")
    parser.add_argument("-c", "--compat", action="store_true", help="Apply +5.0 percent formation compatibility bonus")
    
    args = parser.parse_args()
    
    # 1. Fetch user data from Firestore
    url = f"https://firestore.googleapis.com/v1/projects/{args.project}/databases/(default)/documents/fc_star_users/{args.user}"
    print(f"1. Fetching user '{args.user}' data from Firebase (Project: {args.project})...")
    
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
    
    # 2. Parse player database
    if not os.path.exists(args.database):
        print(f"🔴 Player database not found at '{args.database}'.")
        sys.exit(1)
        
    with open(args.database, 'r', encoding='utf-8') as f:
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
            
    print(f"2. Loaded {len(players_dict)} players from '{args.database}'")
    
    # 3. Calculate Awakened stats & squad details
    total_rating = 0
    count = 0
    print("\n3. Active Squad Details:")
    for pos, card_id in squad.items():
        if not card_id or card_id not in players_dict:
            continue
        base_card = players_dict[card_id]
        deck_item = deck.get(card_id, {})
        awakening = int(deck_item.get('awakening', 0))
        awakened_rating = base_card['rating'] + awakening
        print(f" - [{pos}] {base_card['name']} (OVR {base_card['rating']} + {awakening} 각성 -> {awakened_rating})")
        total_rating += awakened_rating
        count += 1
        
    player_ovr = round(total_rating / count) if count > 0 else 70
    print(f"💡 팀 최종 OVR: {player_ovr}")
    
    # Calculate average team stats using TACTICAL_POSITIONS
    TACTICAL_POSITIONS = ["GK", "LB", "LCB", "RCB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"]
    team_avg_stats = {}
    for stat_name in ['pac', 'sho', 'pas', 'dri', 'def', 'phy']:
        total_stat = 0
        for pos in TACTICAL_POSITIONS:
            card_id = squad.get(pos)
            if card_id and card_id in players_dict:
                deck_item = deck.get(card_id, {})
                awk = int(deck_item.get('awakening', 0))
                total_stat += players_dict[card_id]['stats'].get(stat_name, 70) + awk
            else:
                total_stat += 70
        team_avg_stats[stat_name] = round(total_stat / 11)
        
    print("💡 팀 평균 스탯:")
    for k, v in team_avg_stats.items():
        print(f" - {k.upper()}: {v}")
        
    # 4. Tactical Bonuses based on current formation
    detailed_tactic_bonus = 0.0
    detailed_tactic_label = "비활성"
    suitability_bonus = 0.0
    suitability_label = "적합성 없음"
    formation_score_boost = 0.0
    formation_attack_boost = 0.0
    
    if current_formation == '5-4-1':
        # Direct Pass Tactic
        pass_defenders_count = 0
        defenders = ["LB", "LCB", "CM", "RCB", "RB"]
        for pos in defenders:
            card_id = squad.get(pos)
            if card_id and card_id in players_dict:
                deck_item = deck.get(card_id, {})
                awk = int(deck_item.get('awakening', 0))
                card_pos = players_dict[card_id]['position']
                card_pas = players_dict[card_id]['stats'].get('pas', 0) + awk
                if card_pos in ['CB', 'LB', 'RB'] and card_pas >= 80:
                    pass_defenders_count += 1
        if pass_defenders_count >= 1:
            detailed_tactic_bonus = 0.05
            detailed_tactic_label = "다이렉트 패스 활성 (+5.0%)"
            
        avg_def = team_avg_stats.get('def', 70)
        suitability_bonus = max(0.0, (avg_def - 60) * 0.005)
        suitability_label = f"전술적합(DEF): +{suitability_bonus * 100:.1f}%"
        
        # Counterattack Complete
        lw_card_id = squad.get('LW')
        rw_card_id = squad.get('RW')
        lw_pac = 0
        rw_pac = 0
        has_key = False
        if lw_card_id and lw_card_id in players_dict:
            awk = int(deck.get(lw_card_id, {}).get('awakening', 0))
            pac = players_dict[lw_card_id]['stats'].get('pac', 0) + awk
            if pac >= 80:
                has_key = True
                lw_pac = pac
        if rw_card_id and rw_card_id in players_dict:
            awk = int(deck.get(rw_card_id, {}).get('awakening', 0))
            pac = players_dict[rw_card_id]['stats'].get('pac', 0) + awk
            if pac >= 80:
                has_key = True
                rw_pac = pac
        if has_key and avg_def >= 60:
            best_pac = max(lw_pac, rw_pac)
            formation_score_boost = (best_pac - 80) * 0.005
            
    elif current_formation == '4-3-3':
        # Target Man
        st_card_id = squad.get('ST')
        if st_card_id and st_card_id in players_dict:
            awk = int(deck.get(st_card_id, {}).get('awakening', 0))
            phy = players_dict[st_card_id]['stats'].get('phy', 0) + awk
            if phy >= 80:
                detailed_tactic_bonus = 0.05
                detailed_tactic_label = "타겟맨 활성 (+5.0%)"
                
        avg_pas = team_avg_stats.get('pas', 70)
        suitability_bonus = max(0.0, (avg_pas - 70) * 0.005)
        suitability_label = f"전술적합(PAS): +{suitability_bonus * 100:.1f}%"
        
        # Build-up complete
        cm_card_id = squad.get('CM')
        if cm_card_id and cm_card_id in players_dict:
            awk = int(deck.get(cm_card_id, {}).get('awakening', 0))
            cm_pas = players_dict[cm_card_id]['stats'].get('pas', 0) + awk
            if cm_pas >= 80 and avg_pas >= 70:
                formation_attack_boost = (cm_pas - 80) * 0.005
                
    elif current_formation == '3-4-3':
        # Gegenpressing
        fast_count = 0
        for pos in ["LW", "ST", "RW"]:
            card_id = squad.get(pos)
            if card_id and card_id in players_dict:
                awk = int(deck.get(card_id, {}).get('awakening', 0))
                pac = players_dict[card_id]['stats'].get('pac', 0) + awk
                if pac >= 90:
                    fast_count += 1
        if fast_count >= 2:
            detailed_tactic_bonus = 0.05
            detailed_tactic_label = "전방압박 활성 (+5.0%)"
            
        avg_pac = team_avg_stats.get('pac', 70)
        suitability_bonus = max(0.0, (avg_pac - 70) * 0.005)
        suitability_label = f"전술적합(PAC): +{suitability_bonus * 100:.1f}%"
        
        # Switching complete
        cm_card_id = squad.get('CM')
        if cm_card_id and cm_card_id in players_dict:
            awk = int(deck.get(cm_card_id, {}).get('awakening', 0))
            cm_dri = players_dict[cm_card_id]['stats'].get('dri', 0) + awk
            if cm_dri >= 80 and avg_pac >= 70:
                formation_attack_boost = (cm_dri - 80) * 0.005
                
    elif current_formation == '4-2-3-1':
        # Tiki-Taka
        pass_mid = 0
        for pos in ["LCM", "CM", "RCM"]:
            card_id = squad.get(pos)
            if card_id and card_id in players_dict:
                awk = int(deck.get(card_id, {}).get('awakening', 0))
                pas = players_dict[card_id]['stats'].get('pas', 0) + awk
                if pas >= 83:
                    pass_mid += 1
        if pass_mid == 3:
            detailed_tactic_bonus = 0.05
            detailed_tactic_label = "티키타카 활성 (+5.0%)"
            
        avg_dri = team_avg_stats.get('dri', 70)
        suitability_bonus = max(0.0, (avg_dri - 70) * 0.005)
        suitability_label = f"전술적합(DRI): +{suitability_bonus * 100:.1f}%"
        
        # Possession complete
        cm_card_id = squad.get('CM')
        if cm_card_id and cm_card_id in players_dict:
            awk = int(deck.get(cm_card_id, {}).get('awakening', 0))
            cm_dri = players_dict[cm_card_id]['stats'].get('dri', 0) + awk
            if cm_dri >= 80 and avg_dri >= 70:
                formation_attack_boost = (cm_dri - 80) * 0.005
                
    print(f"\n💡 전술 적용 상태:")
    print(f" - 세부 전술: {detailed_tactic_label} (Bonus: +{detailed_tactic_bonus * 100:.1f}%)")
    print(f" - 전술 적합: {suitability_label} (Bonus: +{suitability_bonus * 100:.1f}%)")
    print(f" - 포메이션 공격 확률 부스트: +{formation_attack_boost * 100:.1f}%")
    print(f" - 포메이션 득점 확률 부스트: +{formation_score_boost * 100:.1f}%")
    
    # 5. Simulation Setup
    opponent_ovr = player_ovr + args.diff
    diff_val = -args.diff # diff is playerOvr - oppOvr = -args.diff
    
    # Precalculate player shot stats per option
    opt_stats = []
    # Option 0 (LW)
    lw_card_id = squad.get('LW')
    if lw_card_id and lw_card_id in players_dict:
        awk = int(deck.get(lw_card_id, {}).get('awakening', 0))
        card = players_dict[lw_card_id]
        opt_stats.append(round(((card['stats'].get('dri', 75) + awk) + (card['stats'].get('sho', 75) + awk)) / 2))
    else:
        opt_stats.append(75)
        
    # Option 1 (ST)
    st_card_id = squad.get('ST')
    if st_card_id and st_card_id in players_dict:
        awk = int(deck.get(st_card_id, {}).get('awakening', 0))
        opt_stats.append(players_dict[st_card_id]['stats'].get('sho', 75) + awk)
    else:
        opt_stats.append(75)
        
    # Option 2 (RW)
    rw_card_id = squad.get('RW')
    if rw_card_id and rw_card_id in players_dict:
        awk = int(deck.get(rw_card_id, {}).get('awakening', 0))
        card = players_dict[rw_card_id]
        opt_stats.append(round(((card['stats'].get('pac', 75) + awk) + (card['stats'].get('sho', 75) + awk)) / 2))
    else:
        opt_stats.append(75)
        
    # Option 5 (AM/CM for 4-2-3-1)
    if current_formation == '4-2-3-1':
        cm_card_id = squad.get('CM')
        if cm_card_id and cm_card_id in players_dict:
            awk = int(deck.get(cm_card_id, {}).get('awakening', 0))
            opt_stats.append(players_dict[cm_card_id]['stats'].get('dri', 75) + awk)
        else:
            opt_stats.append(75)
            
    gk_card_id = squad.get('GK')
    if gk_card_id and gk_card_id in players_dict:
        awk = int(deck.get(gk_card_id, {}).get('awakening', 0))
        player_gk_stat = players_dict[gk_card_id]['stats'].get('def', 70) + awk
    else:
        player_gk_stat = 70
        
    # Monte Carlo simulation
    total_p_goals = 0
    total_o_goals = 0
    p_wins = 0
    o_wins = 0
    draws = 0
    
    for _ in range(args.runs):
        p_goals = 0
        o_goals = 0
        active_diff = diff_val
        
        for _ in range(5):
            # Special events (4%)
            if random.random() < 0.04:
                s_rand = random.random()
                if s_rand < 0.50: # PK player (50% probability)
                    if random.random() < 0.80:
                        p_goals += 1
                else: # PK opponent (50% probability)
                    if random.random() < 0.75:
                        o_goals += 1
            else:
                # Calculate playerAttackProb
                p_attack_prob = 0.40 + (active_diff * 0.019) + formation_attack_boost + suitability_bonus + detailed_tactic_bonus
                if args.compat:
                    p_attack_prob += 0.05
                p_attack_prob = min(0.80, max(0.20, p_attack_prob))
                
                if random.random() < p_attack_prob:
                    # Player Attack
                    chance_player_stat = random.choice(opt_stats)
                    player_chance_bonus = max(0.0, (chance_player_stat - opponent_ovr) * 0.01)
                    score_prob = 0.24 + (active_diff * 0.019) + formation_score_boost + player_chance_bonus + suitability_bonus
                    score_prob = min(0.50, max(0.10, score_prob))
                    if random.random() < score_prob:
                        p_goals += 1
                else:
                    # Opponent Attack
                    player_def_bonus = max(0.0, (team_avg_stats['def'] - 70) * 0.01)
                    gk_bonus = (player_gk_stat + 5 - opponent_ovr) * 0.01
                    opp_score_prob = 0.40 - (active_diff * 0.026) - player_def_bonus - gk_bonus
                    opp_score_prob = min(0.50, max(0.10, opp_score_prob))
                    if random.random() < opp_score_prob:
                        o_goals += 1
                        
        total_p_goals += p_goals
        total_o_goals += o_goals
        if p_goals > o_goals:
            p_wins += 1
        elif p_goals < o_goals:
            o_wins += 1
        else:
            draws += 1
            
    # Print Results
    print(f"\n🛡️ 시뮬레이션 결과 (상대 OVR: {opponent_ovr}, 격차: {diff_val}, 실행 횟수: {args.runs:,}):")
    print(f" - 나의 팀 평균 득점 (xG): {total_p_goals / args.runs:.3f} 골")
    print(f" - 상대 팀 평균 득점 (xG): {total_o_goals / args.runs:.3f} 골")
    print(f" - 승률 분포:")
    print(f"   * 나의 팀 승리: {p_wins / args.runs * 100:.2f}%")
    print(f"   * 무승부: {draws / args.runs * 100:.2f}%")
    print(f"   * 상대 팀 승리: {o_wins / args.runs * 100:.2f}%")

if __name__ == '__main__':
    main()
