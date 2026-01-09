# 🔧 Fix: Railway - Cambio de pnpm a npm

## ❌ Problema

Railway no tiene `pnpm` instalado por defecto, causando el error:
```
/bin/bash: line 1: pnpm: command not found
```

## ✅ Solución

He actualizado `railway.json` para usar `npm` en lugar de `pnpm`, igual que en Vercel.

### Cambios Realizados

**Antes:**
```json
"buildCommand": "cd backend && pnpm install && pnpm prisma generate && pnpm build"
"startCommand": "cd backend && pnpm start"
```

**Después:**
```json
"buildCommand": "cd backend && npm install && npm run prisma:generate && npm run build"
"startCommand": "cd backend && npm start"
```

---

## 📝 Configuración en Railway Dashboard

Si también configuraste los comandos manualmente en Railway Dashboard, actualízalos:

1. Ve a Railway Dashboard
2. Click en el servicio backend
3. **Settings** → **Deploy**
4. Actualiza:
   - **Build Command:** `cd backend && npm install && npm run prisma:generate && npm run build`
   - **Start Command:** `cd backend && npm start`
5. Guarda cambios

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
