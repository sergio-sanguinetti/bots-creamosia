# 🚀 Guía Completa para Desplegar el Orquestador de Bots en Coolify

Esta guía describe el procedimiento paso a paso para desplegar la aplicación Node.js + Puppeteer en un servidor administrado con **Coolify**, asegurando la persistencia de datos y el funcionamiento headless de Chromium.

---

## 🛠️ Prerrequisitos en Coolify
- Instancia activa de **Coolify** (Self-Hosted o Cloud).
- Repositorio Git (GitHub / GitLab / Bitbucket) que contenga la carpeta de este proyecto.

---

## 📁 Archivos de Configuración Incluidos en el Proyecto

### 1. `Dockerfile`
Instala Debian/Linux Chromium y todas las librerías gráficas necesarias para que Puppeteer ejecute los navegadores headless sin errores de dependencias de sistema.

```dockerfile
FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    procps \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=3000

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["npm", "start"]
```

---

## ⚙️ Pasos de Despliegue en Coolify

### Paso 1: Crear una Nueva Aplicación en Coolify
1. Entra a tu panel de **Coolify**.
2. Ve a **Projects** $\rightarrow$ Selecciona tu **Environment** (ej. `Production`).
3. Haz clic en **+ Add Resource** $\rightarrow$ Selecciona **Private/Public Repository (GitHub / Git)**.
4. Conecta tu repositorio del proyecto.

### Paso 2: Seleccionar el Build Pack
1. En la configuración de la aplicación en Coolify, selecciona:
   - **Build Pack:** `Dockerfile` (o `Docker Compose`).
   - **Port:** `3000`.

### Paso 3: Configurar Persistencia de Datos (Persistent Storage)
Para garantizar que la base de datos guardada en `data/db.json` y las reuniones programadas nunca se borren al reiniciar o actualizar la app:
1. En el panel lateral de tu aplicación en Coolify, ve a la sección **Storages / Persistent Storage**.
2. Agrega un volumen persistente:
   - **Source Path:** `bot_data` (o deja el autogenerado por Coolify).
   - **Destination Path:** `/app/data`

---

## 🔒 Variables de Entorno Recomendadas (Environment Variables)

En la pestaña **Environment Variables** de Coolify, agrega:

| Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `PORT` | `3000` | Puerto interno del contenedor |
| `NODE_ENV` | `production` | Modo producción para Express |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/chromium` | Ruta al ejecutable de Chromium instalado |

---

## 🚀 Despliegue Final
1. Haz clic en **Deploy**.
2. Coolify construirá el contenedor Docker con Chromium y expondrá la aplicación tras el proxy inverso HTTPS (Traefik / Caddy) en el dominio que le asignes (ej. `https://orquestador.tudominio.com`).

---

### ✅ Verificación Post-Despliegue
- Accede al dominio asignado en Coolify.
- Presiona **"🔄 Sincronizar con WordPress"** en la pestaña de Gestión de Trabajadores.
- Comprueba que en la carpeta `/app/data/db.json` los datos persisten tras reiniciar el servicio.
