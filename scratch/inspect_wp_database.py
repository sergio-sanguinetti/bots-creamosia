import paramiko

hostname = "76.13.51.90"
username = "root"
password = "PvZ(UILEi8H4n.OG"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    
    cmd = """
    echo "=== TABLAS EN LA BASE DE DATOS ===" && wp db tables --path=/var/www/creamosia.com --allow-root &&
    echo "=== PLUGINS INSTALADOS ===" && wp plugin list --path=/var/www/creamosia.com --allow-root
    """
    stdin, stdout, stderr = client.exec_command(cmd)
    
    print(stdout.read().decode('utf-8'))
    client.close()
except Exception as e:
    print(f"Error: {e}")
