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

# 2. Modify isHardMode to False
fields["isHardMode"] = {"booleanValue": False}

# 3. Send PATCH request to update the document in Firestore
print("Step 2: Sending PATCH request to update Firestore...")
payload = {
    "fields": fields
}
json_payload = json.dumps(payload).encode('utf-8')

update_fields = ["isHardMode"]
mask_params = "&".join([f"updateMask.fieldPaths={f}" for f in update_fields])
patch_url = f"{url}?{mask_params}"

patch_req = urllib.request.Request(patch_url, data=json_payload, method='PATCH')
patch_req.add_header('Content-Type', 'application/json')
patch_req.add_header('User-Agent', 'Mozilla/5.0')

try:
    with urllib.request.urlopen(patch_req) as response:
        res = json.loads(response.read().decode('utf-8'))
        print("Firestore successfully updated isHardMode to False!")
        
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
