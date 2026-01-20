import { NextRequest, NextResponse } from "next/server";
import { abacatePay } from "@/lib/abacatepay";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Get the origin for redirect URLs
        const origin = request.headers.get("origin") || "https://tatudoemdia.com.br";

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Create a billing (cobrança)
        const billing = await abacatePay.billing.create({
            frequency: "ONE_TIME",
            methods: ["PIX"],
            products: [
                {
                    externalId: "plano-anual",
                    name: "Plano Anual - Tudo Em Dia",
                    quantity: 1,
                    price: 6790, // R$ 67,90 in cents
                    description: "Acesso anual ao sistema de controle financeiro",
                },
            ],
            returnUrl: `${origin}/sucesso`,
            completionUrl: `${origin}/sucesso`,
            customer: {
                email: email,
                name: email.split("@")[0], // Fallback name
                taxId: "00000000000", // Placeholder CPF
            },
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
