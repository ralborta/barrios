import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

// Inicializar transporter de nodemailer
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Envía un email
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Si no hay configuración de email, retornar error
    if (!process.env.EMAIL_SMTP_USER || !process.env.EMAIL_SMTP_PASS) {
      console.warn('⚠️ Email no configurado. Variables EMAIL_SMTP_USER o EMAIL_SMTP_PASS faltantes.');
      return {
        success: false,
        error: 'Email no configurado',
      };
    }

    const mailTransporter = getTransporter();
    const fromEmail = options.from || process.env.EMAIL_FROM || process.env.EMAIL_SMTP_USER;

    const info = await mailTransporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Convertir HTML a texto plano
      html: options.html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Error enviando email:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al enviar email',
    };
  }
}

/**
 * Envía factura de expensa por email
 */
export async function sendFacturaEmail(
  to: string,
  vecinoNombre: string,
  expensaMonto: number,
  periodoMes: number,
  periodoAnio: number,
  fechaVencimiento: Date,
  countryName: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Factura de Expensas - ${countryName} - ${periodoMes}/${periodoAnio}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .amount { font-size: 24px; font-weight: bold; color: #4F46E5; margin: 20px 0; }
        .details { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${countryName}</h1>
          <p>Factura de Expensas</p>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${vecinoNombre}</strong>,</p>
          <p>Le informamos que se ha generado su factura de expensas correspondiente al período <strong>${periodoMes}/${periodoAnio}</strong>.</p>
          
          <div class="amount">
            Monto: $${expensaMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          
          <div class="details">
            <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento.toLocaleDateString('es-AR')}</p>
            <p><strong>Período:</strong> ${periodoMes}/${periodoAnio}</p>
            <p><strong>Country:</strong> ${countryName}</p>
          </div>
          
          <p>Por favor, realice el pago antes de la fecha de vencimiento para evitar intereses.</p>
          <p>Una vez realizado el pago, puede enviar el comprobante por WhatsApp o responder a este email.</p>
        </div>
        <div class="footer">
          <p>Este es un mensaje automático. Por favor, no responda a este email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * Envía recordatorio de vencimiento por email
 */
export async function sendRecordatorioEmail(
  to: string,
  vecinoNombre: string,
  expensaMonto: number,
  fechaVencimiento: Date,
  diasRestantes: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Recordatorio: Vencimiento de Expensas`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recordatorio de Vencimiento</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${vecinoNombre}</strong>,</p>
          
          <div class="warning">
            <p><strong>Le recordamos que su factura de expensas vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}.</strong></p>
          </div>
          
          <p><strong>Monto:</strong> $${expensaMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Fecha de vencimiento:</strong> ${fechaVencimiento.toLocaleDateString('es-AR')}</p>
          
          <p>Por favor, realice el pago antes de la fecha de vencimiento para evitar intereses.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * Envía comunicación de mora por email
 */
export async function sendMoraEmail(
  to: string,
  vecinoNombre: string,
  expensaMonto: number,
  mesMora: number,
  intereses?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Importante: Expensas en Mora - Mes ${mesMora}`;
  
  const montoTotal = intereses ? expensaMonto + intereses : expensaMonto;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .alert { background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 15px; margin: 15px 0; }
        .amount { font-size: 20px; font-weight: bold; color: #DC2626; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Expensas en Mora</h1>
        </div>
        <div class="content">
          <p>Estimado/a <strong>${vecinoNombre}</strong>,</p>
          
          <div class="alert">
            <p><strong>IMPORTANTE:</strong> Su factura de expensas se encuentra en mora (Mes ${mesMora}).</p>
          </div>
          
          <div class="amount">
            <p>Monto original: $${expensaMonto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            ${intereses ? `<p>Intereses: $${intereses.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>` : ''}
            <p>Total a pagar: $${montoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <p>Le solicitamos que regularice su situación de pago a la brevedad.</p>
          <p>Para más información, puede contactarnos por WhatsApp o responder a este email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject,
    html,
  });
}
