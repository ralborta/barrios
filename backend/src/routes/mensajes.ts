import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

// Prisma se importa desde index.ts
declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const createMensajeSchema = z.object({
  vecinoId: z.string(),
  expensaId: z.string().optional().nullable(),
  canal: z.enum(['WHATSAPP', 'EMAIL']),
  tipo: z.enum([
    'EMISION',
    'RECORDATORIO_VENCIMIENTO',
    'SEGUIMIENTO',
    'CIERRE_MES',
    'MORA',
    'RECUPERO',
    'MANUAL',
  ]),
  contenido: z.string().optional(),
  asunto: z.string().optional(),
  whatsappId: z.string().optional(),
  emailId: z.string().optional(),
});

const updateMensajeSchema = z.object({
  estado: z.enum(['ENVIADO', 'ENTREGADO', 'LEIDO', 'ERROR']).optional(),
  contenido: z.string().optional(),
});

export async function mensajesRoutes(fastify: FastifyInstance) {
  // Listar mensajes
  fastify.get('/api/mensajes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { vecinoId, expensaId, canal, tipo, estado } = request.query as {
      vecinoId?: string;
      expensaId?: string;
      canal?: string;
      tipo?: string;
      estado?: string;
    };
    
    const where: any = {};
    if (vecinoId) where.vecinoId = vecinoId;
    if (expensaId) where.expensaId = expensaId;
    if (canal) where.canal = canal;
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;

    const mensajes = await fastify.prisma.mensaje.findMany({
      where,
      include: {
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        expensa: {
          select: {
            id: true,
            monto: true,
            estado: true,
            periodo: {
              select: {
                mes: true,
                anio: true,
                country: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: mensajes,
    };
  });

  // Obtener mensaje por ID
  fastify.get<{ Params: { id: string } }>('/api/mensajes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const mensaje = await fastify.prisma.mensaje.findUnique({
      where: { id },
      include: {
        vecino: true,
        expensa: {
          include: {
            periodo: {
              include: {
                country: true,
              },
            },
            vecino: true,
          },
        },
      },
    });

    if (!mensaje) {
      return reply.status(404).send({ error: 'Mensaje no encontrado' });
    }

    return {
      success: true,
      data: mensaje,
    };
  });

  // Obtener mensajes de una expensa
  fastify.get<{ Params: { expensaId: string } }>('/api/mensajes/expensa/:expensaId', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { expensaId } = request.params;

    // Verificar que la expensa existe
    const expensa = await fastify.prisma.expensa.findUnique({
      where: { id: expensaId },
    });

    if (!expensa) {
      return reply.status(404).send({ error: 'Expensa no encontrada' });
    }

    const mensajes = await fastify.prisma.mensaje.findMany({
      where: { expensaId },
      include: {
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      success: true,
      data: mensajes,
    };
  });

  // Crear/enviar mensaje
  fastify.post('/api/mensajes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createMensajeSchema.parse(request.body);

      // Verificar que el vecino existe
      const vecino = await fastify.prisma.vecino.findUnique({
        where: { id: body.vecinoId },
      });

      if (!vecino) {
        return reply.status(404).send({ error: 'Vecino no encontrado' });
      }

      // Si hay expensaId, verificar que existe
      if (body.expensaId) {
        const expensa = await fastify.prisma.expensa.findUnique({
          where: { id: body.expensaId },
        });
        if (!expensa) {
          return reply.status(404).send({ error: 'Expensa no encontrada' });
        }
      }

      // Crear el mensaje
      const mensaje = await fastify.prisma.mensaje.create({
        data: {
          vecinoId: body.vecinoId,
          expensaId: body.expensaId || null,
          canal: body.canal,
          tipo: body.tipo,
          contenido: body.contenido || null,
          asunto: body.asunto || null,
          whatsappId: body.whatsappId || null,
          emailId: body.emailId || null,
          estado: 'ENVIADO',
        },
        include: {
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
              telefono: true,
            },
          },
          expensa: {
            select: {
              id: true,
              monto: true,
              estado: true,
            },
          },
        },
      });

      // TODO: Aquí se integrará con los servicios de WhatsApp/Email
      // para enviar el mensaje realmente
      // Por ahora solo creamos el registro

      return {
        success: true,
        data: mensaje,
        message: 'Mensaje creado. El envío se procesará próximamente.',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear mensaje' });
    }
  });

  // Actualizar mensaje (principalmente estado)
  fastify.put<{ Params: { id: string } }>('/api/mensajes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateMensajeSchema.parse(request.body);

      const mensaje = await fastify.prisma.mensaje.update({
        where: { id },
        data: body,
        include: {
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          expensa: {
            select: {
              id: true,
              monto: true,
              estado: true,
            },
          },
        },
      });

      return {
        success: true,
        data: mensaje,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar mensaje' });
    }
  });

  // Eliminar mensaje
  fastify.delete<{ Params: { id: string } }>('/api/mensajes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.mensaje.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Mensaje eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar mensaje' });
    }
  });
}
