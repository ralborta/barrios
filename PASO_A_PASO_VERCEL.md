# 🚀 Paso a Paso: Configurar API URL en Vercel

## ⚠️ PROBLEMA ACTUAL

El frontend sigue intentando conectarse a `localhost:3001` porque la variable de entorno `NEXT_PUBLIC_API_URL` **NO está configurada en Vercel**.

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Obtener URL de Railway (2 minutos)

1. Abre: **https://railway.app/dashboard**
2. Click en tu proyecto **"barrios"**
3. Click en el **servicio backend** (el que tiene el código)
4. Ve a la pestaña **"Settings"** (Configuración)
5. Click en **"Networking"** (Red)
6. Si NO ves una URL, click en **"Generate Domain"** (Generar Dominio)
7. **COPIA la URL completa** que aparece (ejemplo: `https://barrios-production.up.railway.app`)
   - ⚠️ **IMPORTANTE:** Debe empezar con `https://`
   - ⚠️ **IMPORTANTE:** Copia la URL completa, no solo el dominio

---

### Paso 2: Configurar en Vercel (3 minutos)

1. Abre: **https://vercel.com/dashboard**
2. Click en tu proyecto **"barrios"**
3. En el menú superior, click en **"Settings"** (Configuración)
4. En el menú lateral izquierdo, click en **"Environment Variables"** (Variables de Entorno)
5. Verás una lista de variables (puede estar vacía)
6. Click en el botón **"Add New"** (Agregar Nueva) o **"Add"** (Agregar)
7. Completa el formulario:
   - **Name (Nombre):** `NEXT_PUBLIC_API_URL`
     - ⚠️ **EXACTO:** Debe ser exactamente `NEXT_PUBLIC_API_URL` (con mayúsculas y guiones bajos)
   - **Value (Valor):** Pega la URL de Railway que copiaste
     - Ejemplo: `https://barrios-production.up.railway.app`
     - ⚠️ **IMPORTANTE:** Debe empezar con `https://`
   - **Environment (Entorno):** 
     - ✅ Marca **Production**
     - ✅ Marca **Preview** 
     - ✅ Marca **Development**
     - (O al menos marca **Production**)
8. Click en **"Save"** (Guardar)

---

### Paso 3: REDEPLOY OBLIGATORIO (2 minutos)

**⚠️ CRÍTICO:** Después de agregar la variable, **DEBES hacer redeploy**. Las variables de entorno solo se aplican en nuevos deployments.

#### Opción A: Redeploy desde Vercel (Más Rápido)

1. En Vercel Dashboard, ve a tu proyecto
2. Click en la pestaña **"Deployments"** (Despliegues)
3. Encuentra el **último deployment** (el más reciente)
4. Click en los **tres puntos** (⋯) a la derecha del deployment
5. Click en **"Redeploy"** (Redesplegar)
6. Confirma haciendo click en **"Redeploy"** de nuevo
7. Espera 2-3 minutos a que termine el deploy

#### Opción B: Nuevo Commit (Alternativa)

Si prefieres, puedes hacer un commit vacío:

```bash
git commit --allow-empty -m "Trigger redeploy for environment variables"
git push
```

Vercel detectará el cambio y hará un nuevo deploy automáticamente.

---

### Paso 4: Verificar (1 minuto)

1. Espera a que termine el redeploy (verás "Ready" en verde)
2. Click en el deployment completado
3. Click en **"Visit"** (Visitar) o abre la URL de tu app
4. Abre la **consola del navegador** (F12 o Click derecho → Inspeccionar)
5. Ve a la pestaña **"Network"** (Red)
6. Intenta hacer login
7. Busca la petición a `/api/auth/login`
8. Verifica que la URL sea la de Railway, **NO** `localhost:3001`

---

## 🔍 Cómo Verificar que Funcionó

### En la Consola del Navegador:

1. Abre DevTools (F12)
2. Ve a la pestaña **Console** (Consola)
3. Escribe: `console.log(process.env.NEXT_PUBLIC_API_URL)`
4. Debería mostrar la URL de Railway, **NO** `undefined` o `localhost:3001`

### En la Pestaña Network:

1. Abre DevTools (F12)
2. Ve a la pestaña **Network** (Red)
3. Intenta hacer login
4. Busca la petición `login` o `api/auth/login`
5. Click en ella
6. Ve a la pestaña **Headers** (Encabezados)
7. Verifica que la **Request URL** sea la de Railway

---

## ❌ Errores Comunes

### Error 1: "Sigue mostrando localhost"
**Causa:** No hiciste redeploy después de agregar la variable
**Solución:** Haz redeploy (Paso 3)

### Error 2: "La variable no aparece"
**Causa:** Nombre incorrecto o no guardaste
**Solución:** Verifica que sea exactamente `NEXT_PUBLIC_API_URL` (con mayúsculas)

### Error 3: "Sigue fallando la conexión"
**Causa:** URL incorrecta o backend no está corriendo en Railway
**Solución:** 
- Verifica que la URL de Railway sea correcta
- Verifica que el backend esté desplegado en Railway
- Prueba la URL directamente: `https://tu-backend.railway.app/health`

---

## ✅ Checklist Final

- [ ] Obtuve la URL de Railway
- [ ] Agregué `NEXT_PUBLIC_API_URL` en Vercel
- [ ] El valor es la URL completa de Railway (con `https://`)
- [ ] Configuré para Production (y Preview/Development)
- [ ] Guardé la variable
- [ ] Hice redeploy del proyecto
- [ ] Verifiqué en la consola que la variable está configurada
- [ ] Verifiqué en Network que las peticiones van a Railway

---

## 🆘 Si Aún No Funciona

1. **Verifica que el backend esté corriendo en Railway:**
   - Abre la URL de Railway directamente: `https://tu-backend.railway.app/health`
   - Debería responder: `{"status":"ok",...}`

2. **Verifica CORS en Railway:**
   - Railway Dashboard → Variables de Entorno
   - Debe existir: `FRONTEND_URL` = URL de Vercel

3. **Verifica en Vercel que la variable esté:**
   - Vercel Dashboard → Settings → Environment Variables
   - Debe aparecer `NEXT_PUBLIC_API_URL` con el valor correcto

4. **Verifica que hayas hecho redeploy:**
   - Las variables solo se aplican en nuevos deployments

---

## 📞 Resumen Rápido

1. **Railway:** Copia la URL del backend
2. **Vercel:** Agrega variable `NEXT_PUBLIC_API_URL` = URL de Railway
3. **Vercel:** Haz redeploy
4. **Verifica:** Abre la app y prueba login
