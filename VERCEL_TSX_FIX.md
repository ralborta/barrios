# 🔧 Fix: Error de Sintaxis - Archivo .ts con JSX

## ❌ Error

```
Expected '>', got 'value'
[/vercel/path0/frontend/hooks/use-auth.ts:74:1]
Caused by: Syntax Error
```

## 🔍 Causa

El archivo `use-auth.ts` contiene JSX (componente React con `<AuthContext.Provider>`), pero tiene extensión `.ts`.

**En TypeScript/Next.js:**
- Archivos `.ts` → Solo TypeScript, sin JSX
- Archivos `.tsx` → TypeScript + JSX

## ✅ Solución Aplicada

Renombrado el archivo:
- ❌ `hooks/use-auth.ts` 
- ✅ `hooks/use-auth.tsx`

## 📝 Regla General

**Si un archivo contiene JSX, debe tener extensión `.tsx`**

Ejemplos:
- ✅ `component.tsx` → Tiene JSX
- ✅ `hook.tsx` → Tiene JSX (como nuestro caso)
- ✅ `page.tsx` → Tiene JSX
- ✅ `util.ts` → Solo TypeScript, sin JSX
- ✅ `api.ts` → Solo TypeScript, sin JSX

## ✅ Verificación

El build debería funcionar ahora sin errores de sintaxis.
