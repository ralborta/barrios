import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import path from 'path';

// Schema de validación para vecino en CSV
const vecinoCsvSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  apellido: z.string().min(1, 'Apellido es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  unidad: z.string().optional(),
  observaciones: z.string().optional(),
  countryId: z.string().min(1, 'Country ID es requerido'),
});

export async function importRoutes(fastify: FastifyInstance) {
  // Importar vecinos desde CSV
  fastify.post('/api/import/vecinos', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
      }

      // Leer el contenido del archivo
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileContent = Buffer.concat(chunks).toString('utf-8');

      // Parsear CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Manejar BOM de Excel
      });

      if (records.length === 0) {
        return reply.status(400).send({ error: 'El archivo CSV está vacío' });
      }

      // Validar estructura del CSV
      const requiredColumns = ['nombre', 'apellido', 'email', 'countryId'];
      const firstRow = records[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return reply.status(400).send({ 
          error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`,
          requiredColumns: ['nombre', 'apellido', 'email', 'countryId'],
          optionalColumns: ['telefono', 'unidad', 'observaciones'],
        });
      }

      // Validar y procesar cada registro
      const resultados = {
        exitosos: [] as any[],
        errores: [] as Array<{ fila: number; error: string; datos: any }>,
        duplicados: [] as Array<{ fila: number; email: string }>,
      };

      for (let i = 0; i < records.length; i++) {
        const fila = i + 2; // +2 porque la fila 1 es el header
        const record = records[i];

        try {
          // Validar datos con Zod
          const validated = vecinoCsvSchema.parse(record);

          // Verificar que el country existe
          const country = await fastify.prisma.country.findUnique({
            where: { id: validated.countryId },
          });

          if (!country) {
            resultados.errores.push({
              fila,
              error: `Country con ID "${validated.countryId}" no existe`,
              datos: record,
            });
            continue;
          }

          // Verificar si el vecino ya existe (por email)
          const vecinoExistente = await fastify.prisma.vecino.findUnique({
            where: { email: validated.email },
          });

          if (vecinoExistente) {
            resultados.duplicados.push({
              fila,
              email: validated.email,
            });
            continue;
          }

          // Crear vecino
          const vecino = await fastify.prisma.vecino.create({
            data: {
              nombre: validated.nombre,
              apellido: validated.apellido,
              email: validated.email,
              telefono: validated.telefono || null,
              unidad: validated.unidad || null,
              observaciones: validated.observaciones || null,
              countryId: validated.countryId,
            },
            include: {
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          resultados.exitosos.push({
            fila,
            vecino: {
              id: vecino.id,
              nombre: vecino.nombre,
              apellido: vecino.apellido,
              email: vecino.email,
            },
          });
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            resultados.errores.push({
              fila,
              error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
              datos: record,
            });
          } else {
            resultados.errores.push({
              fila,
              error: error.message || 'Error desconocido',
              datos: record,
            });
          }
        }
      }

      return {
        success: true,
        data: {
          total: records.length,
          exitosos: resultados.exitosos.length,
          errores: resultados.errores.length,
          duplicados: resultados.duplicados.length,
          resultados,
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: error.message || 'Error al procesar el archivo CSV',
      });
    }
  });

  // Obtener template CSV para vecinos
  fastify.get('/api/import/vecinos/template', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const csvTemplate = `nombre,apellido,email,telefono,unidad,observaciones,countryId
Juan,Pérez,juan.perez@example.com,+5491112345678,Casa 12,Vecino desde 2020,COUNTRY_ID_AQUI
María,González,maria.gonzalez@example.com,+5491187654321,Lote 5,,COUNTRY_ID_AQUI`;

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="template_vecinos.csv"');
    return csvTemplate;
  });

  // Importar comprobantes desde CSV
  fastify.post('/api/import/comprobantes', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({ error: 'No se proporcionó ningún archivo' });
      }

      // Leer el contenido del archivo
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileContent = Buffer.concat(chunks).toString('utf-8');

      // Parsear CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      if (records.length === 0) {
        return reply.status(400).send({ error: 'El archivo CSV está vacío' });
      }

      // Validar estructura del CSV
      const requiredColumns = ['vecinoEmail', 'url'];
      const firstRow = records[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        return reply.status(400).send({ 
          error: `Faltan columnas requeridas: ${missingColumns.join(', ')}`,
          requiredColumns: ['vecinoEmail', 'url'],
          optionalColumns: ['expensaId', 'nombreArchivo', 'tipoArchivo', 'estado', 'observaciones'],
        });
      }

      // Schema de validación para comprobante en CSV
      const comprobanteCsvSchema = z.object({
        vecinoEmail: z.string().email('Email de vecino inválido'),
        url: z.string().min(1, 'URL es requerida'),
        expensaId: z.string().optional(),
        nombreArchivo: z.string().optional(),
        tipoArchivo: z.string().optional(),
        estado: z.enum(['NUEVO', 'REVISADO', 'CONFIRMADO', 'RECHAZADO']).optional(),
        observaciones: z.string().optional(),
      });

      // Validar y procesar cada registro
      const resultados = {
        exitosos: [] as any[],
        errores: [] as Array<{ fila: number; error: string; datos: any }>,
      };

      for (let i = 0; i < records.length; i++) {
        const fila = i + 2; // +2 porque la fila 1 es el header
        const record = records[i];

        try {
          // Validar datos con Zod
          const validated = comprobanteCsvSchema.parse(record);

          // Buscar vecino por email
          const vecino = await fastify.prisma.vecino.findUnique({
            where: { email: validated.vecinoEmail },
          });

          if (!vecino) {
            resultados.errores.push({
              fila,
              error: `Vecino con email "${validated.vecinoEmail}" no existe`,
              datos: record,
            });
            continue;
          }

          // Verificar expensa si se proporcionó
          if (validated.expensaId) {
            const expensa = await fastify.prisma.expensa.findUnique({
              where: { id: validated.expensaId },
            });

            if (!expensa) {
              resultados.errores.push({
                fila,
                error: `Expensa con ID "${validated.expensaId}" no existe`,
                datos: record,
              });
              continue;
            }

            // Verificar que la expensa pertenece al vecino
            if (expensa.vecinoId !== vecino.id) {
              resultados.errores.push({
                fila,
                error: `La expensa "${validated.expensaId}" no pertenece al vecino "${validated.vecinoEmail}"`,
                datos: record,
              });
              continue;
            }
          }

          // Determinar nombre de archivo y tipo
          const nombreArchivo = validated.nombreArchivo || path.basename(validated.url) || 'comprobante';
          const tipoArchivo = validated.tipoArchivo || 'application/octet-stream';

          // Crear comprobante
          const comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: vecino.id,
              expensaId: validated.expensaId || null,
              url: validated.url,
              nombreArchivo,
              tipoArchivo,
              estado: validated.estado || 'NUEVO',
              observaciones: validated.observaciones || null,
            },
            include: {
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

          resultados.exitosos.push({
            fila,
            comprobante: {
              id: comprobante.id,
              nombreArchivo: comprobante.nombreArchivo,
              vecino: comprobante.vecino,
            },
          });
        } catch (error: any) {
          if (error instanceof z.ZodError) {
            resultados.errores.push({
              fila,
              error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
              datos: record,
            });
          } else {
            resultados.errores.push({
              fila,
              error: error.message || 'Error desconocido',
              datos: record,
            });
          }
        }
      }

      return {
        success: true,
        data: {
          total: records.length,
          exitosos: resultados.exitosos.length,
          errores: resultados.errores.length,
          resultados,
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: error.message || 'Error al procesar el archivo CSV',
      });
    }
  });

  // Obtener template CSV para comprobantes
  fastify.get('/api/import/comprobantes/template', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const csvTemplate = `vecinoEmail,url,expensaId,nombreArchivo,tipoArchivo,estado,observaciones
juan.perez@example.com,https://ejemplo.com/comprobantes/pago1.pdf,EXPENSA_ID_AQUI,pago1.pdf,application/pdf,NUEVO,Comprobante de pago
maria.gonzalez@example.com,/uploads/comprobante2.jpg,,comprobante2.jpg,image/jpeg,NUEVO,`;

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', 'attachment; filename="template_comprobantes.csv"');
    return csvTemplate;
  });
}
