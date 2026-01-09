# ⚙️ Configuración de Vercel - Explicación

## 🔑 Concepto Clave

**Cuando configuras Root Directory en el dashboard de Vercel, Vercel ya está "dentro" de ese directorio.**

---

## ✅ Configuración Correcta

### En el Dashboard de Vercel:
- **Root Directory:** `frontend`

### En vercel.json:
```json
{
  "buildCommand": "pnpm install && pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

**NO incluir `cd frontend`** porque Vercel ya está ejecutando desde `frontend/`

---

## ❌ Configuración Incorrecta

Si pones en `vercel.json`:
```json
{
  "buildCommand": "cd frontend && pnpm install && pnpm build"
}
```

**Error:** `cd: frontend: No such file or directory`

**Por qué:** Vercel ya está en `frontend/`, entonces intenta hacer `cd frontend` desde dentro de `frontend/`, lo cual no existe.

---

## 📝 Resumen

1. **Root Directory en Dashboard:** `frontend` ✅
2. **Comandos en vercel.json:** Sin `cd frontend` ✅
3. **Output Directory:** `.next` (no `frontend/.next`) ✅

---

## 🔄 Si NO configuras Root Directory

Si NO configuras Root Directory en el dashboard, entonces SÍ necesitas `cd frontend`:

```json
{
  "buildCommand": "cd frontend && pnpm install && pnpm build",
  "outputDirectory": "frontend/.next"
}
```

Pero es mejor configurar Root Directory en el dashboard y usar la configuración simple.
