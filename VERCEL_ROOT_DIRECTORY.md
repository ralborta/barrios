# ⚠️ Root Directory en Vercel - IMPORTANTE

## ❌ Error Común

Vercel muestra error: `should NOT have additional property 'rootDirectory'`

## ✅ Solución

**`rootDirectory` NO se configura en `vercel.json`**

Se configura **SOLO desde el Dashboard de Vercel**.

---

## 🔧 Cómo Configurar Root Directory

### Opción 1: Al Crear el Proyecto

1. Ve a: https://vercel.com/new
2. Importa: `ralborta/barrios`
3. **ANTES de hacer deploy:**
   - Click en **"Edit"** al lado de "Root Directory"
   - Cambia a: **`frontend`**
   - Click en **"Continue"**
4. Luego haz deploy

### Opción 2: En Proyecto Existente

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → **General**
3. Busca **"Root Directory"**
4. Cambia a: **`frontend`**
5. Guarda cambios
6. Haz un nuevo deploy

---

## 📝 Configuración Correcta de vercel.json

El archivo `vercel.json` debe tener:

```json
{
  "buildCommand": "cd frontend && pnpm install && pnpm build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && pnpm install",
  "framework": "nextjs"
}
```

**NO incluir:**
- ❌ `rootDirectory` (se configura en dashboard)

---

## ✅ Verificación

Después de configurar Root Directory en el dashboard:
- [ ] Build debería funcionar
- [ ] No más errores de schema
- [ ] Next.js se detecta correctamente
