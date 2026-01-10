# 🔧 Configurar API URL en Vercel

## ❌ Problema

El frontend en Vercel sigue intentando conectarse a `localhost:3001` en lugar de la URL de Railway.

## 🔍 Causa

La variable de entorno `NEXT_PUBLIC_API_URL` no está configurada en Vercel, por lo que el código usa el valor por defecto: `http://localhost:3001`.

---

## ✅ Solución: Configurar en Vercel

### Paso 1: Obtener URL de Railway

1. Ve a Railway Dashboard: https://railway.app/dashboard
2. Selecciona tu proyecto "barrios"
3. Click en el servicio backend
4. **Settings** → **Networking**
5. Si no tienes dominio, click en **"Generate Domain"**
6. **Copia la URL completa** (ej: `https://barrios-production.up.railway.app`)

### Paso 2: Configurar en Vercel

1. Ve a Vercel Dashboard: https://vercel.com/dashboard
2. Selecciona tu proyecto "barrios"
3. Click en **Settings** (Configuración)
4. En el menú lateral, click en **Environment Variables** (Variables de Entorno)
5. Click en **Add New** (Agregar Nueva)
6. Completa:
   - **Key (Nombre):** `NEXT_PUBLIC_API_URL`
   - **Value (Valor):** `https://tu-backend.railway.app` (la URL que copiaste de Railway)
   - **Environment (Entorno):** Selecciona **Production**, **Preview**, y **Development** (o al menos Production)
7. Click en **Save** (Guardar)

### Paso 3: Redeploy

**IMPORTANTE:** Después de agregar la variable de entorno, debes hacer un **Redeploy**:

1. En Vercel Dashboard, ve a tu proyecto
2. Click en la pestaña **Deployments**
3. Encuentra el último deployment
4. Click en los **tres puntos** (⋯) → **Redeploy**
5. O simplemente haz un nuevo commit y push (Vercel redeployará automáticamente)

---

## 🔍 Verificación

Después del redeploy:

1. Abre tu aplicación en Vercel
2. Abre la consola del navegador (F12)
3. Intenta hacer login
4. Verifica que las peticiones vayan a la URL de Railway, no a `localhost:3001`

---

## 📝 Nota Importante

- Las variables de entorno que empiezan con `NEXT_PUBLIC_` son accesibles en el cliente (navegador)
- Después de agregar/modificar variables de entorno, **SIEMPRE** necesitas hacer redeploy
- El código usa: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`
  - Si la variable no existe, usa `localhost:3001` (por eso ves ese error)

---

## ✅ Checklist

- [ ] Obtuve la URL de Railway
- [ ] Agregué `NEXT_PUBLIC_API_URL` en Vercel
- [ ] Configuré para Production, Preview y Development
- [ ] Hice redeploy del proyecto
- [ ] Verifiqué que las peticiones van a Railway

---

## 🆘 Si Sigue Fallando

1. **Verifica que la variable esté configurada:**
   - Vercel Dashboard → Settings → Environment Variables
   - Debe aparecer `NEXT_PUBLIC_API_URL`

2. **Verifica que hayas hecho redeploy:**
   - Las variables de entorno solo se aplican en nuevos deployments

3. **Verifica en la consola del navegador:**
   - Abre DevTools → Network
   - Intenta hacer login
   - Verifica a qué URL se está haciendo la petición

4. **Verifica CORS en Railway:**
   - El backend debe permitir el origen de Vercel
   - Variable `FRONTEND_URL` en Railway debe ser la URL de Vercel
