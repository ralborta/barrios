# 🚀 Deploy en Vercel - Instrucciones

## ⚠️ Problema Detectado

El proyecto está vinculado a un proyecto viejo. Necesitamos crear un proyecto nuevo desde el dashboard de Vercel.

---

## ✅ Solución: Crear Proyecto desde Dashboard

### Paso 1: Ir a Vercel

1. Ve a: **https://vercel.com/new**
2. Inicia sesión con tu cuenta de GitHub

### Paso 2: Importar Repositorio

1. Click en **"Import Git Repository"**
2. Busca: **`ralborta/barrios`**
3. Click en **"Import"**

### Paso 3: Configuración del Proyecto

**⚠️ CONFIGURACIÓN IMPORTANTE:**

1. **Project Name:** `barrios` (o el que prefieras)

2. **Framework Preset:** 
   - Debería detectar "Next.js" automáticamente
   - Si no, selecciónalo manualmente

3. **Root Directory:**
   - Click en **"Edit"** al lado de Root Directory
   - Cambia a: **`frontend`** ⚠️ ESTO ES CRÍTICO
   - Click en **"Continue"**

4. **Build and Output Settings:**
   - Build Command: `pnpm install && pnpm build` (o dejar default)
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install` (o dejar default)

### Paso 4: Variables de Entorno

1. En la sección **"Environment Variables"**
2. Agrega:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** Por ahora déjalo vacío o usa `http://localhost:3001`
   - (Lo actualizarás después con la URL de Railway)

### Paso 5: Deploy

1. Click en **"Deploy"**
2. Espera 2-3 minutos
3. Vercel construirá y desplegará automáticamente

### Paso 6: Verificar

1. Una vez completado, verás la URL de producción
2. Ejemplo: `https://barrios-xxx.vercel.app`
3. Click en la URL para verificar que funciona

---

## 🔧 Si el Build Falla

### Error: "No Next.js version detected"

**Solución:**
1. Ve a Settings → General
2. Verifica que **Root Directory** sea `frontend`
3. Guarda y haz un nuevo deploy

### Error: "Command npm run build exited with 1"

**Solución:**
1. Ve a Settings → General
2. En **Build & Development Settings**
3. Cambia **Install Command** a: `cd frontend && pnpm install`
4. Cambia **Build Command** a: `cd frontend && pnpm build`
5. Guarda y haz un nuevo deploy

---

## 📝 Configuración Manual (Alternativa)

Si prefieres configurar manualmente después del primer deploy:

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → General
3. **Root Directory:** `frontend`
4. Settings → Build & Development Settings
5. **Install Command:** `pnpm install`
6. **Build Command:** `pnpm build`
7. Guarda cambios
8. Haz un nuevo deploy

---

## ✅ Verificación Final

Una vez desplegado:

- [ ] URL accesible
- [ ] Muestra página de login
- [ ] No hay errores en consola del navegador
- [ ] Build exitoso en Vercel

---

## 🔗 URLs

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Repositorio:** https://github.com/ralborta/barrios

---

## 💡 Nota

Si ya tienes un proyecto vinculado incorrectamente, puedes:
1. Eliminarlo desde Vercel Dashboard
2. Crear uno nuevo siguiendo estos pasos
3. O editar el proyecto existente y cambiar el Root Directory
