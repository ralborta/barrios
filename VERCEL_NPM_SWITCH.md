# 🔄 Cambio de pnpm a npm en Vercel

## ❌ Problema

pnpm 6.x en Vercel tiene un bug conocido con Node.js 20:
- `ERR_INVALID_THIS`
- `ERR_PNPM_META_FETCH_FAIL`
- Error con `URLSearchParams`

## ✅ Solución

Cambiar a **npm** que es más estable en Vercel y funciona perfectamente con Node.js 20.

## 📝 Cambios Realizados

### vercel.json
```json
{
  "installCommand": "npm install",
  "buildCommand": "npm install && npm run build"
}
```

## ✅ Ventajas de npm en Vercel

- ✅ Más estable
- ✅ Sin problemas con Node.js 20
- ✅ Soporte nativo en Vercel
- ✅ Mismo resultado final

## 📝 Nota

Puedes seguir usando pnpm localmente. Solo Vercel usará npm para el deploy.

## 🔄 Si Quieres Volver a pnpm

Cuando pnpm 8.x esté disponible en Vercel, puedes cambiar de vuelta:

```json
{
  "installCommand": "pnpm install",
  "buildCommand": "pnpm install && pnpm build"
}
```

Pero por ahora, npm es la mejor opción.

## ✅ Verificación

El build debería funcionar ahora sin errores.
