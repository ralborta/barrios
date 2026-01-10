/**
 * Job de Cambio de Estado Automático
 * 
 * Cambia expensas de PENDIENTE a EN_MORA después del vencimiento
 */

import { PrismaClient } from '@prisma/client';
import { sendMoraWhatsApp } from '../services/whatsapp.service.js';
import { sendMoraEmail } from '../services/email.service.js';

const prisma = new PrismaClient();

interface ConfiguracionMora {
  diasDespuesVencimiento: number; // Días después del vencimiento para cambiar a mora
  enviarNotificacion: boolean;
  canales: ('WHATSAPP' | 'EMAIL')[];
}

/**
 * Cambia expensas vencidas a estado EN_MORA
 */
export async function cambiarEstadoAMora(
  config: ConfiguracionMora = {
    diasDespuesVencimiento: 1,
    enviarNotificacion: true,
    canales: ['WHATSAPP'],
  }
): Promise<{ actualizadas: number; notificaciones: number; errores: number }> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaLimite = new Date(hoy);
  fechaLimite.setDate(fechaLimite.getDate() - config.diasDespuesVencimiento);
  
  // Buscar expensas vencidas que aún están en PENDIENTE
  const expensas = await prisma.expensa.findMany({
    where: {
      estado: 'PENDIENTE',
      fechaVencimiento: {
        lte: fechaLimite,
      },
    },
    include: {
      vecino: {
        include: {
          country: true,
        },
      },
      periodo: {
        include: {
          country: true,
        },
      },
    },
  });
  
  let actualizadas = 0;
  let notificaciones = 0;
  let errores = 0;
  
  for (const expensa of expensas) {
    try {
      // Calcular mes de mora
      const mesesMora = Math.ceil(
        (hoy.getTime() - expensa.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      
      // Actualizar estado
      await prisma.expensa.update({
        where: { id: expensa.id },
        data: {
          estado: 'EN_MORA',
          mesMora: mesesMora,
        },
      });
      
      actualizadas++;
      
      // Enviar notificación si está configurado
      if (config.enviarNotificacion) {
        try {
          // Enviar por WhatsApp
          if (config.canales.includes('WHATSAPP') && expensa.vecino.telefono) {
            const resultado = await sendMoraWhatsApp(
              expensa.vecino.telefono,
              `${expensa.vecino.nombre} ${expensa.vecino.apellido}`,
              Number(expensa.monto),
              mesesMora
            );
            
            if (resultado.success) {
              await prisma.mensaje.create({
                data: {
                  vecinoId: expensa.vecinoId,
                  expensaId: expensa.id,
                  canal: 'WHATSAPP',
                  tipo: 'MORA',
                  contenido: `Notificación de mora - Mes ${mesesMora}`,
                  whatsappId: resultado.messageId,
                  estado: 'ENVIADO',
                },
              });
              notificaciones++;
            }
          }
          
          // Enviar por Email
          if (config.canales.includes('EMAIL')) {
            const resultado = await sendMoraEmail(
              expensa.vecino.email,
              `${expensa.vecino.nombre} ${expensa.vecino.apellido}`,
              Number(expensa.monto),
              mesesMora
            );
            
            if (resultado.success) {
              await prisma.mensaje.create({
                data: {
                  vecinoId: expensa.vecinoId,
                  expensaId: expensa.id,
                  canal: 'EMAIL',
                  tipo: 'MORA',
                  contenido: `Notificación de mora - Mes ${mesesMora}`,
                  emailId: resultado.messageId,
                  asunto: `IMPORTANTE: Expensas en Mora - Mes ${mesesMora}`,
                  estado: 'ENVIADO',
                },
              });
              notificaciones++;
            }
          }
        } catch (notifError: any) {
          console.error(`Error enviando notificación de mora para expensa ${expensa.id}:`, notifError);
          errores++;
        }
      }
    } catch (error: any) {
      console.error(`Error actualizando expensa ${expensa.id}:`, error);
      errores++;
    }
  }
  
  return { actualizadas, notificaciones, errores };
}
