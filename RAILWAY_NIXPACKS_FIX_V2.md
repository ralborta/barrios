# 🔧 Fix: Railway - Configuración Nixpacks Corregida

## ❌ Error Anterior

```
error: undefined variable 'nodejs-20_x'
```

La sintaxis `nixPkgs = ["nodejs-20_x", "npm-10_x"]` no es válida en Nixpacks.

## ✅ Solución Aplicada

### Opción 1: `nixpacks.toml` en `backend/` (Recomendado)

He creado `backend/nixpacks.toml` con la sintaxis correcta:

```toml
[providers]
node = "20"

[phases.build]
cmds = ["npm install", "npm run prisma:generate", "npm run build"]

[start]
cmd = "npm start"
```

### Opción 2: Configuración en `railway.json`

He actualizado `railway.json` para especificar el Root Directory:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "$service": {
    "rootDirectory": "backend"
  },
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

## 📝 Configuración en Railway Dashboard

**IMPORTANTE:** Asegúrate de configurar en Railway Dashboard:

1. Ve a Railway Dashboard
2. Click en el servicio backend
3. **Settings** → **Service**
4. **Root Directory:** `backend` ⚠️
5. Guarda cambios

---

## 🔄 Cambios Realizados

1. ✅ Creado `backend/nixpacks.toml` con sintaxis correcta
2. ✅ Actualizado `railway.json` con `rootDirectory: "backend"`
3. ✅ Mantenido `nixpacks.toml` en raíz (por si acaso)

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

## 📚 Referencias

- Nixpacks detecta automáticamente Node.js desde `package.json`
- `[providers]` especifica la versión de Node.js
- `rootDirectory` en `railway.json` o Dashboard configura el directorio base
