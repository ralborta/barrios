# 🔧 Fix: Railway - Sintaxis Correcta de nixpacks.toml

## ❌ Error Anterior

```
invalid type: map, expected a sequence for key `providers` at line 7 column 1
```

La sintaxis `[providers]` con `node = "20"` no es válida. `providers` debe ser una secuencia (array), no un mapa.

## ✅ Solución Aplicada

He cambiado a usar `[phases.setup]` con `nixPkgs` que es la sintaxis correcta:

### Para `backend/nixpacks.toml` (Root Directory = backend):

```toml
[phases.setup]
nixPkgs = { nodejs = "20", npm = "10" }

[phases.build]
cmds = ["npm install", "npm run prisma:generate", "npm run build"]

[start]
cmd = "npm start"
```

### Para `nixpacks.toml` en raíz (si Root Directory = raíz):

```toml
[phases.setup]
nixPkgs = { nodejs = "20", npm = "10" }

[phases.build]
cmds = ["cd backend && npm install", "cd backend && npm run prisma:generate", "cd backend && npm run build"]

[start]
cmd = "cd backend && npm start"
```

---

## 📝 Alternativa Más Simple

Si esto sigue fallando, podemos eliminar `nixpacks.toml` completamente y dejar que Nixpacks detecte automáticamente Node.js desde `package.json`. Nixpacks es muy bueno detectando proyectos Node.js automáticamente.

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
