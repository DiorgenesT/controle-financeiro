import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { ResetPasswordEmail } from "@/components/emails/ResetPasswordEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email é obrigatório" },
                { status: 400 }
            );
        }

        // Verificar se o usuário existe no Firebase
        let userExists = false;
        try {
            await adminAuth().getUserByEmail(email);
            userExists = true;
        } catch {
            // Usuário não encontrado
            userExists = false;
        }

        // Se email não existe, informar o usuário
        if (!userExists) {
            return NextResponse.json(
                { error: "Este email não está cadastrado em nossa base." },
                { status: 404 }
            );
        }

        // Gerar link de reset de senha via Firebase
        console.log("[ResetPassword] Generating reset link for:", email);
        const actionCodeSettings = {
            url: process.env.NEXT_PUBLIC_APP_URL
                ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
                : "https://tatudoemdia.com.br/login",
            handleCodeInApp: false,
        };

        const resetLink = await adminAuth().generatePasswordResetLink(email, actionCodeSettings);
        console.log("[ResetPassword] Reset link generated successfully");

        // Enviar email via Resend
        console.log("[ResetPassword] Sending email via Resend...");
        const { data, error } = await resend.emails.send({
            from: "Tudo Em Dia <nao-responda@tatudoemdia.com.br>",
            to: [email],
            subject: "🔐 Recuperação de Senha - Tudo Em Dia",
            react: <ResetPasswordEmail resetUrl={resetLink} email={email} />,
        });

        if (error) {
            console.error("[ResetPassword] Resend error:", error);
            return NextResponse.json(
                { error: "Falha ao enviar email de recuperação", details: error },
                { status: 500 }
            );
        }

        console.log("[ResetPassword] Email sent successfully:", data?.id);

        return NextResponse.json(
            { message: "Se o email estiver cadastrado, você receberá um link de recuperação." },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("[ResetPassword] CRITICAL ERROR:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Erro interno do servidor", details: errorMessage },
            { status: 500 }
        );
    }
}
