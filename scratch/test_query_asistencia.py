import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

hostname = "76.13.51.90"
username = "root"
password = "PvZ(UILEi8H4n.OG"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    
    cmd = """
    echo "=== REGISTROS EN wp_gc_asistencia ===" && wp db query "SELECT id, sesion_id, user_id, nombre, dni, ip, hora_entrada, hora_salida, tiempo_neto_seg FROM wp_gc_asistencia LIMIT 10" --path=/var/www/creamosia.com --allow-root &&
    echo "=== REGISTROS EN wp_gc_accesos ===" && wp db query "SELECT id, user_id, login, ip, evento, fecha FROM wp_gc_accesos ORDER BY id DESC LIMIT 10" --path=/var/www/creamosia.com --allow-root
    """
    stdin, stdout, stderr = client.exec_command(cmd)
    
    print(stdout.read().decode('utf-8', errors='ignore'))
    client.close()
except Exception as e:
    print(f"Error: {e}")
