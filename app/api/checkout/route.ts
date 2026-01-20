import { NextRequest, NextResponse } from "next/server";
import { abacatePay } from "@/lib/abacatepay";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://tatudoemdia.com.br";

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Create customer first
        const customer = await abacatePay.customer.create({
            email: email,
            name: email.split("@")[0],
            cellphone: "11999999999", // Placeholder - required by AbacatePay
        });

        // 2. Create billing with customerId
        const billing = await abacatePay.billing.create({
            frequency: "ONE_TIME",
            methods: ["PIX"],
            products: [
                {
                    externalId: "plano-anual",
                    name: "Plano Anual - Tudo Em Dia",
                    quantity: 1,
                    price: 6790,
                    description: "Acesso anual ao sistema de controle financeiro",
                },
            ],
            returnUrl: `${origin}/sucesso?email=${encodeURIComponent(email)}`,
            completionUrl: `${origin}/sucesso?email=${encodeURIComponent(email)}`,
            customerId: customer.id,
        });

        return NextResponse.json({ url: billing.url });
    } catch (error) {
        console.error("AbacatePay Checkout Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Erro ao criar cobrança", details: errorMessage },
            { status: 500 }
        );
    }
}
