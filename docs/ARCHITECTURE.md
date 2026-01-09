# Arquitectura del Sistema

## Visión General

El sistema está compuesto por dos aplicaciones principales:

1. **Frontend (Next.js)**: Interfaz de usuario para administradores
2. **Backend (Fastify)**: API REST monolítica que gestiona toda la lógica de negocio

## Arquitectura de Alto Nivel

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   Vercel        │
└────────┬────────┘
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend       │
│   (Fastify)     │
│   Railway       │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼──┐  ┌────▼────┐ ┌───▼────┐
│PostgreSQL│ │WhatsApp│ │  Email  │ │Storage │
│         │ │Gateway │ │  SMTP  │ │(Local) │
└────────┘ └────────┘ └────────┘ └────────┘
```

## Flujo de Datos

### 1. Gestión de Expensas

```
Usuario → Frontend → Backend API → Prisma → PostgreSQL
                              ↓
                         Estado actualizado
                              ↓
                    Jobs programados (Railway Cron)
                              ↓
                    WhatsApp/Email Services
```

### 2. Recepción de Comprobantes

```
WhatsApp → Webhook → Backend API → Storage → DB
                              ↓
                    Notificación a Frontend
```

### 3. Jobs Programados

```
Railway Cron → Backend Jobs
                    ├─→ Seguimiento diario
                    ├─→ Cierre de mes
                    └─→ Cambio de estado
```

## Modelo de Datos

### Entidades Principales

- **Country**: Barrio/Country
- **Vecino**: Propietario/Inquilino
- **Periodo**: Mes/año de expensas
- **Expensa**: Expensa individual por vecino
- **Mensaje**: Comunicación (WhatsApp/Email)
- **Comprobante**: Archivo de pago recibido
- **Usuario**: Administrador del sistema

### Relaciones

```
Country
  ├─→ Vecino (1:N)
  └─→ Periodo (1:N)

Periodo
  └─→ Expensa (1:N)

Vecino
  ├─→ Expensa (1:N)
  ├─→ Mensaje (1:N)
  └─→ Comprobante (1:N)

Expensa
  ├─→ Mensaje (1:N)
  └─→ Comprobante (1:N)
```

## Estados y Transiciones

### Estados de Expensa

```
PENDIENTE
  ↓
PAGO_INFORMADO
  ↓
CONFIRMADO
  ↓
EN_MORA (si no paga)
  ↓
EN_RECUPERO (mes 3)
```

### Ciclo de Seguimiento

1. **Emisión**: Estado PENDIENTE
2. **Vencimiento**: Identificación automática
3. **Seguimiento**: Cada 5 días (hasta 3 meses)
4. **Cierre de mes**: Aplicación de intereses
5. **Mes 2**: Estado EN_MORA
6. **Mes 3**: Estado EN_RECUPERO

## Servicios

### WhatsApp Service

- Envío de mensajes
- Recepción de webhooks
- Manejo de comprobantes (imágenes/PDFs)

### Email Service

- Envío de facturas
- Recordatorios
- Comunicaciones formales

### CSV Service

- Importación de vecinos
- Importación de estados
- Validación y preview

## Seguridad

### Autenticación

- JWT tokens
- Refresh tokens (futuro)
- Middleware de autenticación en todas las rutas protegidas

### Autorización

- Roles: ADMINISTRADOR, OPERADOR, LECTURA
- Permisos por acción
- Validación en backend (nunca confiar en frontend)

## Escalabilidad

### Actual (MVP)

- API monolítica
- PostgreSQL único
- Jobs en Railway Cron
- Storage local

### Futuro

- Posible separación de servicios
- CDN para comprobantes (S3)
- Cola de mensajes (Bull/BullMQ)
- Cache (Redis)

## Consideraciones de Performance

- Índices en Prisma para consultas frecuentes
- Paginación en todas las listas
- Lazy loading en frontend
- Optimización de queries N+1
