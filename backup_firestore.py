import urllib.request
import json
import urllib.parse
import os

def from_firestore_value(val):
    if not isinstance(val, dict):
        return val
    if 'stringValue' in val:
        return val['stringValue']
    elif 'integerValue' in val:
        return int(val['integerValue'])
    elif 'booleanValue' in val:
        return val['booleanValue']
    elif 'doubleValue' in val:
        return float(val['doubleValue'])
    elif 'nullValue' in val:
        return None
    elif 'mapValue' in val:
        fields = val['mapValue'].get('fields', {})
        return {k: from_firestore_value(v) for k, v in fields.items()}
    elif 'arrayValue' in val:
        values = val['arrayValue'].get('values', [])
        return [from_firestore_value(v) for v in values]
    return val

backup_data = {}
next_page_token = None
base_url = "https://firestore.googleapis.com/v1/projects/my-family-ab699/databases/(default)/documents/fc_star_users"

print("Starting Firestore backup...")

page_count = 1
while True:
    query_params = {"pageSize": 100}
    if next_page_token:
        query_params["pageToken"] = next_page_token
        
    url = base_url + "?" + urllib.parse.urlencode(query_params)
    
    try:
        with urllib.request.urlopen(url) as response:
            res_json = json.loads(response.read().decode('utf-8'))
            documents = res_json.get('documents', [])
            print(f"Fetched page {page_count}: {len(documents)} documents found.")
            
            for doc in documents:
                doc_name = doc.get('name', '')
                doc_id = doc_name.split('/')[-1]
                
                fields = doc.get('fields', {})
                unwrapped_fields = {k: from_firestore_value(v) for k, v in fields.items()}
                
                backup_data[doc_id] = unwrapped_fields
            
            next_page_token = res_json.get('nextPageToken')
            if not next_page_token:
                break
            page_count += 1
            
    except Exception as e:
        print(f"Error fetching page {page_count}:", e)
        if hasattr(e, 'read'):
            print("Response details:", e.read().decode('utf-8'))
        break

# Save to local workspace next to the script
script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "fc_star_users_backup.json")
try:
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    print(f"Successfully backed up {len(backup_data)} users to {output_path}")
except Exception as e:
    print("Error saving backup file:", e)
