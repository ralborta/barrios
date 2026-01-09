# Centro de Gestión Administrativa de Expensas y Seguimiento Multicanal

## 📋 Descripción General

Plataforma web diseñada para **barrios cerrados y countries** que ordena, automatiza y centraliza la comunicación administrativa relacionada con expensas y su seguimiento, utilizando **WhatsApp y email** como canales principales.

El sistema se enfoca en la **gestión operativa y comunicacional**, no en la conciliación contable.

## 🎯 Objetivos

- Comunicar expensas de forma clara y consistente
- Realizar seguimientos automáticos por etapas
- Centralizar comprobantes enviados por vecinos
- Mantener trazabilidad completa de las interacciones
- Reducir conflictos, llamadas y trabajo manual

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** (componentes UI)
- **Radix UI** (base de accesibilidad)
- **TanStack Table** (tablas avanzadas)
- **Recharts** (gráficos simples)
- **React Hook Form + Zod** (formularios)
- **Despliegue:** Vercel

### Backend
- **Node.js**
- **Fastify**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Despliegue:** Railway

### Comunicación
- **WhatsApp** (gateway existente / builderbot / proveedor compatible)
- **Email** (SMTP / Sendgrid / Mailgun)

### Automatización
- **Railway Cron** para jobs programados

## 📁 Estructura del Proyecto

```
barrios/
├── frontend/          # Next.js App
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── ...
├── backend/           # Fastify API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── jobs/
│   │   └── ...
│   └── prisma/
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- PostgreSQL 14+
- pnpm (recomendado) o npm

### Instalación

```bash
# Instalar dependencias del frontend
cd frontend
pnpm install

# Instalar dependencias del backend
cd ../backend
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Configurar base de datos
pnpm prisma migrate dev
pnpm prisma generate
```

### Desarrollo

```bash
# Terminal 1: Backend
cd backend
pnpm dev

# Terminal 2: Frontend
cd frontend
pnpm dev
```

## 📚 Funcionalidades Principales

### 1. Ciclo Mensual de Expensas
- Emisión (WhatsApp + Email)
- Vencimiento (identificación automática)
- Seguimiento periódico (cada 5 días)
- Cierre de mes
- Mes 2 - Mora
- Mes 3 - Recupero

### 2. Estados Operativos
- Pendiente
- Pago informado
- Confirmado
- En mora
- En recupero
- Sin respuesta
- Pausado

### 3. Gestión de Comprobantes
- Recepción por WhatsApp
- Almacenamiento centralizado
- Vinculación a períodos
- Estados: nuevo / revisado / confirmado

### 4. Centro de Gestión Web
- Dashboard con KPIs
- Gestión de expensas/períodos
- Directorio de vecinos
- Ficha del vecino (mini CRM)
- Bandeja de comprobantes
- Importación CSV/Excel
- Reportes y exportes

## 🔐 Seguridad y Roles

- Autenticación JWT
- Roles: Administrador, Operador, Lectura
- Acciones críticas con confirmación

## 📝 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
WHATSAPP_API_KEY="..."
EMAIL_SMTP_HOST="..."
EMAIL_SMTP_USER="..."
EMAIL_SMTP_PASS="..."
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## 🧪 Testing

```bash
# Backend
cd backend
pnpm test

# Frontend
cd frontend
pnpm test
```

## 📦 Despliegue

### Backend (Railway)
1. Conectar repositorio
2. Configurar variables de entorno
3. Configurar PostgreSQL
4. Configurar Railway Cron para jobs

### Frontend (Vercel)
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático en push

## 📖 Documentación Adicional

- [Guía de Desarrollo](./docs/DEVELOPMENT.md)
- [Arquitectura](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)

## 👥 Contribución

Este es un proyecto privado. Para contribuciones, contactar al equipo de desarrollo.

## 📄 Licencia

Privado - Todos los derechos reservados
