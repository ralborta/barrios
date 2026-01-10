import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ejecutarTodosLosJobs, enviarRecordatoriosVencimiento, cambiarEstadoAMora, enviarSeguimientos } from '../jobs/index.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const ejecutarJobSchema = z.object({
  tipo: z.enum(['recordatorios', 'cambio-estado', 'seguimientos', 'todos']),
  config: z.record(z.any()).optional(),
});

export async function jobsRoutes(fastify: FastifyInstance) {
  // Ejecutar job manualmente (para testing o ejecución manual)
  fastify.post('/api/jobs/ejecutar', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = ejecutarJobSchema.parse(request.body);
      
      let resultado: any;
      
      switch (data.tipo) {
        case 'recordatorios':
          resultado = await enviarRecordatoriosVencimiento(data.config as any);
          break;
        case 'cambio-estado':
          resultado = await cambiarEstadoAMora(data.config as any);
          break;
        case 'seguimientos':
          resultado = await enviarSeguimientos(data.config as any);
          break;
        case 'todos':
          resultado = await ejecutarTodosLosJobs();
          break;
        default:
          return reply.status(400).send({ error: 'Tipo de job inválido' });
      }
      
      return {
        success: true,
        data: resultado,
        ejecutadoEn: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          detalles: error.errors,
        });
      }
      
      fastify.log.error(error);
      return reply.status(500).send({
        error: error.message || 'Error al ejecutar el job',
      });
    }
  });
  
  // Obtener estado de los jobs (última ejecución, próximas ejecuciones, etc.)
  fastify.get('/api/jobs/estado', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    // Por ahora retornamos información básica
    // En el futuro se puede guardar el estado en la base de datos
    return {
      success: true,
      data: {
        jobs: [
          {
            tipo: 'recordatorios',
            descripcion: 'Envía recordatorios de vencimiento',
            frecuencia: 'Diario',
          },
          {
            tipo: 'cambio-estado',
            descripcion: 'Cambia expensas vencidas a EN_MORA',
            frecuencia: 'Diario',
          },
          {
            tipo: 'seguimientos',
            descripcion: 'Envía seguimientos a expensas en mora',
            frecuencia: 'Semanal',
          },
        ],
      },
    };
  });
}
