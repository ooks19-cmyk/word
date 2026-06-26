import urllib.request
import json
import urllib.parse

project_id = "my-family-ab699"
document_id = "ooks"
url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/fc_star_users/{document_id}?updateMask.fieldPaths=userPoints"

# We want to set userPoints to 12 (its current value) to test if we have write permission.
data = {
    "fields": {
        "userPoints": {
            "integerValue": "12"
        }
    }
}

json_data = json.dumps(data).encode('utf-8')

try:
    print(f"Sending PATCH request to: {url}")
    req = urllib.request.Request(url, data=json_data, method='PATCH')
    req.add_header('Content-Type', 'application/json')
    req.add_header('User-Agent', 'Mozilla/5.0')
    
    with urllib.request.urlopen(req) as response:
        html = response.read()
        res_data = json.loads(html)
        print("Success! Response received:")
        print(json.dumps(res_data, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error occurred during PATCH: {e}")
