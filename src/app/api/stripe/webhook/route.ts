import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/utils/stripe";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Falta la firma de Stripe." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Error verificando el webhook:", err);
    return NextResponse.json(
      { error: "Firma del webhook inválida." },
      { status: 400 }
    );
  }

  try {
    // Usamos el cliente admin centralizado que creamos
    const supabaseAdmin = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== "subscription") {
          break;
        }

        const userId = session.metadata?.userId;
        if (!userId) {
          console.error("STRIPE_CHECKOUT_USER_MISSING", { eventId: event.id });
          throw new Error("El checkout no tiene un usuario asociado.");
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!customerId || !subscriptionId) {
          throw new Error("Faltan datos del cliente o de la suscripción.");
        }

        // Verificamos el estado real en Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const status = subscription.status === "active" ? "active" : "inactive";

        const priceId = subscription.items.data[0].price.id;
        let tier = "despacho";
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
          tier = "pro";
        }

        const { data: profile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_tier: tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", userId)
          .select("id")
          .maybeSingle();

        if (updateError || !profile) {
          console.error("STRIPE_PROFILE_UPDATE_FAILED", {
            eventId: event.id,
            eventType: event.type,
            code: updateError?.code ?? "PROFILE_NOT_FOUND",
          });
          throw new Error("No se pudo guardar la suscripción.");
        }

        console.log(`Suscripción activada para usuario ${userId} (${tier})`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const priceId = subscription.items.data[0].price.id;
        let tier = "despacho";
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
          tier = "pro";
        }

        const status = subscription.status === "active" ? "active" : "inactive";

        const { data: profile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_tier: tier,
          })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .maybeSingle();

        if (updateError || !profile) {
          console.error("STRIPE_PROFILE_UPDATE_FAILED", {
            eventId: event.id,
            eventType: event.type,
            code: updateError?.code ?? "PROFILE_NOT_FOUND",
          });
          throw new Error("No se pudo actualizar la suscripción.");
        }

        console.log(`Suscripción actualizada para cliente ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const { data: profile, error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "inactive",
          })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .maybeSingle();

        if (updateError || !profile) {
          console.error("STRIPE_PROFILE_UPDATE_FAILED", {
            eventId: event.id,
            eventType: event.type,
            code: updateError?.code ?? "PROFILE_NOT_FOUND",
          });
          throw new Error("No se pudo guardar la cancelación.");
        }

        console.log(`Suscripción cancelada para cliente ${customerId}`);
        break;
      }

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error procesando el webhook:", error);
    return NextResponse.json(
      { error: "Error al procesar el webhook." },
      { status: 500 }
    );
  }
}