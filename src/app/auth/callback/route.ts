import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendWelcomeEmail } from "@/utils/send-welcome-email";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/analizar";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Comprobar si ya se envió el welcome email
      const { data: profile } = await supabase
        .from("profiles")
        .select("welcome_email_sent, email")
        .eq("id", data.user.id)
        .single();

      if (profile && !profile.welcome_email_sent && profile.email) {
        // Enviar welcome email (sin bloquear el redirect si falla)
        try {
          await sendWelcomeEmail(profile.email);
          await supabase
            .from("profiles")
            .update({ welcome_email_sent: true })
            .eq("id", data.user.id);
        } catch (emailError) {
          console.error("Error enviando welcome email:", emailError);
          // No bloqueamos el redirect
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}