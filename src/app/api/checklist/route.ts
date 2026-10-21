import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 }
      );
    }

    // 1. Guardar el lead (si ya existe, no falla)
    const { error: dbError } = await supabaseAdmin
      .from("leads")
      .upsert(
        { email: email.toLowerCase().trim(), source: "checklist" },
        { onConflict: "email", ignoreDuplicates: true }
      );

    if (dbError) {
      console.error("Error guardando lead:", dbError);
      // No bloqueamos el envío del PDF por un error de base de datos
    }

    // 2. Enviar el email con el PDF adjunto
    const { error: emailError } = await resend.emails.send({
      from: "Controlador de Documentos <hola@controladordocumentos.com>",
      to: email,
      subject: "Tu checklist: 12 puntos que revisa la aduana en tu packing list",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #0F172A;">
          <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 16px;">
            Aquí tienes tu checklist
          </h1>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
            Gracias por descargar el checklist. Lo tienes adjunto a este email en PDF.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px;">
            Úsalo antes de enviar la documentación al agente. Los 12 puntos son los que más se revisan en aduana, y los que más retenciones generan cuando algo no cuadra.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
            Y si quieres comprobar tu packing list en 30 segundos, puedes probar la herramienta con 3 análisis gratuitos:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px;">
            <tr>
              <td align="center" style="background-color: #2563EB; border-radius: 8px;">
                <a href="https://www.controladordocumentos.com/analizar" style="display: inline-block; padding: 12px 28px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none;">
                  Probar gratis →
                </a>
              </td>
            </tr>
          </table>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 8px;">
            Un saludo,
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0;">
            El equipo de Controlador de Documentos
          </p>
          <p style="font-size: 12px; line-height: 1.5; color: #94A3B8; margin: 32px 0 0; text-align: center;">
            Puedes responder directamente a este email si tienes cualquier duda.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "checklist-packing-list.pdf",
          path: "https://www.controladordocumentos.com/checklist/checklist-packing-list.pdf",
        },
      ],
    });

    if (emailError) {
      console.error("Error enviando email:", emailError);
      return NextResponse.json(
        { error: "No se pudo enviar el email. Inténtalo de nuevo." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en /api/checklist:", error);
    return NextResponse.json(
      { error: "Error inesperado. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}