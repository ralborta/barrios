import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from './routes/auth.js';
import { vecinosRoutes } from './routes/vecinos.js';
import { countriesRoutes } from './routes/countries.js';
import { periodosRoutes } from './routes/periodos.js';
import { expensasRoutes } from './routes/expensas.js';

const prisma = new PrismaClient();

// Start server - Todo envuelto en función async
async function start() {
  const fastify = Fastify({
    logger: true,
  });

  try {
    // Plugins
    await fastify.register(cors, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

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

    // NOTA: No necesitamos handler explícito de OPTIONS
    // @fastify/cors ya maneja OPTIONS automáticamente

    // Error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
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
    fastify.log.error(err);
    console.error('❌ Error starting server:', err);
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
