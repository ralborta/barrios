# 🏗️ Arquitectura de Deploy - Explicación Clara

## 📦 Dos Proyectos SEPARADOS e INDEPENDIENTES

### 1. VERCEL = Frontend (Next.js)
- **Qué es:** Servicio que despliega el FRONTEND
- **Código:** Carpeta `frontend/`
- **Tecnología:** Next.js, React, TypeScript
- **URL resultante:** `https://barrios.vercel.app` (ejemplo)
- **Qué hace:** Muestra la interfaz web al usuario

### 2. RAILWAY = Backend (Fastify) + Base de Datos
- **Qué es:** Servicio que despliega el BACKEND y PostgreSQL
- **Código:** Carpeta `backend/`
- **Tecnología:** Node.js, Fastify, Prisma, PostgreSQL
- **URL resultante:** `https://barrios-backend.railway.app` (ejemplo)
- **Qué hace:** Proporciona la API REST y guarda datos

---

## 🔗 Cómo se Conectan

```
Usuario → Vercel (Frontend) → Railway (Backend) → PostgreSQL
```

**Flujo:**
1. Usuario visita: `https://barrios.vercel.app`
2. Frontend (Vercel) hace peticiones a: `https://barrios-backend.railway.app/api/...`
3. Backend (Railway) consulta PostgreSQL y responde
4. Frontend muestra los datos al usuario

---

## ⚙️ Configuración Necesaria

### En VERCEL (Frontend):
- Variable de entorno: `NEXT_PUBLIC_API_URL`
- Valor: La URL de Railway (ej: `https://barrios-backend.railway.app`)

### En RAILWAY (Backend):
- Variable de entorno: `FRONTEND_URL`
- Valor: La URL de Vercel (ej: `https://barrios.vercel.app`)
- (Para configurar CORS)

---

## 🚀 Proceso de Deploy

### Paso 1: Crear Proyecto en VERCEL
1. Ve a vercel.com
2. Importa repositorio: `ralborta/barrios`
3. Configura Root Directory: `frontend`
4. Deploy
5. Obtienes URL: `https://barrios-xxx.vercel.app`

### Paso 2: Crear Proyecto en RAILWAY
1. Ve a railway.app
2. Importa repositorio: `ralborta/barrios`
3. Agrega PostgreSQL
4. Configura servicio backend (Root: `backend`)
5. Deploy
6. Obtienes URL: `https://barrios-backend-xxx.railway.app`

### Paso 3: Conectar Ambos
1. En Vercel: Agrega variable `NEXT_PUBLIC_API_URL` = URL de Railway
2. En Railway: Agrega variable `FRONTEND_URL` = URL de Vercel
3. Redeploy ambos

---

## ❓ Preguntas Frecuentes

### ¿Por qué dos proyectos separados?
- **Vercel** es especializado en frontend (Next.js)
- **Railway** es mejor para backend + base de datos
- Cada uno hace lo que mejor sabe hacer

### ¿Se vinculan automáticamente?
- **NO.** Son independientes
- Solo se "conectan" mediante URLs en variables de entorno
- El frontend llama al backend mediante HTTP

### ¿Puedo usar solo uno?
- Técnicamente sí, pero no es recomendado
- Vercel puede hacer backend, pero Railway es mejor para DB
- Railway puede hacer frontend, pero Vercel es mejor para Next.js

### ¿El mismo repositorio?
- **SÍ.** Ambos proyectos apuntan al mismo repo: `ralborta/barrios`
- Pero cada uno usa una carpeta diferente:
  - Vercel usa: `frontend/`
  - Railway usa: `backend/`

---

## 📊 Resumen Visual

```
GitHub: ralborta/barrios
├── frontend/  →  VERCEL  →  https://barrios.vercel.app
└── backend/   →  RAILWAY →  https://barrios-backend.railway.app
                        └── PostgreSQL (dentro de Railway)
```

---

## ✅ Checklist

### Vercel (Frontend)
- [ ] Proyecto creado
- [ ] Root Directory: `frontend`
- [ ] Deploy exitoso
- [ ] URL obtenida
- [ ] Variable `NEXT_PUBLIC_API_URL` configurada (después de Railway)

### Railway (Backend)
- [ ] Proyecto creado
- [ ] PostgreSQL agregado
- [ ] Servicio backend configurado (Root: `backend`)
- [ ] Deploy exitoso
- [ ] URL obtenida
- [ ] Migraciones ejecutadas
- [ ] Variable `FRONTEND_URL` configurada

### Conexión
- [ ] Frontend puede llamar al backend
- [ ] CORS configurado correctamente
- [ ] Todo funciona end-to-end
