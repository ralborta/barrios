import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { randomBytes } from 'crypto';
import { pipeline } from 'stream/promises';

const prisma = new PrismaClient();

const expensaSchema = z.object({
  periodoId: z.string(),
  vecinoId: z.string(),
  monto: z.number().positive(),
  estado: z.enum([
    'PENDIENTE',
    'PAGO_INFORMADO',
    'CONFIRMADO',
    'EN_MORA',
    'EN_RECUPERO',
    'SIN_RESPUESTA',
    'PAUSADO',
  ]).optional(),
  fechaVencimiento: z.string().datetime(),
});

const updateExpensaSchema = expensaSchema.partial().extend({
  estado: z.enum([
    'PENDIENTE',
    'PAGO_INFORMADO',
    'CONFIRMADO',
    'EN_MORA',
    'EN_RECUPERO',
    'SIN_RESPUESTA',
    'PAUSADO',
  ]).optional(),
});

export async function expensasRoutes(fastify: FastifyInstance) {
  // Listar expensas
  fastify.get('/api/expensas', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { periodoId, vecinoId, estado, countryId } = request.query as {
      periodoId?: string;
      vecinoId?: string;
      estado?: string;
      countryId?: string;
    };
    
    const where: any = {};
    if (periodoId) where.periodoId = periodoId;
    if (vecinoId) where.vecinoId = vecinoId;
    if (estado) where.estado = estado;
    if (countryId) {
      where.periodo = { countryId };
    }

    const expensas = await prisma.expensa.findMany({
      where,
      include: {
        periodo: {
          select: {
            id: true,
            mes: true,
            anio: true,
            country: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            unidad: true,
          },
        },
        _count: {
          select: {
            mensajes: true,
            comprobantes: true,
          },
        },
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });

    return {
      success: true,
      data: expensas,
    };
  });

  // Obtener expensa por ID
  fastify.get<{ Params: { id: string } }>('/api/expensas/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const expensa = await prisma.expensa.findUnique({
      where: { id },
      include: {
        periodo: {
          include: {
            country: true,
          },
        },
        vecino: true,
        mensajes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        comprobantes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!expensa) {
      return reply.status(404).send({ error: 'Expensa no encontrada' });
    }

    return {
      success: true,
      data: expensa,
    };
  });

  // Crear expensa
  fastify.post('/api/expensas', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = expensaSchema.parse(request.body);

      const expensa = await prisma.expensa.create({
        data: {
          ...body,
          fechaVencimiento: new Date(body.fechaVencimiento),
          estado: body.estado || 'PENDIENTE',
        },
        include: {
          periodo: {
            select: {
              id: true,
              mes: true,
              anio: true,
            },
          },
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: expensa,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear expensa' });
    }
  });

  // Actualizar expensa
  fastify.put<{ Params: { id: string } }>('/api/expensas/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateExpensaSchema.parse(request.body);

      const updateData: any = { ...body };
      if (body.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(body.fechaVencimiento);
      }

      const expensa = await prisma.expensa.update({
        where: { id },
        data: updateData,
        include: {
          periodo: {
            select: {
              id: true,
              mes: true,
              anio: true,
            },
          },
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        data: expensa,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar expensa' });
    }
  });

  // Eliminar expensa
  fastify.delete<{ Params: { id: string } }>('/api/expensas/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.expensa.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Expensa eliminada correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar expensa' });
    }
  });

  // Crear múltiples expensas (para un período)
  fastify.post('/api/expensas/bulk', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = z.object({
        periodoId: z.string(),
        vecinos: z.array(z.object({
          vecinoId: z.string(),
          monto: z.number().positive(),
        })),
        fechaVencimiento: z.string().datetime(),
      }).parse(request.body);

      const expensas = await prisma.$transaction(
        body.vecinos.map((v) =>
          prisma.expensa.create({
            data: {
              periodoId: body.periodoId,
              vecinoId: v.vecinoId,
              monto: v.monto,
              fechaVencimiento: new Date(body.fechaVencimiento),
              estado: 'PENDIENTE',
            },
          })
        )
      );

      return {
        success: true,
        data: expensas,
        count: expensas.length,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear expensas' });
    }
  });

  // Subir boleta para una expensa
  fastify.post('/api/expensas/:id/boleta', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      // Verificar que la expensa existe
      const expensa = await prisma.expensa.findUnique({
        where: { id },
      });

      if (!expensa) {
        return reply.status(404).send({ error: 'Expensa no encontrada' });
      }

      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
      }

      // Crear directorio de uploads si no existe
      const uploadsDir = process.env.STORAGE_PATH || './uploads';
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generar nombre único para el archivo
      const fileExtension = path.extname(data.filename || '');
      const fileName = `boleta_${id}_${randomBytes(8).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Guardar archivo
      const writeStream = createWriteStream(filePath);
      await pipeline(data.file, writeStream);

      // Actualizar expensa con la boleta
      const expensaActualizada = await prisma.expensa.update({
        where: { id },
        data: {
          boletaUrl: `/uploads/${fileName}`,
          boletaNombreArchivo: data.filename || fileName,
          boletaTipoArchivo: data.mimetype || 'application/octet-stream',
        },
        include: {
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          periodo: {
            include: {
              country: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        data: expensaActualizada,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al subir boleta' });
    }
  });

  // Descargar boleta de una expensa
  fastify.get('/api/expensas/:id/boleta', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const expensa = await prisma.expensa.findUnique({
        where: { id },
        select: {
          boletaUrl: true,
          boletaNombreArchivo: true,
          boletaTipoArchivo: true,
        },
      });

      if (!expensa || !expensa.boletaUrl) {
        return reply.status(404).send({ error: 'Boleta no encontrada' });
      }

      const uploadsDir = process.env.STORAGE_PATH || './uploads';
      const filePath = path.join(uploadsDir, path.basename(expensa.boletaUrl));

      // Verificar que el archivo existe
      try {
        await fs.access(filePath);
      } catch {
        return reply.status(404).send({ error: 'Archivo de boleta no encontrado en el servidor' });
      }

      // Leer archivo
      const fileBuffer = await fs.readFile(filePath);

      // Enviar archivo
      reply.header('Content-Type', expensa.boletaTipoArchivo || 'application/octet-stream');
      reply.header('Content-Disposition', `attachment; filename="${expensa.boletaNombreArchivo || 'boleta.pdf'}"`);
      return reply.send(fileBuffer);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al descargar boleta' });
    }
  });

  // Eliminar boleta de una expensa
  fastify.delete('/api/expensas/:id/boleta', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;

      const expensa = await prisma.expensa.findUnique({
        where: { id },
        select: {
          boletaUrl: true,
        },
      });

      if (!expensa) {
        return reply.status(404).send({ error: 'Expensa no encontrada' });
      }

      // Eliminar archivo físico si existe
      if (expensa.boletaUrl) {
        const uploadsDir = process.env.STORAGE_PATH || './uploads';
        const filePath = path.join(uploadsDir, path.basename(expensa.boletaUrl));
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // Si el archivo no existe, continuar
          fastify.log.warn(`No se pudo eliminar el archivo ${filePath}:`, error);
        }
      }

      // Actualizar expensa para eliminar referencias a la boleta
      await prisma.expensa.update({
        where: { id },
        data: {
          boletaUrl: null,
          boletaNombreArchivo: null,
          boletaTipoArchivo: null,
        },
      });

      return {
        success: true,
        message: 'Boleta eliminada correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar boleta' });
    }
  });
}
