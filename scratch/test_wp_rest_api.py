import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

# 1. Test Sync Data Endpoint
url_sync = "https://creamosia.com/wp-json/orquestador/v1/sync-data?token=OrqBotSecret2026!"
req = urllib.request.Request(url_sync, headers=headers)
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        res_data = json.loads(response.read().decode())
        print("--- SYNC DATA RESPONSE ---")
        print("Success:", res_data.get('success'))
        print("Total Users:", res_data.get('total_users'))
        if res_data.get('employees'):
            print("First Employee Sample:", res_data['employees'][0])
except Exception as e:
    print("Sync Data Error:", e)

# 2. Test Update Bot Log Endpoint
url_update = "https://creamosia.com/wp-json/orquestador/v1/update-bot-log"
payload = json.dumps({
    "login": "alumno_orq_01",
    "ip": "138.100.1.99",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) REST API Test"
}).encode('utf-8')

update_headers = {
    'Content-Type': 'application/json',
    'X-Orquestador-Token': 'OrqBotSecret2026!',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

req_update = urllib.request.Request(url_update, data=payload, headers=update_headers)

try:
    with urllib.request.urlopen(req_update, context=ctx) as response:
        res_update = json.loads(response.read().decode())
        print("\n--- UPDATE BOT LOG RESPONSE ---")
        print("Response:", res_update)
except Exception as e:
    print("Update Bot Log Error:", e)
