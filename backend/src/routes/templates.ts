import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const templateSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  tipo: z.enum([
    'EMISION',
    'RECORDATORIO_VENCIMIENTO',
    'SEGUIMIENTO',
    'CIERRE_MES',
    'MORA',
    'RECUPERO',
    'MANUAL',
  ]),
  canal: z.enum(['WHATSAPP', 'EMAIL']),
  contenido: z.string().min(1),
  asunto: z.string().optional(),
  variables: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
});

const updateTemplateSchema = templateSchema.partial();

export async function templatesRoutes(fastify: FastifyInstance) {
  // Listar templates
  fastify.get('/api/templates', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { tipo, canal, activo } = request.query as {
        tipo?: string;
        canal?: string;
        activo?: string;
      };
      
      const where: any = {};
      if (tipo) where.tipo = tipo;
      if (canal) where.canal = canal;
      if (activo !== undefined) where.activo = activo === 'true';

      const templates = await fastify.prisma.templateMensaje.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        data: templates,
      };
    } catch (error: any) {
      // Si la tabla no existe, retornar array vacío en lugar de error
      if (error?.message?.includes('does not exist') || error?.code === '42P01' || error?.message?.includes('Can\'t reach database')) {
        fastify.log.warn('Tabla template_mensajes no existe aún, retornando array vacío');
        return {
          success: true,
          data: [],
        };
      }
      fastify.log.error('Error listando templates:', error);
      return reply.status(500).send({ error: 'Error al listar templates' });
    }
  });

  // Obtener template por ID
  fastify.get<{ Params: { id: string } }>('/api/templates/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const template = await fastify.prisma.templateMensaje.findUnique({
      where: { id },
    });

    if (!template) {
      return reply.status(404).send({ error: 'Template no encontrado' });
    }

    return {
      success: true,
      data: template,
    };
  });

  // Crear template
  fastify.post('/api/templates', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = templateSchema.parse(request.body);

      const template = await fastify.prisma.templateMensaje.create({
        data: {
          ...body,
          variables: body.variables ? JSON.stringify(body.variables) : null,
        },
      });

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear template' });
    }
  });

  // Actualizar template
  fastify.put<{ Params: { id: string } }>('/api/templates/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateTemplateSchema.parse(request.body);

      const updateData: any = { ...body };
      if (body.variables) {
        updateData.variables = JSON.stringify(body.variables);
      }

      const template = await fastify.prisma.templateMensaje.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: template,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar template' });
    }
  });

  // Eliminar template
  fastify.delete<{ Params: { id: string } }>('/api/templates/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await fastify.prisma.templateMensaje.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Template eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar template' });
    }
  });
}
