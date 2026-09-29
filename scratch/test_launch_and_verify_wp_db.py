import requests
import time
import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("0. Deteniendo cualquier bot activo previo...")
requests.post("http://localhost:3000/api/bots/stop-all")
time.sleep(2)

print("1. Asignando IPs a alumno_orq_01 (138.100.1.1) y alumno_orq_02 (161.116.1.1)...")
res = requests.get("http://localhost:3000/api/employees")
emps = res.json().get('employees', [])

emp1 = next((e for e in emps if e.get('login') == 'alumno_orq_01'), None)
emp2 = next((e for e in emps if e.get('login') == 'alumno_orq_02'), None)

if emp1:
    requests.post(f"http://localhost:3000/api/employees/{emp1['id']}/assign-ip", json={"ip": "138.100.1.1"})
if emp2:
    requests.post(f"http://localhost:3000/api/employees/{emp2['id']}/assign-ip", json={"ip": "161.116.1.1"})

print("2. Lanzando bots para alumno_orq_01 y alumno_orq_02...")
launch_res = requests.post("http://localhost:3000/api/bots/launch", json={
    "employeeIds": [emp1['id'], emp2['id']],
    "jitsiUrl": "https://creamosia.com/aula-virtual/?sesion_id=17067",
    "durationMinutes": 5,
    "staggeredDelay": False
})
print("Respuesta Launch:", launch_res.json())

print("3. Esperando 25 segundos para la conexión y sincronización con WordPress DB...")
time.sleep(25)

print("4. Verificando registros en la base de datos de WordPress via SSH...")
hostname = "76.13.51.90"
username = "root"
password = "PvZ(UILEi8H4n.OG"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    
    cmd = """
    echo "=== REGISTROS EN wp_gc_accesos ===" && wp db query "SELECT login, ip, user_agent, fecha FROM wp_gc_accesos WHERE login IN ('alumno_orq_01', 'alumno_orq_02') ORDER BY id DESC LIMIT 4" --path=/var/www/creamosia.com --allow-root &&
    echo "=== REGISTROS EN wp_gc_asistencia ===" && wp db query "SELECT nombre, dni, ip, user_agent, hora_entrada FROM wp_gc_asistencia WHERE sesion_id=17067 ORDER BY id DESC LIMIT 4" --path=/var/www/creamosia.com --allow-root
    """
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='ignore'))
    client.close()
except Exception as e:
    print("Error SSH:", e)
