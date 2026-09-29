import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

hostname = "76.13.51.90"
username = "root"
password = "PvZ(UILEi8H4n.OG"

login = sys.argv[1] if len(sys.argv) > 1 else "alumno_orq_01"
ip_address = sys.argv[2] if len(sys.argv) > 2 else "138.100.1.1"
user_agent = sys.argv[3] if len(sys.argv) > 3 else "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    
    # Escape quotes
    clean_ua = user_agent.replace("'", "\\'")
    clean_ip = ip_address.replace("'", "\\'")
    clean_login = login.replace("'", "\\'")

    query1 = f"UPDATE wp_gc_accesos SET ip='{clean_ip}', user_agent='{clean_ua}' WHERE login='{clean_login}' ORDER BY id DESC LIMIT 1;"
    query2 = f"UPDATE wp_gc_asistencia SET ip='{clean_ip}', user_agent='{clean_ua}' WHERE (dni IN (SELECT meta_value FROM wp_usermeta WHERE meta_key='gc_dni' AND user_id=(SELECT ID FROM wp_users WHERE user_login='{clean_login}')) OR user_id=(SELECT ID FROM wp_users WHERE user_login='{clean_login}')) ORDER BY id DESC LIMIT 1;"

    cmd = f"""
    wp db query "{query1}" --path=/var/www/creamosia.com --allow-root &&
    wp db query "{query2}" --path=/var/www/creamosia.com --allow-root
    """

    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    print("STDOUT:", out.strip())
    if err:
        print("STDERR:", err.strip())
        
    client.close()
    print("SUCCESS")
except Exception as e:
    print(f"Error: {e}")
