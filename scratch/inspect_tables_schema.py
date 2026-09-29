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
    echo "=== SCHEMA wp_gc_accesos ===" && wp db query "DESCRIBE wp_gc_accesos" --path=/var/www/creamosia.com --allow-root &&
    echo "=== SCHEMA wp_gc_asistencia ===" && wp db query "DESCRIBE wp_gc_asistencia" --path=/var/www/creamosia.com --allow-root &&
    echo "=== SCHEMA wp_gc_confirmacion_asistencia ===" && wp db query "DESCRIBE wp_gc_confirmacion_asistencia" --path=/var/www/creamosia.com --allow-root &&
    echo "=== SCHEMA wp_gc_credenciales_log ===" && wp db query "DESCRIBE wp_gc_credenciales_log" --path=/var/www/creamosia.com --allow-root
    """
    stdin, stdout, stderr = client.exec_command(cmd)
    
    print(stdout.read().decode('utf-8', errors='ignore'))
    client.close()
except Exception as e:
    print(f"Error: {e}")
