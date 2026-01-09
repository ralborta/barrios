# 🔧 Fix: Railway - Detección Automática de Node.js

## ❌ Problema

Los archivos `nixpacks.toml` estaban causando errores de sintaxis:
- `providers` debe ser una secuencia, no un mapa
- `nixPkgs` debe ser una secuencia, no un mapa

## ✅ Solución: Detección Automática

He eliminado los archivos `nixpacks.toml` y dejado que **Nixpacks detecte automáticamente** Node.js desde `package.json`.

**Nixpacks es muy bueno detectando proyectos Node.js automáticamente:**
- Detecta `package.json` en el directorio raíz (o en `backend/` si Root Directory está configurado)
- Instala Node.js automáticamente (versión compatible)
- Ejecuta `npm install` automáticamente
- Ejecuta el build si hay un script `build` en `package.json`

---

## 📝 Configuración Necesaria en Railway Dashboard

**IMPORTANTE:** Asegúrate de configurar en Railway Dashboard:

1. Ve a Railway Dashboard
2. Click en el servicio backend
3. **Settings** → **Service**
4. **Root Directory:** `backend` ⚠️
5. **Build Command:** (dejar vacío o eliminar - Nixpacks lo detectará automáticamente)
6. **Start Command:** (dejar vacío o eliminar - Nixpacks usará `npm start` automáticamente)
7. Guarda cambios

---

## 🔍 Cómo Funciona la Detección Automática

1. Nixpacks detecta `backend/package.json`
2. Detecta que es un proyecto Node.js
3. Instala Node.js (versión compatible con `engines` si está especificado)
4. Ejecuta `npm install`
5. Si hay un script `build`, lo ejecuta
6. Usa `npm start` para iniciar el servidor

---

## 📝 Verificar package.json

El `backend/package.json` ya tiene:
- ✅ Scripts: `build`, `start`
- ✅ Dependencies correctas
- ✅ TypeScript configurado

Nixpacks debería detectar todo automáticamente.

---

## 🚀 Próximo Paso

Railway debería hacer un nuevo deploy automáticamente. Si no:
1. Ve a Railway Dashboard
2. Click en el servicio backend
3. **Deployments** → **Redeploy**

---

## ✅ Verificación

Después del deploy, verifica:
```bash
curl https://tu-backend.railway.app/health
```

Debería responder: `{"status":"ok",...}`

---

## 🆘 Si Sigue Fallando

Si Nixpacks no detecta correctamente, podemos:
1. Agregar `engines` en `package.json`:
   ```json
   "engines": {
     "node": ">=20.0.0"
   }
   ```
2. O crear un `Dockerfile` simple

Pero primero probemos con la detección automática.
