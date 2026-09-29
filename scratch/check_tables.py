import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    print("--- DESCRIBE wp_gc_accesos ---")
    stdin, stdout, stderr = client.exec_command('wp db query "DESCRIBE wp_gc_accesos;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    print("--- DESCRIBE wp_gc_asistencia ---")
    stdin, stdout, stderr = client.exec_command('wp db query "DESCRIBE wp_gc_asistencia;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    print("--- RECENT ROWS wp_gc_accesos ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SELECT * FROM wp_gc_accesos ORDER BY id DESC LIMIT 5;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))

    print("--- RECENT ROWS wp_gc_asistencia ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SELECT * FROM wp_gc_asistencia ORDER BY id DESC LIMIT 5;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    client.close()
except Exception as e:
    print("Error:", e)
