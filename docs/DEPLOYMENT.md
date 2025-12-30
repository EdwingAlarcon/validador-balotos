# 🚀 Guía de Despliegue y Ejecución

## 📋 Tabla de Contenidos

-   [Ejecución Local](#ejecución-local)
-   [GitHub y Git](#github-y-git)
-   [Despliegue en Producción](#despliegue-en-producción)
-   [Variables de Entorno](#variables-de-entorno)

---

## 🏠 Ejecución Local

### Desde el Proyecto Descargado

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start

# 3. Abrir navegador
http://localhost:3000
```

### Desde GitHub (Clonar Repositorio)

```bash
# 1. Clonar repositorio
git clone https://github.com/TU_USUARIO/ValidadorTiquetesBaloto.git

# 2. Entrar al directorio
cd ValidadorTiquetesBaloto

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor
npm start
```

---

## 🌐 GitHub y Git

### ⚠️ Importante: GitHub NO ejecuta tu aplicación

GitHub solo **almacena el código fuente**. Para que la aplicación funcione:

-   **Localmente**: Cada persona debe clonar, instalar dependencias y ejecutar
-   **En producción**: Necesitas un servicio de hosting/servidor

### Subir a GitHub

```bash
# 1. Inicializar repositorio (si no existe)
git init

# 2. Agregar archivos
git add .

# 3. Commit
git commit -m "Validador de Tiquetes - Primera versión"

# 4. Agregar repositorio remoto
git remote add origin https://github.com/TU_USUARIO/ValidadorTiquetesBaloto.git

# 5. Subir código
git push -u origin main
```

### .gitignore ya configurado

El proyecto ya incluye `.gitignore` que excluye:

-   `node_modules/` (dependencias)
-   Archivos temporales
-   Variables de entorno

---

## 🌍 Despliegue en Producción

Para que tu aplicación esté accesible desde cualquier lugar (no solo localhost), necesitas un **servicio de hosting**.

### Opción 1: Render (Recomendado - Gratis)

**Pasos:**

1. Crear cuenta en [render.com](https://render.com)
2. Conectar tu repositorio de GitHub
3. Crear nuevo "Web Service"
4. Configuración:
    - Build Command: `npm install`
    - Start Command: `npm start`
    - Puerto: Automático (Render usa `process.env.PORT`)

**Modificación necesaria en `src/server.js`:**

```javascript
const PORT = process.env.PORT || 3000;
```

**URL resultante:** `https://tu-app.onrender.com`

---

### Opción 2: Railway

**Pasos:**

1. Crear cuenta en [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Seleccionar repositorio
4. Railway detecta automáticamente Node.js

**Configuración automática** - No requiere cambios

**URL resultante:** `https://tu-app.up.railway.app`

---

### Opción 3: Vercel

**Limitación:** Vercel es mejor para frontend estático. Para backend necesitas configuración especial.

**Pasos:**

1. Instalar Vercel CLI: `npm i -g vercel`
2. En el proyecto: `vercel`
3. Seguir instrucciones

**Archivo necesario:** `vercel.json`

```json
{
    "version": 2,
    "builds": [
        {
            "src": "src/server.js",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "src/server.js"
        }
    ]
}
```

---

### Opción 4: Heroku

**Pasos:**

1. Crear cuenta en [heroku.com](https://heroku.com)
2. Instalar Heroku CLI
3. Comandos:

```bash
heroku login
heroku create nombre-app
git push heroku main
```

**Archivo necesario:** `Procfile`

```
web: node src/server.js
```

---

## ⚙️ Variables de Entorno

Para producción, crea archivo `.env` (ya está en .gitignore):

```env
PORT=3000
NODE_ENV=production
```

**Actualizar `src/server.js`:**

```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

**Instalar dotenv:**

```bash
npm install dotenv
```

---

## 🔄 Flujo Completo

### Desarrollo Local

```
1. Clonar/Descargar → 2. npm install → 3. npm start → 4. localhost:3000
```

### Producción

```
1. Subir a GitHub → 2. Conectar con Render/Railway → 3. Deploy automático → 4. URL pública
```

---

## 📝 Checklist Pre-Deployment

-   [ ] `.gitignore` configurado (ya incluido)
-   [ ] `node_modules/` no subido a GitHub
-   [ ] `package.json` tiene script `start` correcto
-   [ ] Puerto configurable con `process.env.PORT`
-   [ ] Dependencias en `package.json` (no devDependencies para producción)
-   [ ] README.md con instrucciones (ya incluido)

---

## 🆘 Solución de Problemas

### Error: "Cannot find module"

```bash
npm install
```

### Error: "Port already in use"

```bash
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# O cambiar puerto en server.js
const PORT = 3001;
```

### Error en producción: "Module not found"

-   Verificar que todas las dependencias estén en `dependencies` (no en `devDependencies`)
-   Ejecutar `npm install --production`

---

## 🎯 Resumen Rápido

| Uso                  | Dónde          | Cómo Ejecutar                     |
| -------------------- | -------------- | --------------------------------- |
| **Desarrollo**       | Tu PC          | `npm start`                       |
| **Compartir código** | GitHub         | Solo almacena, no ejecuta         |
| **Producción**       | Render/Railway | Deploy automático desde GitHub    |
| **Acceso público**   | Internet       | URL del servicio (ej: render.com) |

---

## 💡 Recomendaciones

1. **Para desarrollo/pruebas:** Ejecuta localmente (`npm start`)
2. **Para compartir código:** Sube a GitHub
3. **Para acceso público:** Despliega en Render (gratis y fácil)
4. **Para equipo:** GitHub + Render (deploy automático en cada push)

---

**🚀 La aplicación funciona perfectamente en local. Para ponerla online, usa Render o Railway (gratis y sin configuración compleja)**
