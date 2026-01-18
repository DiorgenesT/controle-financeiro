import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Get the origin for redirect URLs
        const origin = request.headers.get("origin") || "https://tatudoemdia.com.br";

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            // Stripe will automatically show all enabled payment methods
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID!,
                    quantity: 1,
                },
            ],
            customer_email: email || undefined,
            success_url: `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/#pricing`,
            metadata: {
                source: "landing_page",
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Erro ao criar sessão de pagamento", details: errorMessage },
            { status: 500 }
        );
    }
}
