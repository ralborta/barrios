# 🔧 Fix: Railway - Error "can't cd to backend"

## ❌ Error

```
sh: 1: cd: can't cd to backend
```

## 🔍 Causa

El error ocurre porque:
1. El **Root Directory** está configurado como `backend` en Railway Dashboard
2. Pero el **Build Command** en Railway Dashboard todavía tiene `cd backend && ...`
3. Cuando Railway ejecuta el build, ya está dentro de `backend/`, por lo que `cd backend` falla

## ✅ Solución

### Opción 1: Configurar en Railway Dashboard (Recomendado)

1. Ve a Railway Dashboard
2. Click en el servicio backend
3. **Settings** → **Service**
4. **Root Directory:** `backend` ✅
5. **Build Command:** Elimina completamente o deja vacío
   - ❌ **NO uses:** `cd backend && npm install...`
   - ✅ **Deja vacío** o usa: `npm install && npm run prisma:generate && npm run build`
6. **Start Command:** Elimina completamente o deja vacío
   - ❌ **NO uses:** `cd backend && npm start`
   - ✅ **Deja vacío** o usa: `npm start`
7. Guarda cambios

### Opción 2: Usar railway.json

El `railway.json` ya tiene `rootDirectory: "backend"`, pero Railway Dashboard puede estar sobrescribiendo los comandos.

**Solución:** Elimina los comandos de build/start del Dashboard y deja que `railway.json` maneje todo.

---

## 📝 Comandos Correctos

Si el **Root Directory = `backend`**, los comandos deben ser:

**Build Command:**
```
npm install && npm run prisma:generate && npm run build
```

**Start Command:**
```
npm start
```

**NO incluyas `cd backend`** porque Railway ya está trabajando desde `backend/`.

---

## 🚀 Próximo Paso

1. Actualiza la configuración en Railway Dashboard
2. Railway debería hacer un nuevo deploy automáticamente
3. O haz un **Redeploy** manual

---

## ✅ Verificación

Después del deploy, verifica:
```bash
curl https://tu-backend.railway.app/health
```

Debería responder: `{"status":"ok",...}`
