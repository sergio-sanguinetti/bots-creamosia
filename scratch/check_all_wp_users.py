import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    print("--- TOTAL USER COUNT IN WP ---")
    stdin, stdout, stderr = client.exec_command('wp user list --format=count --path=/var/www/creamosia.com --allow-root')
    print("Total users in wp_users:", stdout.read().decode('utf-8', errors='ignore').strip())

    print("\n--- ALL USERS BY ROLE ---")
    stdin, stdout, stderr = client.exec_command('wp user list --fields=ID,user_login,roles,user_email --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))

    print("\n--- USERS WITH DNI META ('gc_dni') ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SELECT user_id, meta_value FROM wp_usermeta WHERE meta_key=\'gc_dni\';" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))

    print("\n--- USERS IN PROGRESS TABLE (wp_gc_progreso) ---")
    stdin, stdout, stderr = client.exec_command('wp db query "SELECT DISTINCT user_id FROM wp_gc_progreso;" --path=/var/www/creamosia.com --allow-root')
    print(stdout.read().decode('utf-8', errors='ignore'))

    client.close()
except Exception as e:
    print("Error:", e)
