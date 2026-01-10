# 🔧 Configurar CORS en Railway

## ❌ Error Actual

```
405 Method Not Allowed
barrios-production.up.railway.app/api/auth/login
```

## 🔍 Causa

El backend está bloqueando las peticiones desde Vercel porque CORS no está configurado correctamente. El backend solo permite el origen configurado en `FRONTEND_URL`.

---

## ✅ Solución: Configurar FRONTEND_URL en Railway

### Paso 1: Obtener URL de Vercel

1. Ve a Vercel Dashboard: https://vercel.com/dashboard
2. Selecciona tu proyecto "barrios"
3. En la página principal, verás la **URL de producción** (ej: `https://barrios.vercel.app`)
4. **Copia la URL completa**

---

### Paso 2: Configurar en Railway

1. Ve a Railway Dashboard: https://railway.app/dashboard
2. Selecciona tu proyecto "barrios"
3. Click en el **servicio backend**
4. Ve a la pestaña **"Variables"** (Variables de Entorno)
5. Busca la variable `FRONTEND_URL`
6. Si **NO existe**, click en **"New Variable"** (Nueva Variable)
7. Completa:
   - **Key (Nombre):** `FRONTEND_URL`
   - **Value (Valor):** Pega la URL de Vercel (ej: `https://barrios.vercel.app`)
   - ⚠️ **IMPORTANTE:** Debe empezar con `https://`
8. Si **YA existe**, click en ella y actualiza el valor
9. Guarda

---

### Paso 3: Redeploy en Railway

**IMPORTANTE:** Después de agregar/modificar la variable, Railway debe redeployar:

1. Railway Dashboard → Tu servicio backend
2. Click en **"Deployments"** (Despliegues)
3. Click en los **tres puntos** (⋯) del último deployment
4. Click en **"Redeploy"** (Redesplegar)
5. O simplemente espera (Railway puede redeployar automáticamente)

---

## 🔍 Verificación

Después del redeploy:

1. Abre tu app en Vercel
2. Intenta hacer login
3. El error 405 debería desaparecer
4. Si sigue fallando, verifica en Railway logs que el backend esté corriendo

---

## 📝 Nota sobre el Código

He actualizado el código para permitir múltiples orígenes:
- La URL configurada en `FRONTEND_URL`
- `http://localhost:3000` (desarrollo local)
- `http://localhost:3001` (por si acaso)

Esto hace que CORS sea más flexible y funcione tanto en desarrollo como en producción.

---

## ✅ Checklist

- [ ] Obtuve la URL de Vercel
- [ ] Agregué/actualicé `FRONTEND_URL` en Railway
- [ ] El valor es la URL completa de Vercel (con `https://`)
- [ ] Hice redeploy en Railway (o esperé el auto-redeploy)
- [ ] Verifiqué que el backend esté corriendo
- [ ] Probé login desde Vercel

---

## 🆘 Si Sigue Fallando

1. **Verifica que el backend esté corriendo:**
   - Railway Dashboard → Logs
   - Debe mostrar: `🚀 Server running on...`

2. **Verifica que CORS esté configurado:**
   - Railway Dashboard → Variables
   - Debe existir: `FRONTEND_URL` = URL de Vercel

3. **Verifica en la consola del navegador:**
   - Abre DevTools → Network
   - Intenta hacer login
   - Verifica si hay errores de CORS (preflight OPTIONS)

4. **Prueba el endpoint directamente:**
   ```bash
   curl -X POST https://tu-backend.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@barrios.com","password":"admin123"}'
   ```

---

## 🎯 Resumen

1. **Vercel:** Copia la URL de producción
2. **Railway:** Agrega variable `FRONTEND_URL` = URL de Vercel
3. **Railway:** Redeploy
4. **Prueba:** Intenta login desde Vercel
