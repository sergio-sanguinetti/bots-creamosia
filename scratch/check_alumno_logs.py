import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    print("--- ROWS IN wp_gc_accesos FOR ALUMNO ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SELECT id, user_id, login, ip, user_agent, fecha FROM wp_gc_accesos WHERE login LIKE \'alumno_orq%\' ORDER BY id DESC LIMIT 10;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    print("--- ROWS IN wp_gc_asistencia FOR ALUMNO ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SELECT id, sesion_id, user_id, ip, user_agent, hora_entrada FROM wp_gc_asistencia ORDER BY id DESC LIMIT 10;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))
    
    client.close()
except Exception as e:
    print("Error:", e)
