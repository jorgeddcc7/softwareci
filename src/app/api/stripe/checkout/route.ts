import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/utils/stripe";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (process.env.NEXT_PUBLIC_AUTH_ENABLED === "true") {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json(
          { error: "Debes iniciar sesión para suscribirte." },
          { status: 401 }
        );
      }

      userId = user.id;
      userEmail = user.email ?? null;
    }

    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "Falta el identificador del plan." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail ?? undefined,
      client_reference_id: userId ?? undefined,
      metadata: { userId: userId ?? "" },
      success_url: `${origin}/precios/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/precios?cancelado=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error en /api/stripe/checkout:", error);
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al crear la sesión de pago: ${mensaje}` },
      { status: 500 }
    );
  }
}