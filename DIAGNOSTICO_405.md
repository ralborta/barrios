# 🔍 Diagnóstico: Error 405 Method Not Allowed

## ✅ Lo que SABEMOS que está bien:

1. **Backend está corriendo:** Los logs muestran `🚀 Server running on http://localhost:8080`
2. **El servicio está Online:** Railway muestra "Online"
3. **El frontend se conecta:** Ya no hay error de `localhost:3001`, ahora va a Railway

## ❌ El problema:

Error `405 Method Not Allowed` en `/api/auth/login`

---

## 🔍 Posibles Causas:

### 1. El método HTTP no está permitido
- El frontend envía `POST`
- Pero el backend puede estar esperando otro método
- O la ruta no está registrada correctamente

### 2. Problema con CORS preflight
- El navegador hace una petición `OPTIONS` primero (preflight)
- Si el backend no responde correctamente a `OPTIONS`, puede causar 405

### 3. La ruta no está registrada
- Las rutas pueden no estar registradas correctamente
- O hay un problema con el orden de registro

---

## ✅ Soluciones a Probar:

### Solución 1: Verificar que la ruta esté registrada

Abre en tu navegador directamente:

```
https://barrios-production.up.railway.app/health
```

**Debería responder:**
```json
{"status":"ok","timestamp":"..."}
```

Si esto funciona, el backend está respondiendo ✅

---

### Solución 2: Probar el login directamente

Abre la consola del navegador (F12) en tu app de Vercel y ejecuta:

```javascript
fetch('https://barrios-production.up.railway.app/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@barrios.com',
    password: 'admin123'
  })
})
.then(async r => {
  console.log('Status:', r.status);
  console.log('Headers:', [...r.headers.entries()]);
  const text = await r.text();
  console.log('Response:', text);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
})
.then(console.log)
.catch(console.error)
```

**Esto te dirá:**
- El status code exacto
- Los headers de respuesta
- El contenido de la respuesta

---

### Solución 3: Verificar en Railway Logs

1. Railway Dashboard → Tu servicio backend
2. **HTTP Logs** tab (no Deploy Logs)
3. Intenta hacer login desde Vercel
4. Deberías ver la petición entrante en los logs
5. Verifica qué está pasando con la petición

---

### Solución 4: Verificar Variables de Entorno

1. Railway Dashboard → Tu servicio backend
2. **Variables** tab
3. Verifica que existan:
   - `DATABASE_URL` ✅
   - `JWT_SECRET` ✅
   - `PORT` (Railway lo asigna automáticamente) ✅
   - `FRONTEND_URL` = URL de Vercel ⚠️

**Si falta `FRONTEND_URL`:**
- Agrégalo con la URL de Vercel
- Haz redeploy

---

## 🆘 Si Nada Funciona:

### Opción A: Verificar que las rutas estén correctas

El código muestra que las rutas están registradas así:
```typescript
await fastify.register(authRoutes);
```

Y en `auth.ts`:
```typescript
fastify.post('/api/auth/login', ...)
```

Esto debería funcionar. Si no, puede haber un problema con el orden de registro o con Fastify.

### Opción B: Simplificar CORS temporalmente

Puedo actualizar el código para permitir todos los orígenes temporalmente y ver si eso resuelve el problema.

---

## 📝 Próximos Pasos:

1. **Prueba el health check** (Solución 1)
2. **Prueba el login directamente** (Solución 2)
3. **Revisa los HTTP Logs en Railway** (Solución 3)
4. **Verifica las variables de entorno** (Solución 4)

**Comparte los resultados** y te ayudo a diagnosticar mejor.
