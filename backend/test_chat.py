import json
import urllib.request
import urllib.error

url = "http://localhost:8000/api/chat/"
data = {"message": "Hello! What can you do?", "context": "Current Search Query: \"machine learning\"\n1. Paper A\n2. Paper B"}

# Wait, the POST route in chat.py isn't protected by a token `get_current_user` dependency!
# Looking back at `app/routers/chat.py`, I did NOT add `Depends(get_current_user)`. This means it doesn't need auth.

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        reply = json.loads(response.read().decode("utf-8"))
        print("Response:", reply["reply"])
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    print("Body:", e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
