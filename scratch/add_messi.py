import urllib.request
import json
import re
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

project_id = 'my-family-ab699'
user_id = 'ooks'
fetch_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{user_id}"
patch_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{user_id}?updateMask.fieldPaths=playerDeck"

# 1. Parse player_data.js to load Lionel Messi base stats
player_data_path = "c:/Users/ooks1/OneDrive/바탕 화면/축구카드/player_data.js"
if not os.path.exists(player_data_path):
    print("🔴 player_data.js not found.")
    sys.exit(1)

with open(player_data_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Locate lionel_messi block
match = re.search(r'"lionel_messi"\s*:\s*\{', js_content)
if not match:
    print("🔴 lionel_messi card not found in player_data.js")
    sys.exit(1)

# Basic extract of messi details
messi_card = {
    'id': 'lionel_messi',
    'name': '리오넬 메시',
    'rating': 93,
    'position': 'RW',
    'nation': 'Argentina',
    'nationFlag': 'https://flagcdn.com/w40/ar.png',
    'club': 'INTER MIAMI',
    'image': 'player/메시.png',
    'rarity': 'worldclass',
    'description': '축구 역사상 가장 위대한 선수(G.O.A.T)로 꼽히는 리오넬 메시입니다. 신의 경지에 다다른 플레이메이킹, 경이로운 볼 컨트롤, 그리고 상대 수비를 완전히 무력화시키는 압도적인 시야와 득점력을 지닌 축구계의 살아있는 신화이자 월드클래스 거장입니다.',
    'theme': {
        'primary': '#000a20',
        'secondary': '#4facfe',
        'glow': '#00f2fe'
    },
    'stats': {
        'pac': 86,
        'sho': 91,
        'pas': 92,
        'dri': 94,
        'def': 40,
        'phy': 70
    }
}

# Convert messi_card to Firestore MapValue format
def to_firestore_val(val):
    if isinstance(val, dict):
        return {
            "mapValue": {
                "fields": {k: to_firestore_val(v) for k, v in val.items()}
            }
        }
    elif isinstance(val, int):
        return {"integerValue": str(val)}
    elif isinstance(val, float):
        return {"doubleValue": val}
    elif isinstance(val, str):
        return {"stringValue": val}
    elif isinstance(val, bool):
        return {"booleanValue": val}
    elif val is None:
        return {"nullValue": None}
    elif isinstance(val, list):
        return {
            "arrayValue": {
                "values": [to_firestore_val(item) for item in val]
            }
        }
    return None

messi_firestore_card = {
    "mapValue": {
        "fields": {
            "quantity": {"integerValue": "1"},
            "awakening": {"integerValue": "1"},
            "card": to_firestore_val(messi_card)
        }
    }
}

# 2. Fetch Ooks data
print("2. Fetching current user ooks document...")
try:
    req = urllib.request.Request(fetch_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        doc = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print(f"🔴 Fetch failed: {e}")
    sys.exit(1)

fields = doc.get('fields', {})
player_deck = fields.get('playerDeck', {}).get('mapValue', {}).get('fields', {})

# 3. Add Lionel Messi
print("3. Modifying playerDeck...")
player_deck['lionel_messi'] = messi_firestore_card

# 4. Patch to Firestore
print("4. Patching back to Firestore...")
patch_data = {
    "fields": {
        "playerDeck": {
            "mapValue": {
                "fields": player_deck
            }
        }
    }
}

try:
    data_bytes = json.dumps(patch_data).encode('utf-8')
    req = urllib.request.Request(
        patch_url, 
        data=data_bytes, 
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        },
        method='PATCH'
    )
    with urllib.request.urlopen(req) as response:
        res_json = json.loads(response.read().decode('utf-8'))
        print("🟢 Success! Lionel Messi (5각성, 1장)가 ooks 계정 덱에 추가되었습니다.")
except Exception as e:
    print(f"🔴 PATCH failed: {e}")
    sys.exit(1)
