import paramiko
import sys

hostname = "76.13.51.90"
username = "root"
password = "PvZ(UILEi8H4n.OG"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Conectando a {hostname} como {username}...")
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    print("¡CONEXIÓN SSH EXITOSA!\n")

    commands = [
        "uname -a",
        "hostname",
        "wp --info --allow-root",
        "find /var/www /home /usr/share/nginx /var/html /srv -name wp-config.php 2>/dev/null"
    ]

    for cmd in commands:
        print(f"--- Ejecutando: {cmd} ---")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        if out:
            print("STDOUT:", out.strip())
        if err:
            print("STDERR:", err.strip())
        print()

    client.close()
except Exception as e:
    print(f"ERROR DE CONEXIÓN: {e}")
    sys.exit(1)
