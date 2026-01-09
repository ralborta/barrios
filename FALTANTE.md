# Código Faltante - Análisis Completo

## ✅ COMPLETADO

### Backend
- ✅ Autenticación JWT
- ✅ CRUD de Usuarios
- ✅ CRUD de Countries
- ✅ CRUD de Vecinos
- ✅ CRUD de Períodos
- ✅ CRUD de Expensas

### Frontend
- ✅ Layout con sidebar y topbar
- ✅ Página de login
- ✅ Dashboard con KPIs
- ✅ Tabla de vecinos (con datos reales)
- ✅ Cliente API y hooks

---

## ❌ FALTANTE - Prioridad ALTA (MVP)

### Backend

#### 1. CRUD de Comprobantes
- [ ] `routes/comprobantes.ts`
  - GET `/api/comprobantes` - Listar con filtros
  - GET `/api/comprobantes/:id` - Obtener uno
  - POST `/api/comprobantes` - Crear (con upload)
  - PUT `/api/comprobantes/:id` - Actualizar estado
  - DELETE `/api/comprobantes/:id` - Eliminar

#### 2. CRUD de Mensajes
- [ ] `routes/mensajes.ts`
  - GET `/api/mensajes` - Listar con filtros
  - GET `/api/mensajes/:id` - Obtener uno
  - POST `/api/mensajes` - Crear/enviar mensaje
  - GET `/api/mensajes/expensa/:expensaId` - Mensajes de una expensa

#### 3. Upload de Archivos
- [ ] Configurar storage local/S3
- [ ] Middleware de upload
- [ ] Endpoint para subir comprobantes

#### 4. Servicio de Email
- [ ] `services/email.service.ts`
  - Enviar factura
  - Enviar recordatorio
  - Enviar comunicación de mora

#### 5. Servicio de WhatsApp (básico)
- [ ] `services/whatsapp.service.ts`
  - Enviar mensaje
  - Recibir webhook
  - Procesar comprobantes recibidos

---

### Frontend

#### 1. Página de Gestión de Expensas
- [ ] `app/(dashboard)/expensas/page.tsx`
  - Tabla con TanStack Table
  - Filtros por estado, período, vecino
  - Acciones masivas
  - Formulario de creación/edición

#### 2. Ficha de Vecino (Mini CRM)
- [ ] `app/(dashboard)/vecinos/[id]/page.tsx`
  - Resumen administrativo
  - Timeline de mensajes
  - Lista de comprobantes
  - Historial de expensas
  - Acciones manuales

#### 3. Bandeja de Comprobantes
- [ ] `app/(dashboard)/comprobantes/page.tsx`
  - Lista de comprobantes pendientes
  - Vista previa de archivos
  - Cambiar estado (nuevo/revisado/confirmado)
  - Vincular a expensa

#### 4. Formularios de Creación/Edición
- [ ] Formulario de vecino (React Hook Form + Zod)
- [ ] Formulario de período
- [ ] Formulario de expensa
- [ ] Formulario de country

#### 5. Página de Importación CSV
- [ ] `app/(dashboard)/importar/page.tsx`
  - Upload de archivo CSV
  - Preview de datos
  - Validación
  - Confirmación e importación

---

## ⚠️ FALTANTE - Prioridad MEDIA

### Backend

#### 1. Jobs Programados
- [ ] `jobs/seguimiento.job.ts` - Seguimiento diario
- [ ] `jobs/cierre-mes.job.ts` - Cierre de mes
- [ ] `jobs/cambio-estado.job.ts` - Cambio a mora/recupero
- [ ] Configurar Railway Cron

#### 2. Servicio de Importación CSV
- [ ] `services/csv.service.ts`
  - Parsear CSV
  - Validar datos
  - Importar vecinos
  - Importar expensas
  - Importar estados

#### 3. Lógica de Estados
- [ ] Transiciones de estado automáticas
- [ ] Cálculo de fechas de seguimiento
- [ ] Aplicación de intereses

---

### Frontend

#### 1. Página de Reportes
- [ ] `app/(dashboard)/reportes/page.tsx`
  - Filtros de fecha/período
  - Gráficos y estadísticas
  - Exportación CSV/Excel

#### 2. Mejoras de UX
- [ ] Loading states en todas las páginas
- [ ] Manejo de errores mejorado
- [ ] Toasts/notificaciones
- [ ] Confirmaciones de acciones críticas

---

## 🔮 FALTANTE - Prioridad BAJA (Post-MVP)

### Backend
- [ ] Webhooks avanzados
- [ ] Integración con recaudadora
- [ ] Cache (Redis)
- [ ] Rate limiting

### Frontend
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda global avanzada
- [ ] Filtros guardados
- [ ] Exportación de reportes complejos

---

## 📊 RESUMEN POR PRIORIDAD

### Para MVP Funcional (2-3 semanas)
1. ✅ CRUDs básicos (hecho)
2. ❌ Comprobantes (CRUD + upload)
3. ❌ Mensajes (CRUD básico)
4. ❌ Email service (básico)
5. ❌ WhatsApp service (básico)
6. ❌ Formularios frontend
7. ❌ Ficha de vecino
8. ❌ Bandeja de comprobantes
9. ❌ Importación CSV básica

### Para MVP Completo (4-6 semanas)
10. ❌ Jobs programados
11. ❌ Lógica de estados automática
12. ❌ Reportes básicos
13. ❌ Mejoras de UX

---

## 🎯 RECOMENDACIÓN

**Empezar con:**
1. Comprobantes (CRUD + upload) - CRÍTICO
2. Formularios frontend - CRÍTICO
3. Ficha de vecino - IMPORTANTE
4. Email service básico - IMPORTANTE
5. Mensajes (CRUD) - IMPORTANTE

Esto daría un MVP funcional donde se puede:
- Gestionar expensas completas
- Recibir y revisar comprobantes
- Ver historial de vecinos
- Enviar emails básicos
