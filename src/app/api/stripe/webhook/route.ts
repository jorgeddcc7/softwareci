import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/utils/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error("No hay userId en el metadata del checkout.");
          break;
        }

        let tier = "despacho";
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          const priceId = subscription.items.data[0].price.id;
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
            tier = "pro";
          }
        }

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "active",
            subscription_tier: tier,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", userId);

        console.log(`Suscripción activada para usuario ${userId} (${tier})`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;

        let tier = "despacho";
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) {
          tier = "pro";
        }

        const status = subscription.status === "active" ? "active" : "inactive";

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            subscription_tier: tier,
          })
          .eq("stripe_customer_id", customerId);

        console.log(`Suscripción actualizada para cliente ${customerId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: "inactive",
          })
          .eq("stripe_customer_id", customerId);

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