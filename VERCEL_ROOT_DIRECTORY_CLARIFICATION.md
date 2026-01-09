# 📁 Root Directory en Vercel - Formato Correcto

## ✅ Formato Correcto

En el Dashboard de Vercel, cuando configures Root Directory, usa:

```
frontend
```

**SIN barra inicial** (`/`)

---

## ❌ Formatos Incorrectos

- ❌ `/frontend` (con barra inicial)
- ❌ `./frontend` (con punto y barra)
- ❌ `frontend/` (con barra final)

---

## 🔍 Dónde Configurarlo

1. Ve a tu proyecto en Vercel Dashboard
2. **Settings** → **General**
3. Busca **"Root Directory"**
4. Escribe: **`frontend`** (sin barras)
5. Guarda cambios

---

## 📝 Nota

Vercel interpreta el Root Directory como una ruta **relativa al repositorio**, no como una ruta absoluta del sistema de archivos. Por eso no necesita la barra inicial.

---

## ✅ Verificación

Después de configurar:
- Root Directory: `frontend` ✅
- Build debería encontrar el `package.json` en `frontend/package.json`
- Build debería funcionar correctamente
