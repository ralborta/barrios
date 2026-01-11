import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { hashPassword } from './utils/password.js';
import { authRoutes } from './routes/auth.js';
import { vecinosRoutes } from './routes/vecinos.js';
import { countriesRoutes } from './routes/countries.js';
import { periodosRoutes } from './routes/periodos.js';
import { expensasRoutes } from './routes/expensas.js';
import { comprobantesRoutes } from './routes/comprobantes.js';
import { mensajesRoutes } from './routes/mensajes.js';
import { importRoutes } from './routes/import.js';
import { pagosRoutes } from './routes/pagos.js';
import { jobsRoutes } from './routes/jobs.js';
import { webhooksRoutes } from './routes/webhooks.js';
import cron from 'node-cron';

const prisma = new PrismaClient();

// Función para verificar si las tablas y campos necesarios existen
async function checkDatabaseSetup() {
  try {
    // Verificar tabla usuarios
    await prisma.$queryRaw`SELECT 1 FROM usuarios LIMIT 1`;
    
    // Verificar tabla pagos (nueva)
    try {
      await prisma.$queryRaw`SELECT 1 FROM pagos LIMIT 1`;
    } catch {
      console.log('⚠️  Tabla "pagos" no existe, necesita migración');
      return false;
    }
    
    // Verificar campos de boleta en expensas
    try {
      await prisma.$queryRaw`SELECT "boletaUrl" FROM expensas LIMIT 1`;
    } catch {
      console.log('⚠️  Campos de boleta no existen en "expensas", necesita migración');
      return false;
    }
    
    // Verificar campo pagoId en comprobantes
    try {
      await prisma.$queryRaw`SELECT "pagoId" FROM comprobantes LIMIT 1`;
    } catch {
      console.log('⚠️  Campo "pagoId" no existe en "comprobantes", necesita migración');
      return false;
    }
    
    return true;
  } catch (error: any) {
    // Si la tabla no existe, el error contendrá "does not exist"
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      return false;
    }
    // Si hay un error de conexión, asumir que las tablas no existen
    // (será manejado por el try-catch de la conexión principal)
    if (error?.message?.includes('Can\'t reach database') || error?.code === 'P1001') {
      return false;
    }
    // Para otros errores, loguear pero no crashear - asumir que las tablas existen
    console.warn('⚠️  Error verificando setup de DB, asumiendo que las tablas existen:', error?.message);
    return true;
  }
}

// Función para setup automático de la base de datos
async function setupDatabase() {
  console.log('📦 Database tables not found. Setting up database...');
  
  try {
    // Ejecutar prisma db push para crear las tablas
    console.log('🔧 Creating database tables...');
    try {
      execSync('pnpm prisma db push --accept-data-loss', { 
        stdio: 'inherit',
        env: { ...process.env },
        cwd: process.cwd()
      });
      console.log('✅ Database tables created');
    } catch (execError: any) {
      console.error('❌ Error executing prisma db push:', execError.message);
      // Intentar con npx como fallback
      try {
        console.log('🔄 Trying with npx...');
        execSync('npx prisma db push --accept-data-loss', { 
          stdio: 'inherit',
          env: { ...process.env },
          cwd: process.cwd()
        });
        console.log('✅ Database tables created (via npx)');
      } catch (npxError: any) {
        console.error('❌ Error with npx as well:', npxError.message);
        throw new Error('Failed to create database tables. Please run "pnpm prisma db push" manually.');
      }
    }
    
    // Ejecutar seed para crear usuarios
    console.log('🌱 Seeding database...');
    const adminEmail = 'admin@barrios.com';
    const adminPassword = 'admin123';
    
    const existingAdmin = await prisma.usuario.findUnique({
      where: { email: adminEmail },
    });
    
    if (!existingAdmin) {
      await prisma.usuario.create({
        data: {
          email: adminEmail,
          nombre: 'Administrador',
          passwordHash: hashPassword(adminPassword),
          rol: 'ADMINISTRADOR',
          activo: true,
        },
      });
      console.log('✅ Admin user created');
    }
    
    const operatorEmail = 'operador@barrios.com';
    const operatorPassword = 'operador123';
    
    const existingOperator = await prisma.usuario.findUnique({
      where: { email: operatorEmail },
    });
    
    if (!existingOperator) {
      await prisma.usuario.create({
        data: {
          email: operatorEmail,
          nombre: 'Operador',
          passwordHash: hashPassword(operatorPassword),
          rol: 'OPERADOR',
          activo: true,
        },
      });
      console.log('✅ Operator user created');
    }
    
    console.log('✅ Database setup completed');
  } catch (error: any) {
    console.error('❌ Error setting up database:');
    console.error('   Message:', error?.message || error);
    console.error('   Stack:', error?.stack);
    console.error('');
    console.error('💡 If this persists, try running manually:');
    console.error('   railway run --service backend pnpm db:setup');
    console.error('   or');
    console.error('   pnpm prisma db push && pnpm prisma:seed');
    throw error;
  }
}

// Start server - Todo envuelto en función async
async function start() {
  const fastify = Fastify({
    logger: true,
  });

  try {
    // IMPORTANTE: Registrar CORS PRIMERO para que siempre esté disponible
    // incluso si la conexión a la DB falla
    await fastify.register(cors, {
      origin: true, // Permitir todos los orígenes (más simple y funciona mejor)
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Webhook-Secret'],
      preflight: true, // Habilitar preflight explícitamente
    });

    // Validar variables de entorno críticas ANTES de continuar
    if (!process.env.DATABASE_URL) {
      throw new Error('❌ DATABASE_URL environment variable is required but not found');
    }

    // Conectar Prisma al inicio (fail fast)
    // Si falta DATABASE_URL o hay error de conexión, el servicio falla al boot
    console.log('🔌 Connecting to database...');
    
    // Mostrar información del DATABASE_URL sin exponer credenciales
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        console.log('📡 Database host:', url.hostname);
        console.log('📡 Database port:', url.port || '5432 (default)');
        console.log('📡 Database name:', url.pathname.replace('/', ''));
      } catch {
        console.log('📡 DATABASE_URL:', `${process.env.DATABASE_URL.substring(0, 30)}...`);
      }
    } else {
      console.error('❌ DATABASE_URL is NOT SET');
    }
    
    try {
      await prisma.$connect();
      console.log('✅ Prisma connected successfully');
    } catch (dbError: any) {
      console.error('❌ Database connection failed:');
      console.error('   Error:', dbError.message);
      console.error('   Code:', dbError.code || 'N/A');
      
      // Información adicional para debugging
      if (process.env.DATABASE_URL) {
        try {
          const url = new URL(process.env.DATABASE_URL);
          if (url.hostname === 'postgres.railway.internal') {
            console.error('');
            console.error('⚠️  Estás usando postgres.railway.internal (URL interna)');
            console.error('   Esto solo funciona si:');
            console.error('   1. El servicio Postgres está en el mismo proyecto');
            console.error('   2. Ambos servicios están "Online"');
            console.error('   Si no funciona, usa la URL pública del Postgres');
          }
        } catch {}
      }
      
      console.error('');
      console.error('💡 Verifica en Railway:');
      console.error('   1. El servicio Postgres está en el mismo proyecto');
      console.error('   2. DATABASE_URL está configurado correctamente');
      console.error('   3. El servicio Postgres está "Online"');
      console.error('   4. Si usas postgres.railway.internal, prueba con la URL pública');
      throw new Error(`Database connection failed: ${dbError.message}`);
    }
    
    // Verificar y setup automático de la base de datos si es necesario
    // IMPORTANTE: No bloquear el inicio del servidor si hay errores
    // El servidor debe poder responder a peticiones CORS incluso si la DB tiene problemas
    try {
      const dbReady = await checkDatabaseSetup();
      if (!dbReady) {
        console.log('⚠️  Database needs migration, attempting auto-setup...');
        try {
          await setupDatabase();
          console.log('✅ Database migration completed');
        } catch (migrationError: any) {
          console.error('⚠️  Auto-migration failed:', migrationError?.message);
          console.error('⚠️  Server will continue, but some features may not work');
          console.error('💡 Run manually: railway run --service backend pnpm db:migrate');
        }
      } else {
        console.log('✅ Database tables already exist');
      }
    } catch (setupError: any) {
      // Si el setup falla, loguear pero NO crashear el servidor
      // El servidor debe poder responder a peticiones CORS incluso si la DB tiene problemas
      console.error('⚠️  Error checking database setup:', setupError?.message);
      console.error('⚠️  Server will continue, but some features may not work');
      console.error('💡 If tables are missing, run: railway run --service backend pnpm db:migrate');
    }

    // Registrar Prisma como decorator para que esté disponible en todas las rutas
    fastify.decorate('prisma', prisma);

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });

    await fastify.register(multipart);

    // Decorator para autenticación
    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'No autorizado' });
      }
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Routes
    await fastify.register(authRoutes);
    await fastify.register(vecinosRoutes);
    await fastify.register(countriesRoutes);
    await fastify.register(periodosRoutes);
    await fastify.register(expensasRoutes);
    await fastify.register(comprobantesRoutes);
    await fastify.register(mensajesRoutes);
    await fastify.register(importRoutes);
    await fastify.register(pagosRoutes);
    await fastify.register(jobsRoutes);
    await fastify.register(webhooksRoutes);
    
    // Configurar cronjobs (ejecutar cada hora)
    // En producción, esto se puede configurar desde variables de entorno
    if (process.env.ENABLE_CRONJOBS !== 'false') {
      console.log('⏰ Configurando cronjobs...');
      
      // Ejecutar todos los jobs cada hora (a los :00 minutos)
      cron.schedule('0 * * * *', async () => {
        console.log('🔄 Ejecutando jobs programados...');
        try {
          const { ejecutarTodosLosJobs } = await import('./jobs/index.js');
          const resultados = await ejecutarTodosLosJobs();
          console.log('✅ Jobs ejecutados:', resultados);
        } catch (error: any) {
          console.error('❌ Error ejecutando jobs:', error);
        }
      });
      
      console.log('✅ Cronjobs configurados (cada hora)');
    }

    // Error handler con mejor logging
    fastify.setErrorHandler((error, request, reply) => {
      // Log completo del error (incluyendo stack trace)
      fastify.log.error({
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        url: request.url,
        method: request.method,
      });
      
      // Respuesta genérica al cliente (sin exponer detalles)
      reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error',
      });
    });

    // Start server
    const port = Number(process.env.PORT) || 3001;
    console.log(`🔧 Attempting to start server on port ${port}...`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
    console.log(`📦 Database URL configured: ${!!process.env.DATABASE_URL}`);
    
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`✅ Server successfully started on http://0.0.0.0:${port}`);
    console.log(`🌐 Server is ready to accept connections`);
  } catch (err) {
    // Log detallado del error de startup
    if (err instanceof Error) {
      console.error('❌ Error starting server:');
      console.error('   Message:', err.message);
      console.error('   Stack:', err.stack);
    } else {
      console.error('❌ Error starting server:', err);
    }
    fastify.log.error(err);
    process.exit(1);
  }
}

// Iniciar servidor
start().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
