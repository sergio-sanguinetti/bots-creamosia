# 🔐 Instrucciones de Conexión SSH y Uso de WP-CLI

Guía oficial para conectarse por SSH al servidor de **CreamosIA** (`creamosia.com`) y ejecutar comandos administrativos mediante **WP-CLI**.

---

## 📡 1. Datos de Acceso al Servidor (SSH)

| Parámetro | Valor |
| :--- | :--- |
| **IP del Servidor (Host)** | `76.13.51.90` |
| **Puerto SSH** | `22` (por defecto) |
| **Usuario SSH** | `root` |
| **Contraseña SSH** | `PvZ(UILEi8H4n.OG` |
| **Ruta de WordPress** | `/var/www/creamosia.com` |
| **Dominio Principal** | `https://creamosia.com` |

---

## 💻 2. Cómo Conectarse desde la Terminal (Windows / Linux / macOS)

### Opción A: Conexión Directa mediante SSH

Abre **PowerShell**, **Terminal de Command Prompt** o **Git Bash** y ejecuta:

```bash
ssh root@76.13.51.90
```

Cuando te solicite la contraseña, ingresa:
```text
PvZ(UILEi8H4n.OG
```

---

### Opción B: Ejecución Autónoma con Script de Python (`paramiko`)

Si necesitas ejecutar comandos WP-CLI o consultar el servidor sin escribir la contraseña manualmente cada vez, puedes usar este script en Python:

```python
import paramiko

hostname = "76.13.51.90"
username = "root"
password = "PvZ(UILEi8H4n.OG"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    print(f"Conectando a {hostname}...")
    client.connect(hostname=hostname, username=username, password=password, timeout=15)
    print("¡Conexión SSH exitosa!")

    # Ejemplo de comando WP-CLI
    wp_cmd = "wp user list --path=/var/www/creamosia.com --allow-root"
    stdin, stdout, stderr = client.exec_command(wp_cmd)

    print("\n--- Resultado WP-CLI ---")
    print(stdout.read().decode('utf-8'))

    client.close()
except Exception as e:
    print(f"Error: {e}")
```

---

## 🛠️ 3. Comandos WP-CLI más Útiles para la Plataforma

Una vez dentro del servidor por SSH (o especificando `--path=/var/www/creamosia.com --allow-root`), puedes ejecutar:

### 👤 Gestión de Usuarios
- **Listar todos los usuarios registrados:**
  ```bash
  wp user list --path=/var/www/creamosia.com --allow-root
  ```
- **Listar solo los alumnos de orquestación:**
  ```bash
  wp user list --role=alumno --path=/var/www/creamosia.com --allow-root
  ```
- **Resetear contraseña a un usuario específico:**
  ```bash
  wp user update alumno_orq_01 --user_pass="NuevaPassword123!" --path=/var/www/creamosia.com --allow-root
  ```
- **Crear un nuevo alumno rápido:**
  ```bash
  wp user create alumno_test alumno_test@creamosia.com --role=alumno --user_pass="Password123!" --path=/var/www/creamosia.com --allow-root
  ```

---

### ⚙️ Estado de WordPress y Rendimiento
- **Verificar la versión de WordPress y entorno:**
  ```bash
  wp core version --path=/var/www/creamosia.com --allow-root
  wp --info --allow-root
  ```
- **Limpiar la caché de WordPress:**
  ```bash
  wp cache flush --path=/var/www/creamosia.com --allow-root
  ```
- **Listar plugins activos/inactivos:**
  ```bash
  wp plugin list --path=/var/www/creamosia.com --allow-root
  ```

---

## 🔒 4. Información de Seguridad del Entorno
- **Sistema Operativo:** Ubuntu 24.04 LTS (Kernel 6.8 x86_64)
- **Servidor Web:** Nginx + PHP 8.3 CLI (`/usr/bin/php8.3`)
- **Base de Datos:** MariaDB 11.8.8
- **WP-CLI Path:** `/usr/local/bin/wp` (Versión 2.12.0)
