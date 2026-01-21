import { NextRequest, NextResponse } from "next/server";
import { abacatePay } from "@/lib/abacatepay";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.ABACATEPAY_API_KEY;

        if (!apiKey) {
            console.error("Missing ABACATEPAY_API_KEY");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { email, name, cellphone, taxId } = body;

        if (!email || !name || !cellphone || !taxId) {
            return NextResponse.json({ error: "Email, Name, Cellphone and CPF are required" }, { status: 400 });
        }

        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://tatudoemdia.com.br";

        // Create billing
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
            returnUrl: `${origin}/sucesso?email=${encodeURIComponent(email)}`,
            completionUrl: `${origin}/sucesso?email=${encodeURIComponent(email)}`,
            customer: {
                email: email,
                name: name,
                cellphone: cellphone,
                taxId: taxId,
            },
        }, apiKey);

        console.log("AbacatePay billing created:", billing);

        // AbacatePay response structure usually has data.url
        const paymentUrl = billing.data?.url || billing.url;

        if (!paymentUrl) {
            throw new Error("Payment URL not found in response");
        }

        return NextResponse.json({ url: paymentUrl });

    } catch (error) {
        console.error("Checkout Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Erro ao processar checkout", details: errorMessage },
            { status: 500 }
        );
    }
}
