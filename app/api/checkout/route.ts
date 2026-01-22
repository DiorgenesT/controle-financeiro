import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "boleto"],
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/`,
            phone_number_collection: {
                enabled: true,
            },
            tax_id_collection: {
                enabled: true,
            },
            payment_method_options: {
                card: {
                    installments: {
                        enabled: true,
                    },
                },
                boleto: {
                    expires_after_days: 3,
                },
            },
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json(
            { error: "Erro ao criar sessão de pagamento", details: String(error) },
            { status: 500 }
        );
    }
}
