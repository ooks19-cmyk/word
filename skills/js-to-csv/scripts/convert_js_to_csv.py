import argparse
import re
import csv
import os

def parse_arguments():
    parser = argparse.ArgumentParser(description="Convert JS array/object literals to Excel-compatible CSV files.")
    parser.add_argument("-i", "--input", required=True, help="Path to the input JavaScript data file (e.g., player_data.js)")
    parser.add_argument("-o", "--output", required=True, help="Path to the output CSV file (e.g., player_data.csv)")
    return parser.parse_args()

def convert_player_data(content, output_path):
    players = []
    current_player = None
    in_stats = False
    in_theme = False
    
    for line in content.splitlines():
        line = line.strip()
        if not line:
            continue
        
        # 신규 선수 객체 시작
        start_match = re.match(r'^"([^"]+)"\s*:\s*\{', line)
        if start_match:
            current_player = {
                'id': '', 'name': '', 'rating': '', 'position': '', 'nation': '',
                'nationFlag': '', 'club': '', 'image': '', 'rarity': '', 'description': '',
                'pac': '', 'sho': '', 'pas': '', 'dri': '', 'def': '', 'phy': ''
            }
            in_stats = False
            in_theme = False
            continue
            
        if current_player is not None:
            # 중첩 구조 감지
            if re.match(r'^stats\s*:\s*\{', line):
                in_stats = True
                continue
            if re.match(r'^theme\s*:\s*\{', line):
                in_theme = True
                continue
                
            # 객체 종료 처리
            if line in ['}', '},', '};']:
                if in_stats:
                    in_stats = False
                elif in_theme:
                    in_theme = False
                else:
                    players.append(current_player)
                    current_player = None
                continue
                
            # 키-값 쌍 매칭
            kv_match = re.match(r'^([a-zA-Z0-9_]+)\s*:\s*(.+)$', line)
            if kv_match:
                key = kv_match.group(1)
                val = kv_match.group(2).strip()
                
                # 끝 쉼표 제거
                if val.endswith(','):
                    val = val[:-1].strip()
                # 앞뒤 따옴표 제거
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                
                if in_stats:
                    if key in current_player:
                        current_player[key] = val
                elif in_theme:
                    pass
                else:
                    if key in current_player:
                        current_player[key] = val

    # UTF-8-SIG 인코딩으로 저장
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', '이름', '레이팅', '포지션', '국적', '국적국기', '클럽', '이미지', '희귀도', '설명', 'PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'])
        for p in players:
            writer.writerow([
                p['id'], p['name'], p['rating'], p['position'], p['nation'],
                p['nationFlag'], p['club'], p['image'], p['rarity'], p['description'],
                p['pac'], p['sho'], p['pas'], p['dri'], p['def'], p['phy']
            ])
    return len(players)

def convert_preset_data(content, output_path):
    # 정규표현식으로 프리셋 데이터 추출
    pattern = r'\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*teamId:\s*"([^"]+)",\s*teamName:\s*"([^"]+)"\s*\}'
    matches = re.findall(pattern, content)
    
    # UTF-8-SIG 인코딩으로 저장
    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ID', '이름', '팀ID', '팀명'])
        for match in matches:
            writer.writerow(match)
    return len(matches)

def main():
    args = parse_arguments()
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found.")
        return
        
    with open(args.input, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "CARDS_DATABASE" in content:
        print(f"Detected Player Card Database. Converting...")
        count = convert_player_data(content, args.output)
        print(f"Successfully converted {count} players to '{args.output}'.")
    elif "OTHER_TEAMS_PLAYERS_PRESET" in content:
        print(f"Detected Other Teams Preset Database. Converting...")
        count = convert_preset_data(content, args.output)
        print(f"Successfully converted {count} presets to '{args.output}'.")
    else:
        print("Error: Unknown data structure in the JavaScript file. Supported structures: 'CARDS_DATABASE', 'OTHER_TEAMS_PLAYERS_PRESET'.")

if __name__ == "__main__":
    main()
