import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    print("--- SHOW TABLES LIKE 'wp_gc_%' ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SHOW TABLES LIKE \'wp_gc_%\';" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    client.close()
except Exception as e:
    print("Error:", e)
