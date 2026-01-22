"use server";

export async function verifyRecaptcha(token: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.error("RECAPTCHA_SECRET_KEY is not defined");
        return { success: false, error: "Server configuration error" };
    }

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();

        if (data.success && data.score >= 0.5) {
            return { success: true, score: data.score };
        } else {
            console.warn("reCAPTCHA verification failed:", data);
            return { success: false, error: "Verificação de segurança falhou", score: data.score };
        }
    } catch (error) {
        console.error("Error verifying reCAPTCHA:", error);
        return { success: false, error: "Erro ao verificar segurança" };
    }
}
