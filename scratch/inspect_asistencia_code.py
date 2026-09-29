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
    echo "=== CLASS-ASISTENCIA.PHP ===" && head -n 80 /var/www/creamosia.com/wp-content/plugins/gestion-cursos/includes/class-asistencia.php &&
    echo "=== CLASS-AULAVIRTUAL.PHP (REGISTRO) ===" && grep -C 5 -i "asistencia\|log\|meta\|update" /var/www/creamosia.com/wp-content/plugins/gestion-cursos/includes/class-aulavirtual.php | head -n 40
    """
    stdin, stdout, stderr = client.exec_command(cmd)
    
    print(stdout.read().decode('utf-8', errors='ignore'))
    client.close()
except Exception as e:
    print(f"Error: {e}")
