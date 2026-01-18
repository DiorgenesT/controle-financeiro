import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { WelcomeEmail } from "@/components/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email e senha são obrigatórios" },
                { status: 400 }
            );
        }

        const loginUrl = process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
            : "https://tatudoemdia.com.br/login";

        const { data, error } = await resend.emails.send({
            from: "Tudo Em Dia <noreply@tatudoemdia.com.br>",
            to: [email],
            subject: "🎉 Bem-vindo ao Tudo Em Dia! Suas credenciais de acesso",
            react: <WelcomeEmail email={email} password={password} loginUrl={loginUrl} />,
        });

        if (error) {
            console.error("Erro ao enviar email:", error);
            return NextResponse.json(
                { error: "Falha ao enviar email" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Email enviado com sucesso", id: data?.id },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Erro no endpoint de email:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Erro interno do servidor", details: errorMessage },
            { status: 500 }
        );
    }
}
