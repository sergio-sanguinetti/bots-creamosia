import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    cmd = '''wp eval '$req = new WP_REST_Request("GET", "/orquestador/v1/sync-data"); $req->set_param("token", "OrqBotSecret2026!"); $res = rest_do_request($req); print_r($res->get_data());' --path=/var/www/creamosia.com --allow-root'''
    stdin, stdout, stderr = client.exec_command(cmd)
    print("WP EVAL OUTPUT:")
    print(stdout.read().decode('utf-8', errors='ignore'))
    print("WP EVAL ERRORS:")
    print(stderr.read().decode('utf-8', errors='ignore'))
    
    client.close()
except Exception as e:
    print("Error:", e)
