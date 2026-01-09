# 🔧 Fix: Railway - Error "The executable `cd` could not be found"

## ❌ Error

```
The executable `cd` could not be found
```

Durante el paso "Deploy > Create container"

## 🔍 Causa

Railway Dashboard tiene un **Start Command** configurado manualmente (probablemente `cd backend && npm start`), y Railway está intentando ejecutarlo directamente como un ejecutable en lugar de a través de un shell.

Cuando usas **Dockerfile**, Railway NO necesita Start Command porque el Dockerfile ya tiene `CMD ["npm", "start"]`.

## ✅ Solución: Limpiar Railway Dashboard

**IMPORTANTE:** Debes eliminar TODOS los comandos manuales en Railway Dashboard:

### Pasos en Railway Dashboard:

1. Ve a: https://railway.app/dashboard
2. Selecciona tu proyecto "barrios"
3. Click en el servicio backend
4. **Settings** → **Service**
   - **Root Directory:** **DEJAR VACÍO** o `/` (raíz del proyecto) ⚠️
5. **Settings** → **Deploy** (o **Build**)
   - **Build Command:** **ELIMINAR COMPLETAMENTE** o dejar vacío
   - **Start Command:** **ELIMINAR COMPLETAMENTE** o dejar vacío
6. Guarda cambios

### Por qué:

- El **Dockerfile** maneja todo:
  - El build está en el Dockerfile (`RUN npm run build`)
  - El start está en el Dockerfile (`CMD ["npm", "start"]`)
- Railway solo necesita:
  - Encontrar el Dockerfile en la raíz
  - Construir la imagen
  - Ejecutar el contenedor

---

## 📝 Configuración Correcta

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Dockerfile (en raíz):**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install
RUN npm run prisma:generate
COPY backend/ .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

**Railway Dashboard:**
- Root Directory: **VACÍO**
- Build Command: **VACÍO**
- Start Command: **VACÍO**

---

## 🚀 Próximo Paso

1. **Elimina los comandos en Railway Dashboard** (Build Command y Start Command)
2. **Asegúrate de que Root Directory esté vacío**
3. Railway debería hacer un nuevo deploy automáticamente
4. O haz un **Redeploy** manual

---

## ✅ Verificación

Después del deploy, verifica:
```bash
curl https://tu-backend.railway.app/health
```

Debería responder: `{"status":"ok",...}`

---

## 🎯 Resumen

- ✅ Dockerfile maneja build y start
- ❌ NO configures Build/Start Commands en Dashboard
- ✅ Root Directory debe estar vacío (Dockerfile está en raíz)
- ✅ Railway usará el `CMD` del Dockerfile automáticamente
