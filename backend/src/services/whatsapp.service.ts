/**
 * Servicio de WhatsApp
 * 
 * Este servicio se integra con un gateway de WhatsApp.
 * Puede ser adaptado para diferentes proveedores:
 * - Twilio WhatsApp API
 * - WhatsApp Business API
 * - BuilderBot
 * - Otros gateways compatibles
 */

interface SendWhatsAppOptions {
  to: string; // Número de teléfono (formato: +5491123456789)
  message: string;
  mediaUrl?: string; // URL opcional de imagen/documento
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un mensaje de WhatsApp
 * 
 * Esta función debe ser adaptada según el proveedor de WhatsApp que uses.
 * Por ahora es un stub que simula el envío.
 */
export async function sendWhatsAppMessage(
  options: SendWhatsAppOptions
): Promise<WhatsAppResponse> {
  try {
    // Verificar configuración
    if (!process.env.WHATSAPP_API_KEY || !process.env.WHATSAPP_API_URL) {
      console.warn('⚠️ WhatsApp no configurado. Variables WHATSAPP_API_KEY o WHATSAPP_API_URL faltantes.');
      return {
        success: false,
        error: 'WhatsApp no configurado',
      };
    }

    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;

    // Ejemplo de integración genérica (adaptar según tu proveedor)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: options.to,
        message: options.message,
        ...(options.mediaUrl && { mediaUrl: options.mediaUrl }),
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ error: 'Error desconocido' }))) as { error?: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = (await response.json()) as { messageId?: string; id?: string };

    return {
      success: true,
      messageId: data.messageId || data.id || 'unknown',
    };
  } catch (error: any) {
    console.error('❌ Error enviando WhatsApp:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar WhatsApp',
    };
  }
}

/**
 * Envía factura de expensa por WhatsApp
 */
export async function sendFacturaWhatsApp(
  to: string,
  vecinoNombre: string,
  expensaMonto: number,
  periodoMes: number,
  periodoAnio: number,
  fechaVencimiento: Date,
  countryName: string
): Promise<WhatsAppResponse> {
  const message = `🏠 *${countryName} - Factura de Expensas*

Estimado/a ${vecinoNombre},

Le informamos que se ha generado su factura de expensas correspondiente al período *${periodoMes}/${periodoAnio}*.

💰 *Monto:* $${expensaMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📅 *Vencimiento:* ${fechaVencimiento.toLocaleDateString('es-AR')}

Por favor, realice el pago antes de la fecha de vencimiento para evitar intereses.

Una vez realizado el pago, puede enviar el comprobante por este mismo medio.

Gracias.`;

  return sendWhatsAppMessage({
    to,
    message,
  });
}

/**
 * Envía recordatorio de vencimiento por WhatsApp
 */
export async function sendRecordatorioWhatsApp(
  to: string,
  vecinoNombre: string,
  expensaMonto: number,
  fechaVencimiento: Date,
  diasRestantes: number
): Promise<WhatsAppResponse> {
  const message = `⏰ *Recordatorio de Vencimiento*

Estimado/a ${vecinoNombre},

Le recordamos que su factura de expensas vence en *${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}*.

💰 *Monto:* $${expensaMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📅 *Vencimiento:* ${fechaVencimiento.toLocaleDateString('es-AR')}

Por favor, realice el pago antes de la fecha de vencimiento para evitar intereses.

Gracias.`;

  return sendWhatsAppMessage({
    to,
    message,
  });
}

/**
 * Envía comunicación de mora por WhatsApp
 */
export async function sendMoraWhatsApp(
  to: string,
  vecinoNombre: string,
  expensaMonto: number,
  mesMora: number,
  intereses?: number
): Promise<WhatsAppResponse> {
  const montoTotal = intereses ? expensaMonto + intereses : expensaMonto;
  
  const message = `🚨 *IMPORTANTE: Expensas en Mora - Mes ${mesMora}*

Estimado/a ${vecinoNombre},

Su factura de expensas se encuentra en mora (Mes ${mesMora}).

💰 *Monto original:* $${expensaMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${intereses ? `💸 *Intereses:* $${intereses.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` : ''}💵 *Total a pagar:* $${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Le solicitamos que regularice su situación de pago a la brevedad.

Para más información, puede contactarnos por este medio.

Gracias.`;

  return sendWhatsAppMessage({
    to,
    message,
  });
}

/**
 * Procesa un webhook de WhatsApp (mensaje recibido)
 * 
 * Esta función debe ser adaptada según el formato del webhook de tu proveedor.
 */
export async function processWhatsAppWebhook(
  payload: any
): Promise<{ success: boolean; messageId?: string; from?: string; text?: string; mediaUrl?: string }> {
  try {
    // Ejemplo genérico de procesamiento de webhook
    // Adaptar según el formato de tu proveedor de WhatsApp
    
    const from = payload.from || payload.phoneNumber || payload.sender;
    const text = payload.text || payload.body || payload.message;
    const mediaUrl = payload.mediaUrl || payload.media?.url;
    const messageId = payload.messageId || payload.id;

    // Aquí puedes:
    // 1. Guardar el mensaje en la base de datos
    // 2. Procesar comprobantes recibidos
    // 3. Responder automáticamente
    // 4. Actualizar estados de expensas

    return {
      success: true,
      messageId,
      from,
      text,
      mediaUrl,
    };
  } catch (error: any) {
    console.error('❌ Error procesando webhook de WhatsApp:', error);
    return {
      success: false,
    };
  }
}

/**
 * Endpoint para recibir webhooks de WhatsApp
 * 
 * Esta función debe ser registrada como ruta en tu aplicación Fastify.
 * Ejemplo:
 * 
 * fastify.post('/api/webhooks/whatsapp', async (request, reply) => {
 *   const result = await processWhatsAppWebhook(request.body);
 *   return result;
 * });
 */
