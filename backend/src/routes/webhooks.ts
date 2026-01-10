import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { processWhatsAppWebhook } from '../services/whatsapp.service.js';
import { conciliarPago } from '../services/conciliacion.service.js';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomBytes } from 'crypto';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: any;
  }
}

/**
 * Webhook para recibir mensajes de WhatsApp
 * 
 * Este endpoint procesa:
 * - Mensajes de texto
 * - Archivos adjuntos (comprobantes de pago)
 * - Identifica al vecino por número de teléfono
 * - Procesa comprobantes automáticamente
 */
export async function webhooksRoutes(fastify: FastifyInstance) {
  // Webhook de WhatsApp (público, sin autenticación - protegido por secret)
  fastify.post('/api/webhooks/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verificar secret si está configurado
      const webhookSecret = request.headers['x-webhook-secret'] || request.query?.secret;
      if (process.env.WHATSAPP_WEBHOOK_SECRET && webhookSecret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const payload = request.body as any;
      
      // Procesar webhook genérico
      const resultado = await processWhatsAppWebhook(payload);
      
      if (!resultado.success) {
        return reply.status(400).send({ error: 'Error procesando webhook' });
      }

      const { from, text, mediaUrl } = resultado;

      // Buscar vecino por teléfono
      const vecino = await fastify.prisma.vecino.findFirst({
        where: {
          telefono: {
            contains: from.replace(/\D/g, ''), // Normalizar teléfono (solo números)
          },
        },
        include: {
          expensas: {
            where: {
              estado: {
                in: ['PENDIENTE', 'PAGO_INFORMADO'],
              },
            },
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

      if (!vecino) {
        // No guardar mensaje si no se encuentra vecino (requiere revisión manual)
        fastify.log.warn(`Mensaje de WhatsApp recibido de número desconocido: ${from}`);
        
        return reply.send({
          success: true,
          message: 'Mensaje recibido, pero no se encontró vecino asociado',
          requiereRevision: true,
          from,
        });
      }

      // Guardar mensaje
      const mensaje = await fastify.prisma.mensaje.create({
        data: {
          vecinoId: vecino.id,
          canal: 'WHATSAPP',
          tipo: 'MANUAL',
          contenido: text || 'Mensaje recibido',
          whatsappId: resultado.messageId,
          estado: 'ENVIADO',
        },
      });

      // Si hay archivo adjunto (comprobante)
      if (mediaUrl) {
        try {
          // Descargar archivo
          const response = await fetch(mediaUrl);
          if (!response.ok) {
            throw new Error('Error descargando archivo');
          }

          // Crear directorio de uploads si no existe
          const uploadsDir = process.env.STORAGE_PATH || './uploads';
          await fs.mkdir(uploadsDir, { recursive: true });

          // Generar nombre único
          const fileExtension = path.extname(mediaUrl) || '.jpg';
          const fileName = `${randomBytes(16).toString('hex')}${fileExtension}`;
          const filePath = path.join(uploadsDir, fileName);

          // Guardar archivo
          const writeStream = createWriteStream(filePath);
          await pipeline(response.body as any, writeStream);

          // Intentar conciliar automáticamente si hay texto con monto
          let expensaId: string | null = null;
          let estado = 'NUEVO';

          // Buscar monto en el texto del mensaje
          const montoMatch = text?.match(/\$?\s*(\d+[.,]\d{2})/);
          if (montoMatch && vecino.expensas.length > 0) {
            const montoPago = parseFloat(montoMatch[1].replace(',', '.'));
            
            // Buscar expensa con monto similar
            for (const expensa of vecino.expensas) {
              const montoExpensa = Number(expensa.monto);
              const diferencia = Math.abs(montoExpensa - montoPago);
              
              if (diferencia < 0.01 || diferencia < montoExpensa * 0.05) {
                expensaId = expensa.id;
                estado = diferencia < 0.01 ? 'CONFIRMADO' : 'NUEVO';
                break;
              }
            }
          }

          // Crear comprobante
          const comprobante = await fastify.prisma.comprobante.create({
            data: {
              vecinoId: vecino.id,
              expensaId,
              url: `/uploads/${fileName}`,
              tipoArchivo: response.headers.get('content-type') || 'application/octet-stream',
              nombreArchivo: `comprobante-whatsapp-${fileName}`,
              estado,
              observaciones: `Comprobante recibido por WhatsApp. ${text ? `Mensaje: ${text}` : ''} ${expensaId ? 'Conciliado automáticamente.' : 'Requiere revisión manual.'}`,
            },
          });

          // Si se concilió automáticamente, actualizar estado de expensa
          if (expensaId && estado === 'CONFIRMADO') {
            await fastify.prisma.expensa.update({
              where: { id: expensaId },
              data: {
                estado: 'CONFIRMADO',
              },
            });
          }

          return reply.send({
            success: true,
            data: {
              mensaje,
              comprobante,
              conciliado: !!expensaId,
            },
          });
        } catch (fileError: any) {
          fastify.log.error('Error procesando archivo de WhatsApp:', fileError);
          // Continuar aunque falle el procesamiento del archivo
        }
      }

      return reply.send({
        success: true,
        data: {
          mensaje,
        },
      });
    } catch (error: any) {
      fastify.log.error('Error en webhook de WhatsApp:', error);
      return reply.status(500).send({
        error: error.message || 'Error procesando webhook',
      });
    }
  });

  // Webhook para recibir pagos del concentrador (futuro)
  fastify.post('/api/webhooks/pagos', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verificar secret si está configurado
      const webhookSecret = request.headers['x-webhook-secret'] || request.query?.secret;
      if (process.env.PAGOS_WEBHOOK_SECRET && webhookSecret !== process.env.PAGOS_WEBHOOK_SECRET) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const payload = request.body as any;
      
      // Procesar pago del concentrador
      // Por ahora solo logueamos, la implementación completa se hará cuando se integre
      fastify.log.info('Pago recibido del concentrador:', payload);

      // Aquí se integraría con el servicio de conciliación
      // const resultado = await procesarPagoConcentrador(payload);

      return reply.send({
        success: true,
        message: 'Pago recibido (pendiente de implementación)',
      });
    } catch (error: any) {
      fastify.log.error('Error en webhook de pagos:', error);
      return reply.status(500).send({
        error: error.message || 'Error procesando webhook',
      });
    }
  });
}
