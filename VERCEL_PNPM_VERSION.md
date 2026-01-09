# 🔧 Fix: Error de Versión de pnpm en Vercel

## ❌ Error

```
ERR_PNPM_UNSUPPORTED_ENGINE
Your pnpm version is incompatible
Expected version: ≥8.0.0
Got: 6.35.1
```

## 🔍 Causa

Vercel usa pnpm 6.35.1 por defecto, pero `engines.pnpm` en `package.json` requería >= 8.0.0.

## ✅ Solución Aplicada

Eliminado el requisito de pnpm del `engines`:

**Antes:**
```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"  // ❌ Esto causaba el error
  }
}
```

**Ahora:**
```json
{
  "engines": {
    "node": ">=20.0.0"  // ✅ Solo Node.js
  }
}
```

## 📝 Nota

Vercel maneja pnpm automáticamente y usa la versión 6.x que es compatible con Next.js. No necesitamos especificar la versión de pnpm en `engines`.

## ✅ Verificación

El build debería funcionar ahora con:
- Node.js 20.x (especificado en engines)
- pnpm 6.35.1 (versión por defecto de Vercel)

## 🔄 Alternativa: Usar npm

Si prefieres usar npm en lugar de pnpm:

1. Cambia `vercel.json`:
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

2. O desde el Dashboard:
- Install Command: `npm install`
- Build Command: `npm run build`

Pero pnpm 6.x debería funcionar perfectamente con Next.js.
