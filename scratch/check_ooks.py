import urllib.request
import json
import sys

# Set console output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

project_id = 'my-family-ab699'
user_id = 'ooks'
url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{user_id}"

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        res_json = json.loads(response.read().decode('utf-8'))
        fields = res_json.get('fields', {})
        playerDeck = fields.get('playerDeck', {}).get('mapValue', {}).get('fields', {})
        print("First 5 deck items:")
        keys = list(playerDeck.keys())[:5]
        for key in keys:
            print(f"Card ID: {key}")
            print(json.dumps(playerDeck[key], indent=2, ensure_ascii=False))
except Exception as e:
    print(f"🔴 Firestore fetch failed: {e}")
