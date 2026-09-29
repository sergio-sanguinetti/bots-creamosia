import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    client.connect('76.13.51.90', username='root', password='PvZ(UILEi8H4n.OG', timeout=15)
    
    # 1. Check count before deletion
    q_count_accesos_orq = "SELECT COUNT(*) FROM wp_gc_accesos WHERE login LIKE 'alumno_orq_%';"
    q_count_asist_orq = "SELECT COUNT(*) FROM wp_gc_asistencia WHERE user_id IN (SELECT ID FROM wp_users WHERE user_login LIKE 'alumno_orq_%') OR nombre LIKE 'Alumno Orquestacion%';"
    q_count_fallidos = "SELECT COUNT(*) FROM wp_gc_accesos WHERE (evento = 'login_fallido' OR evento LIKE '%fallido%') AND fecha >= '2026-09-28 00:00:00';"

    print("--- COUNTS BEFORE CLEANUP ---")
    for label, q in [("Accesos Orquestacion", q_count_accesos_orq), ("Asistencia Orquestacion", q_count_asist_orq), ("Fallidos 28 y 29 sep", q_count_fallidos)]:
        stdin, stdout, stderr = client.exec_command(f'wp db query "{q}" --path=/var/www/creamosia.com --allow-root')
        print(f"{label}: {stdout.read().decode('utf-8', errors='ignore').strip()}")

    # 2. Deletions
    q_del_accesos_orq = "DELETE FROM wp_gc_accesos WHERE login LIKE 'alumno_orq_%';"
    q_del_asist_orq = "DELETE FROM wp_gc_asistencia WHERE user_id IN (SELECT ID FROM wp_users WHERE user_login LIKE 'alumno_orq_%') OR nombre LIKE 'Alumno Orquestacion%';"
    q_del_fallidos = "DELETE FROM wp_gc_accesos WHERE (evento = 'login_fallido' OR evento LIKE '%fallido%') AND fecha >= '2026-09-28 00:00:00';"

    print("\n--- EXECUTING DELETIONS ---")
    for label, q in [("Borrando Accesos Orquestacion", q_del_accesos_orq), ("Borrando Asistencia Orquestacion", q_del_asist_orq), ("Borrando Fallidos (28 y 29)", q_del_fallidos)]:
        stdin, stdout, stderr = client.exec_command(f'wp db query "{q}" --path=/var/www/creamosia.com --allow-root')
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()
        print(f"{label} -> Output: {out} | Error: {err}")

    # 3. Check count after deletion
    print("\n--- COUNTS AFTER CLEANUP ---")
    for label, q in [("Accesos Orquestacion", q_count_accesos_orq), ("Asistencia Orquestacion", q_count_asist_orq), ("Fallidos 28 y 29 sep", q_count_fallidos)]:
        stdin, stdout, stderr = client.exec_command(f'wp db query "{q}" --path=/var/www/creamosia.com --allow-root')
        print(f"{label}: {stdout.read().decode('utf-8', errors='ignore').strip()}")

    client.close()
    print("\nCLEANUP COMPLETED SUCCESSFULLY")
except Exception as e:
    print("Error:", e)
