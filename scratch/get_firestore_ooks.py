import urllib.request
import json
import sys

# Set default stdout encoding to utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

project_id = "my-family-ab699"
document_id = "ooks"
url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{document_id}"

def parse_value(value_dict):
    """
    Parses a Firestore value dictionary.
    Firestore representation: {"stringValue": "...", "integerValue": "...", "mapValue": ..., "arrayValue": ...}
    """
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
        fields = value_dict["mapValue"].get("fields", {})
        return {key: parse_value(val) for key, val in fields.items()}
    
    return value_dict

try:
    print(f"Fetching: {url}")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read()
        data = json.loads(html)
        
        # Parse fields
        fields = data.get("fields", {})
        parsed_data = {}
        for key, value_dict in fields.items():
            parsed_data[key] = parse_value(value_dict)
            
        print("Success! Data parsed.")
        
        # Write to utf-8 file
        out_path = "scratch/ooks_card_deck.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)
        print(f"Parsed data saved to {out_path}")
        
except Exception as e:
    print(f"Error occurred: {e}")
