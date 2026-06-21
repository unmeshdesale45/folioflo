import urllib.request
import urllib.error
import json

url = "http://localhost:8000/api/auth/register"
data = {"email": "test777@example.com", "password": "pass"}
req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as response:
        print("Status", response.status)
        print("Body", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    print("Body:", e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
