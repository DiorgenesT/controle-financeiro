import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, cpf, phone, paymentMethod } = body;

        // Map frontend payment method to Stripe payment method types
        let paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [];

        if (paymentMethod === "PIX") paymentMethods = ["pix"];
        else if (paymentMethod === "CREDIT_CARD") paymentMethods = ["card"];
        else if (paymentMethod === "BOLETO") paymentMethods = ["boleto"];
        else paymentMethods = ["card", "pix", "boleto"]; // Default fallback

        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethods,
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Plano Anual - Tudo Em Dia',
                            description: 'Acesso completo por 1 ano',
                        },
                        unit_amount: 6790, // R$ 67,90
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${request.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.headers.get('origin')}/checkout`,
            customer_email: email,
            phone_number_collection: {
                enabled: true,
            },
            payment_method_options: {
                card: {
                    installments: {
                        enabled: true,
                    },
                },
            },
            metadata: {
                customer_name: name,
                customer_cpf: cpf,
                customer_phone: phone,
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
