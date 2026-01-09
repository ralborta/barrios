# ⚙️ Configurar Versión de Node.js en Vercel

## ❌ Error

`should NOT have additional property 'nodeVersion'`

**Causa:** `nodeVersion` no es una propiedad válida en `vercel.json`

## ✅ Soluciones Correctas

### Opción 1: Usar `engines` en package.json (Recomendado)

En `frontend/package.json`:
```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

Vercel detectará automáticamente esta configuración.

### Opción 2: Archivo `.node-version`

Ya creado: `frontend/.node-version` con contenido `20`

Vercel también lo detecta automáticamente.

### Opción 3: Configurar en Dashboard

1. Ve a Vercel Dashboard
2. Settings → General
3. **Node.js Version:** Selecciona `20.x`
4. Guarda cambios

## 📝 Nota

Puedes usar las tres opciones juntas. Vercel prioriza:
1. Configuración del Dashboard
2. `engines` en package.json
3. `.node-version` file

## ✅ Cambios Aplicados

- ✅ Eliminado `nodeVersion` de `vercel.json`
- ✅ Agregado `engines` en `package.json`
- ✅ Creado `.node-version` file

El build debería funcionar ahora.
