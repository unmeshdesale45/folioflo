import json
import urllib.request
import urllib.error

url = "http://localhost:8000/api/research/search"
# we need a token to hit /search because it uses get_current_user
# Wait, let's login first to get the token!

def get_token():
    login_url = "http://localhost:8000/api/auth/login"
    data = "username=test777@example.com&password=pass".encode("utf-8")
    req = urllib.request.Request(login_url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))["access_token"]

try:
    token = get_token()
    req = urllib.request.Request(url, data=json.dumps({"query": "machine learning in modern healthcare applications", "max_results": 2}).encode("utf-8"), headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    })
    with urllib.request.urlopen(req) as response:
        print("Status", response.status)
        data = json.loads(response.read().decode("utf-8"))
        papers = data.get("papers", [])
        for p in papers:
            print(f"Paper {p.get('id')}: ai_summary={repr(p.get('ai_summary'))}")
except Exception as e:
    print(e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
