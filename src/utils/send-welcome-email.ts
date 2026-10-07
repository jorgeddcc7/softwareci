import { resend } from "./resend";
import { welcomeEmailHtml } from "@/emails/welcome";

export async function sendWelcomeEmail(destinatario: string): Promise<void> {
  const { error } = await resend.emails.send({
    from: "Controlador de Documentos <hola@controladordocumentos.com>",
    to: destinatario,
    subject: "Bienvenido a Controlador de Documentos",
    html: welcomeEmailHtml(),
  });

  if (error) {
    throw new Error(`Error al enviar el email: ${error.message}`);
  }

  console.log(`  Email de bienvenida enviado a ${destinatario}`);
}