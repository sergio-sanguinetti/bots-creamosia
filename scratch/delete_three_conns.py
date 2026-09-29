import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    q_del_asistencia = "DELETE FROM wp_gc_asistencia WHERE nombre LIKE 'Alumno Orquestacion%' OR user_id IN (SELECT ID FROM wp_users WHERE user_login LIKE 'alumno_orq_%');"
    q_del_accesos = "DELETE FROM wp_gc_accesos WHERE login LIKE 'alumno_orq_%';"

    print("--- EXECUTING DELETIONS FOR CONEXIONES AULA VIRTUAL ---")
    stdin, stdout, stderr = client.exec_command(f'wp db query "{q_del_asistencia}" --path=/var/www/creamosia.com --allow-root')
    print("Asistencia deleted:", stdout.read().decode('utf-8', errors='ignore').strip())

    stdin, stdout, stderr = client.exec_command(f'wp db query "{q_del_accesos}" --path=/var/www/creamosia.com --allow-root')
    print("Accesos deleted:", stdout.read().decode('utf-8', errors='ignore').strip())

    client.close()
    print("DONE")
except Exception as e:
    print("Error:", e)
