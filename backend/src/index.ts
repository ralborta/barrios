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

const fastify = Fastify({
  logger: true,
});

// Plugins
await fastify.register(cors, {
  origin: (origin, cb) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
    ].filter(Boolean);
    
    // Permitir peticiones sin origin (como desde Postman o curl)
    if (!origin) {
      cb(null, true);
      return;
    }
    
    // Permitir si está en la lista de orígenes permitidos
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }
    
    // Por ahora, permitir todos los orígenes en desarrollo
    // En producción, esto debería ser más restrictivo
    if (process.env.NODE_ENV !== 'production') {
      cb(null, true);
      return;
    }
    
    // En producción, rechazar si no está en la lista
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
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

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error',
  });
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
});
