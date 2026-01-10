# 🧪 Test Directo del Backend

## 🔍 Diagnóstico Profundo del Error 405

Antes de seguir haciendo cambios, necesitamos **verificar exactamente qué está pasando**.

---

## ✅ Test 1: Health Check

Abre en tu navegador:

```
https://barrios-production.up.railway.app/health
```

**Resultado esperado:**
```json
{"status":"ok","timestamp":"..."}
```

**Si funciona:** El backend está corriendo ✅
**Si NO funciona:** El backend no está accesible ❌

---

## ✅ Test 2: Login Directo desde Navegador

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
  console.log('=== RESPUESTA ===');
  console.log('Status:', r.status);
  console.log('Status Text:', r.statusText);
  console.log('Headers:', Object.fromEntries(r.headers.entries()));
  const text = await r.text();
  console.log('Body (text):', text);
  try {
    const json = JSON.parse(text);
    console.log('Body (JSON):', json);
  } catch {
    console.log('Body no es JSON válido');
  }
  return r;
})
.catch(err => {
  console.error('=== ERROR ===');
  console.error(err);
})
```

**Esto te dirá:**
- El status code exacto
- Los headers de respuesta
- El contenido de la respuesta
- Si hay algún error de red

---

## ✅ Test 3: Verificar Rutas en Railway Logs

1. Railway Dashboard → Tu servicio backend
2. **HTTP Logs** tab (no Deploy Logs)
3. Intenta hacer login desde Vercel
4. Deberías ver la petición entrante

**Busca:**
- ¿Aparece la petición POST a `/api/auth/login`?
- ¿Qué status code devuelve?
- ¿Hay algún error en los logs?

---

## ✅ Test 4: Verificar que las Rutas Estén Compiladas

El problema podría ser que las rutas no se están compilando correctamente.

**En Railway:**
1. Railway Dashboard → Tu servicio backend
2. **Deploy Logs** tab
3. Busca la línea que dice: `RUN npm run build`
4. Verifica que no haya errores de compilación
5. Busca: `RUN ls -la dist/` (si agregamos ese comando)
6. Verifica que exista `dist/index.js` y `dist/routes/auth.js`

---

## 🎯 Análisis del Error 405

El error **405 Method Not Allowed** específicamente significa:

1. **La ruta existe** (si no existiera sería 404)
2. **El método HTTP no está permitido** para esa ruta
3. **El servidor recibió la petición** pero la rechazó

**Posibles causas:**
- CORS está bloqueando el preflight OPTIONS
- Fastify no está registrando las rutas correctamente
- Hay un middleware que está interceptando
- El código compilado no tiene las rutas

---

## 📝 Comparte los Resultados

Después de hacer estos tests, comparte:
1. ¿El health check funciona?
2. ¿Qué muestra el test directo del login?
3. ¿Qué aparece en los HTTP Logs?
4. ¿Hay errores en el build?

Con esta información podremos diagnosticar exactamente qué está pasando.
