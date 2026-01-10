import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomBytes } from 'crypto';

// Prisma se importa desde index.ts
declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

const updateComprobanteSchema = z.object({
  estado: z.enum(['NUEVO', 'REVISADO', 'CONFIRMADO', 'RECHAZADO']).optional(),
  observaciones: z.string().optional(),
  expensaId: z.string().optional().nullable(),
});

export async function comprobantesRoutes(fastify: FastifyInstance) {
  // Listar comprobantes
  fastify.get('/api/comprobantes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest) => {
    const { vecinoId, expensaId, estado } = request.query as {
      vecinoId?: string;
      expensaId?: string;
      estado?: string;
    };
    
    const where: any = {};
    if (vecinoId) where.vecinoId = vecinoId;
    if (expensaId) where.expensaId = expensaId;
    if (estado) where.estado = estado;

    const comprobantes = await fastify.prisma.comprobante.findMany({
      where,
      include: {
        vecino: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
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
      data: comprobantes,
    };
  });

  // Obtener comprobante por ID
  fastify.get<{ Params: { id: string } }>('/api/comprobantes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const { id } = request.params;

    const comprobante = await fastify.prisma.comprobante.findUnique({
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
          },
        },
      },
    });

    if (!comprobante) {
      return reply.status(404).send({ error: 'Comprobante no encontrado' });
    }

    return {
      success: true,
      data: comprobante,
    };
  });

  // Crear comprobante (con upload)
  fastify.post('/api/comprobantes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
      }

      const { vecinoId, expensaId } = data.fields as {
        vecinoId?: { value: string };
        expensaId?: { value: string };
      };

      if (!vecinoId?.value) {
        return reply.status(400).send({ error: 'vecinoId es requerido' });
      }

      // Verificar que el vecino existe
      const vecino = await fastify.prisma.vecino.findUnique({
        where: { id: vecinoId.value },
      });

      if (!vecino) {
        return reply.status(404).send({ error: 'Vecino no encontrado' });
      }

      // Crear directorio de uploads si no existe
      const uploadsDir = process.env.STORAGE_PATH || './uploads';
      await fs.mkdir(uploadsDir, { recursive: true });

      // Generar nombre único para el archivo
      const fileExtension = path.extname(data.filename || '');
      const fileName = `${randomBytes(16).toString('hex')}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Guardar archivo
      const writeStream = createWriteStream(filePath);
      await pipeline(data.file, writeStream);

      // Crear registro en la base de datos
      const comprobante = await fastify.prisma.comprobante.create({
        data: {
          vecinoId: vecinoId.value,
          expensaId: expensaId?.value || null,
          url: `/uploads/${fileName}`, // URL relativa
          tipoArchivo: data.mimetype || 'application/octet-stream',
          nombreArchivo: data.filename || fileName,
          estado: 'NUEVO',
        },
        include: {
          vecino: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });

      return {
        success: true,
        data: comprobante,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al crear comprobante' });
    }
  });

  // Actualizar comprobante
  fastify.put<{ Params: { id: string } }>('/api/comprobantes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateComprobanteSchema.parse(request.body);

      // Si se está vinculando a una expensa, verificar que existe
      if (body.expensaId !== undefined && body.expensaId !== null) {
        const expensa = await fastify.prisma.expensa.findUnique({
          where: { id: body.expensaId },
        });
        if (!expensa) {
          return reply.status(404).send({ error: 'Expensa no encontrada' });
        }
      }

      const comprobante = await fastify.prisma.comprobante.update({
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
        data: comprobante,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Datos inválidos', details: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al actualizar comprobante' });
    }
  });

  // Eliminar comprobante
  fastify.delete<{ Params: { id: string } }>('/api/comprobantes/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Obtener el comprobante para eliminar el archivo
      const comprobante = await fastify.prisma.comprobante.findUnique({
        where: { id },
      });

      if (!comprobante) {
        return reply.status(404).send({ error: 'Comprobante no encontrado' });
      }

      // Eliminar archivo físico
      try {
        const uploadsDir = process.env.STORAGE_PATH || './uploads';
        const filePath = path.join(uploadsDir, path.basename(comprobante.url));
        await fs.unlink(filePath);
      } catch (fileError) {
        // Si el archivo no existe, continuar con la eliminación del registro
        fastify.log.warn(`No se pudo eliminar el archivo: ${comprobante.url}`);
      }

      // Eliminar registro de la base de datos
      await fastify.prisma.comprobante.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Comprobante eliminado correctamente',
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al eliminar comprobante' });
    }
  });

  // Servir archivos de comprobantes (endpoint público para archivos)
  fastify.get<{ Params: { filename: string } }>('/uploads/:filename', async (request, reply) => {
    try {
      const { filename } = request.params;
      const uploadsDir = process.env.STORAGE_PATH || './uploads';
      const filePath = path.join(uploadsDir, filename);

      // Verificar que el archivo existe
      try {
        await fs.access(filePath);
      } catch {
        return reply.status(404).send({ error: 'Archivo no encontrado' });
      }

      // Leer y servir el archivo
      const fileBuffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);

      // Detectar tipo MIME
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      reply.type(contentType);
      reply.header('Content-Length', stats.size.toString());
      return fileBuffer;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Error al servir archivo' });
    }
  });
}
