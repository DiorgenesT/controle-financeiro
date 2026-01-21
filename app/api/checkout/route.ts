import { NextRequest, NextResponse } from "next/server";
import { asaas } from "@/lib/asaas";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, cpf, phone } = body;

        if (!name || !email || !cpf || !phone) {
            return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
        }

        // 1. Create/Get Customer
        const customer = await asaas.customers.create({
            name,
            email,
            cpfCnpj: cpf,
            mobilePhone: phone,
        });

        // 2. Create Payment
        const payment = await asaas.payments.create({
            customer: customer.id,
            billingType: "PIX",
            value: 67.90,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
            description: "Plano Anual - Tudo Em Dia",
            externalReference: "plano-anual",
        });

        return NextResponse.json({ url: payment.invoiceUrl });

    } catch (error) {
        console.error("Checkout Error:", error);
        return NextResponse.json(
            { error: "Erro ao processar pagamento", details: String(error) },
            { status: 500 }
        );
    }
}
