import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No tienes una suscripción activa." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/cuenta`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error en /api/stripe/portal:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al abrir el portal: ${mensaje}` },
      { status: 500 }
    );
  }
}