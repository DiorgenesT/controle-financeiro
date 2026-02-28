import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { ResetPasswordEmail } from "@/components/emails/ResetPasswordEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    if (!process.env.RESEND_API_KEY) {
        console.error("[ResetPassword] Missing RESEND_API_KEY");
        return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

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
        const actionCodeSettings = {
            url: process.env.NEXT_PUBLIC_APP_URL
                ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
                : "https://tatudoemdia.com.br/login",
            handleCodeInApp: false,
        };

        const firebaseLink = await adminAuth().generatePasswordResetLink(email, actionCodeSettings);

        // Extrair o oobCode do link do Firebase para criar nosso link personalizado
        const urlObj = new URL(firebaseLink);
        const oobCode = urlObj.searchParams.get("oobCode");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tatudoemdia.com.br";
        const resetLink = `${baseUrl}/nova-senha?oobCode=${oobCode}`;

        // Enviar email via Resend
        try {
            const { data, error } = await resend.emails.send({
                from: "Tudo Em Dia <nao-responda@tatudoemdia.com.br>",
                to: [email],
                subject: "🔐 Recuperação de Senha - Tudo Em Dia",
                react: <ResetPasswordEmail resetUrl={resetLink} email={email} />,
            });

            if (error) {
                console.error("[ResetPassword] Resend API Error:", error);
                return NextResponse.json(
                    { error: "Falha ao enviar email de recuperação", details: error },
                    { status: 500 }
                );
            }
        } catch (resendError) {
            console.error("[ResetPassword] Resend SDK Exception:", resendError);
            throw resendError;
        }

        return NextResponse.json(
            { message: "Se o email estiver cadastrado, você receberá um link de recuperação." },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("[ResetPassword] CRITICAL ERROR:", error);

        // Handle Firebase Rate Limit
        if (error.code === 'auth/quota-exceeded' ||
            (error.message && error.message.includes('RESET_PASSWORD_EXCEED_LIMIT'))) {
            return NextResponse.json(
                { error: "Muitas tentativas de recuperação. Por favor, aguarde cerca de 1 hora e tente novamente." },
                { status: 429 }
            );
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: "Erro interno do servidor", details: errorMessage },
            { status: 500 }
        );
    }
}
