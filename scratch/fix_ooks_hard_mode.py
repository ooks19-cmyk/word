import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

project_id = "my-family-ab699"
document_id = "ooks"
url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{document_id}"

# 1. Fetch current raw Firestore document
print("Step 1: Fetching current Firestore document...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        doc = json.loads(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error fetching document: {e}")
    sys.exit(1)

fields = doc.get("fields", {})

# 2. Modify isHardMode to True
fields["isHardMode"] = {"booleanValue": True}

# 3. Modify userPoints (current points + 10 FP)
current_points = int(fields.get("userPoints", {}).get("integerValue", "0"))
new_points = current_points + 10
fields["userPoints"] = {"integerValue": str(new_points)}
print(f"Points updated: {current_points} -> {new_points}")

# 4. Reset league round
fields["leagueRound"] = {"integerValue": "1"}

# 5. Filter playerDeck
original_deck = fields.get("playerDeck", {}).get("mapValue", {}).get("fields", {})
new_deck_fields = {}
allowed_keys = ["son_heung_min", "ki_sung_yueng", "kim_min_jae"]

for key in allowed_keys:
    if key in original_deck:
        card_entry = original_deck[key].get("mapValue", {}).get("fields", {})
        # Set awakening
        if key == "son_heung_min":
            card_entry["awakening"] = {"integerValue": "6"}
        elif key in ["ki_sung_yueng", "kim_min_jae"]:
            card_entry["awakening"] = {"integerValue": "5"}
        
        # Ensure quantity is 1
        card_entry["quantity"] = {"integerValue": "1"}
        
        new_deck_fields[key] = {
            "mapValue": {
                "fields": card_entry
            }
        }
    else:
        # If card is not in original deck (which shouldn't happen, but let's check)
        print(f"Warning: {key} not found in original deck!")

fields["playerDeck"] = {
    "mapValue": {
        "fields": new_deck_fields
    }
}
print("Player deck filtered to Son Heung-min (6각성), Ki Sung-yueng (5강), Kim Min-jae (5강).")

# 6. Filter squadFormation
original_squad = fields.get("squadFormation", {}).get("mapValue", {}).get("fields", {})
new_squad_fields = {}

# We place the three players into their positions
# son_heung_min -> LW
# ki_sung_yueng -> CM
# kim_min_jae -> RCB (as CB role)
new_squad_fields["LW"] = {"stringValue": "son_heung_min"}
new_squad_fields["CM"] = {"stringValue": "ki_sung_yueng"}
new_squad_fields["RCB"] = {"stringValue": "kim_min_jae"}

fields["squadFormation"] = {
    "mapValue": {
        "fields": new_squad_fields
    }
}
print("squadFormation updated.")

# 7. Filter squadFormations
original_squads = fields.get("squadFormations", {}).get("mapValue", {}).get("fields", {})
new_squads_fields = {}

for form_key, form_val in original_squads.items():
    form_fields = form_val.get("mapValue", {}).get("fields", {})
    new_form_fields = {}
    for pos, player_id_val in form_fields.items():
        player_id = player_id_val.get("stringValue")
        if player_id in allowed_keys:
            new_form_fields[pos] = player_id_val
            
    new_squads_fields[form_key] = {
        "mapValue": {
            "fields": new_form_fields
        }
    }

fields["squadFormations"] = {
    "mapValue": {
        "fields": new_squads_fields
    }
}
print("squadFormations updated.")

# 8. Reset leagueTeams
fields["leagueTeams"] = {
    "arrayValue": {
        "values": []
    }
}

# 9. Send PATCH request to update the document in Firestore
print("Step 9: Sending PATCH request to update Firestore...")
payload = {
    "fields": fields
}
json_payload = json.dumps(payload).encode('utf-8')

# Note: We must specify updateMask for each field we want to update/overwrite.
# If we want to replace the whole document's fields, we specify updateMask for all the top-level fields in our document.
# The fields we want to update are: isHardMode, userPoints, leagueRound, playerDeck, squadFormation, squadFormations, leagueTeams
update_fields = [
    "isHardMode", "userPoints", "leagueRound", "playerDeck", "squadFormation", "squadFormations", "leagueTeams"
]
mask_params = "&".join([f"updateMask.fieldPaths={f}" for f in update_fields])
patch_url = f"{url}?{mask_params}"

patch_req = urllib.request.Request(patch_url, data=json_payload, method='PATCH')
patch_req.add_header('Content-Type', 'application/json')
patch_req.add_header('User-Agent', 'Mozilla/5.0')

try:
    with urllib.request.urlopen(patch_req) as response:
        res = json.loads(response.read().decode('utf-8'))
        print("Firestore successfully updated!")
        
        # Save a local parsed backup to scratch/ooks_card_deck.json
        def parse_value(value_dict):
            if not isinstance(value_dict, dict):
                return value_dict
            if "stringValue" in value_dict:
                return value_dict["stringValue"]
            elif "integerValue" in value_dict:
                return int(value_dict["integerValue"])
            elif "doubleValue" in value_dict:
                return float(value_dict["doubleValue"])
            elif "booleanValue" in value_dict:
                return value_dict["booleanValue"]
            elif "nullValue" in value_dict:
                return None
            elif "timestampValue" in value_dict:
                return value_dict["timestampValue"]
            elif "arrayValue" in value_dict:
                values = value_dict["arrayValue"].get("values", [])
                return [parse_value(val) for val in values]
            elif "mapValue" in value_dict:
                fields_map = value_dict["mapValue"].get("fields", {})
                return {k: parse_value(v) for k, v in fields_map.items()}
            return value_dict

        parsed_data = {}
        for k, v in res.get("fields", {}).items():
            parsed_data[k] = parse_value(v)
            
        with open("scratch/ooks_card_deck.json", "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        print("Updated backup saved to scratch/ooks_card_deck.json")
        
except Exception as e:
    print(f"Error during PATCH request: {e}")
    sys.exit(1)
