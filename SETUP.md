# Guía de Setup Inicial

## Requisitos Previos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado y corriendo
- pnpm instalado (recomendado) o npm

### Instalar pnpm (si no lo tienes)

```bash
npm install -g pnpm
```

## Paso 1: Clonar y Configurar

```bash
# Ya estás en el directorio del proyecto
cd /Users/ralborta/barrios
```

## Paso 2: Configurar Backend

```bash
cd backend

# Instalar dependencias
pnpm install

# Copiar archivo de entorno
cp env.example .env

# Editar .env con tus credenciales
# Especialmente importante:
# - DATABASE_URL
# - JWT_SECRET (generar uno aleatorio)
```

### Generar JWT Secret

```bash
# Opción 1: Usar openssl
openssl rand -base64 32

# Opción 2: Usar Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Configurar Base de Datos

```bash
# Asegúrate de tener PostgreSQL corriendo
# Crear la base de datos
createdb barrios

# O usando psql
psql -U postgres -c "CREATE DATABASE barrios;"

# Actualizar DATABASE_URL en .env
# Ejemplo: postgresql://usuario:password@localhost:5432/barrios?schema=public
```

## Paso 3: Ejecutar Migraciones

```bash
# Generar Prisma Client
pnpm prisma:generate

# Crear migraciones iniciales
pnpm prisma:migrate

# (Opcional) Abrir Prisma Studio para ver la DB
pnpm prisma:studio
```

## Paso 4: Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
pnpm install

# Copiar archivo de entorno
cp env.local.example .env.local

# Editar .env.local si es necesario
# Por defecto apunta a http://localhost:3001
```

## Paso 5: Inicializar shadcn/ui (Opcional)

Si quieres agregar componentes de shadcn/ui:

```bash
cd frontend
npx shadcn-ui@latest init
# Seguir las instrucciones
```

## Paso 6: Ejecutar el Proyecto

### Terminal 1: Backend

```bash
cd backend
pnpm dev
```

El backend debería estar corriendo en `http://localhost:3001`

### Terminal 2: Frontend

```bash
cd frontend
pnpm dev
```

El frontend debería estar corriendo en `http://localhost:3000`

## Verificar que Todo Funciona

1. **Backend Health Check**: Visitar `http://localhost:3001/health`
   - Debería devolver: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: Visitar `http://localhost:3000`
   - Debería mostrar la página de inicio

3. **Prisma Studio**: `cd backend && pnpm prisma:studio`
   - Debería abrir una interfaz web para ver la base de datos

## Próximos Pasos

1. Crear usuario administrador (cuando esté implementada la autenticación)
2. Configurar integración WhatsApp
3. Configurar SMTP para emails
4. Cargar datos de prueba (vecinos, períodos)

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
cd backend
pnpm prisma:generate
```

### Error de conexión a PostgreSQL

- Verificar que PostgreSQL esté corriendo
- Verificar DATABASE_URL en `.env`
- Verificar credenciales de usuario

### Error: "Port 3000/3001 already in use"

Cambiar el puerto en:
- Backend: Variable `PORT` en `.env`
- Frontend: `next.config.js` o variable de entorno

### Error de TypeScript

```bash
# Backend
cd backend
pnpm type-check

# Frontend
cd frontend
pnpm type-check
```

## Estructura de Carpetas Esperada

Después del setup, deberías tener:

```
barrios/
├── backend/
│   ├── .env (creado por ti)
│   ├── node_modules/
│   ├── prisma/
│   │   └── migrations/ (creado después de migrate)
│   └── src/
├── frontend/
│   ├── .env.local (creado por ti)
│   ├── node_modules/
│   ├── .next/ (creado después de build)
│   └── app/
└── docs/
```

¡Listo para empezar a desarrollar! 🚀
