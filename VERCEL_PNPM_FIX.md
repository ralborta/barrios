# 🔧 Fix: Error de pnpm install en Vercel

## ❌ Error Observado

```
ERR_PNPM_META_FETCH_FAIL
Value of "this" must be of type URLSearchParams
Error: Command "pnpm install" exited with 1
```

## 🔍 Causa

Este error generalmente ocurre por:
1. Versión incompatible de Node.js
2. Versión incompatible de pnpm
3. Problema temporal con npm registry

## ✅ Soluciones Aplicadas

### 1. Especificar Versión de Node.js

Agregado en `vercel.json`:
```json
{
  "nodeVersion": "20.x"
}
```

Y archivos `.node-version` con `20`

### 2. Configuración en Vercel Dashboard

Si el error persiste, configura manualmente:

1. Ve a tu proyecto en Vercel
2. **Settings** → **General**
3. **Node.js Version:** Selecciona `20.x`
4. Guarda y redeploy

### 3. Alternativa: Usar npm

Si pnpm sigue fallando, puedes cambiar a npm:

En `vercel.json`:
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

Y en Vercel Dashboard:
- **Install Command:** `npm install`
- **Build Command:** `npm run build`

## 🔄 Próximos Pasos

1. Espera el nuevo deploy automático
2. Si falla, verifica la versión de Node.js en Vercel Dashboard
3. Si sigue fallando, considera cambiar a npm temporalmente

## 📝 Nota

Este error suele ser temporal. Si persiste después de especificar Node.js 20, puede ser un problema del registry de npm. En ese caso, el cambio a npm suele resolverlo.
