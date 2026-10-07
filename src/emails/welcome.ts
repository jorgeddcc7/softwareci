/**
 * Plantilla HTML del email de bienvenida.
 * Email-safe: usa tablas y estilos inline para máxima compatibilidad.
 */
export function welcomeEmailHtml(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Controlador de Documentos👋</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<!-- Preheader (texto oculto que aparece junto al asunto) -->
<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #F8FAFC;">
  Ya puedes analizar tus documentos de importación. Tienes 3 análisis gratuitos.
</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F8FAFC;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">

          <!-- Header con logo -->
          <tr>
            <td align="center" style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #E2E8F0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="vertical-align: middle;">
                    <img src="https://www.controladordocumentos.com/logocd.png" alt="Controlador de Documentos" width="48" height="48" style="display: block; border-radius: 8px;" />
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle;">
                    <span style="font-size: 16px; font-weight: 600; color: #0F172A;">Controlador de Documentos</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; line-height: 1.3; color: #0F172A; font-weight: 700;">
                Bienvenido 👋
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Gracias por registrarte. Ya puedes analizar tus documentos de importación y detectar incoherencias antes del despacho aduanero.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Sube la factura comercial, el packing list y, si la tienes, el documento de transporte. El sistema los compara y te devuelve una lista de alertas con la referencia exacta al campo que no cuadra.
              </p>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
                <tr>
                  <td align="center" style="background-color: #2563EB; border-radius: 8px;">
                    <a href="https://www.controladordocumentos.com/analizar" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                      Analizar una operación →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #64748B;">
                Tienes <strong style="color: #0F172A;">3 análisis gratuitos</strong> para probarlo con operaciones reales, sin necesidad de dar datos de pago.
              </p>

              <!-- Aviso privacidad -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #EFF6FF; border-left: 4px solid #2563EB; border-radius: 4px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #0F172A;">
                      <strong>Tus documentos no se guardan.</strong> Los PDFs se procesan y se eliminan inmediatamente. No se almacenan, no se comparten y no se usan para entrenar modelos.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Si tienes cualquier duda o quieres darnos feedback, responde directamente a este correo. Lo leemos todo.
              </p>
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Un saludo,<br>
                El equipo de Controlador de Documentos
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #E2E8F0; background-color: #F8FAFC;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94A3B8; text-align: center;">
                Controlador de Documentos · <a href="https://www.controladordocumentos.com" style="color: #2563EB; text-decoration: none;">controladordocumentos.com</a>
              </p>
              <p style="margin: 8px 0 0 0; font-size: 11px; line-height: 1.5; color: #94A3B8; text-align: center;">
                Recibes este correo porque te has registrado en nuestra web.<br>
                Puedes responder directamente a este email si tienes cualquier duda.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}