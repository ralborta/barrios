# 🔧 Fix: Railway - Configuración de Nixpacks para Node.js

## ❌ Problema

Railway no encuentra `npm` porque Nixpacks no está detectando correctamente que es un proyecto Node.js:
```
/bin/bash: line 1: npm: command not found
```

## 🔍 Causa

Railway está ejecutando el build desde la raíz del proyecto, pero el `package.json` está en `backend/`. Nixpacks necesita detectar el `package.json` para instalar Node.js y npm automáticamente.

## ✅ Solución

He creado un archivo `nixpacks.toml` en la raíz que especifica explícitamente:
1. Instalar Node.js 20 y npm
2. Ejecutar el build desde `backend/`
3. Ejecutar el start desde `backend/`

### Archivo Creado: `nixpacks.toml`

```toml
[phases.setup]
nixPkgs = ["nodejs-20_x", "npm-10_x"]

[phases.build]
cmds = ["cd backend && npm install && npm run prisma:generate && npm run build"]

[start]
cmd = "cd backend && npm start"
```

### Cambios en `railway.json`

Simplificado para que Nixpacks use la configuración de `nixpacks.toml`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

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

## 📝 Nota sobre Root Directory

Si configuraste **Root Directory** en Railway Dashboard:
- **Opción 1:** Déjalo en `backend` y Railway usará `nixpacks.toml` desde la raíz
- **Opción 2:** Déjalo vacío (raíz) y `nixpacks.toml` manejará el `cd backend`

Ambas opciones deberían funcionar ahora.
