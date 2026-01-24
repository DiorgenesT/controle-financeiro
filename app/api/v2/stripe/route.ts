import { stripe } from "@/lib/stripe";
import { adminAuth, generateRandomPassword } from "@/lib/firebase-admin";
import { resend } from "@/lib/resend";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET() {
    return new Response("Stripe Webhook V2 is active.", { status: 200 });
}

export async function POST(request: Request) {
    console.log("[Webhook V2] Received POST request");

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        console.error("[Webhook V2] No stripe-signature header");
        return new Response("No signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`[Webhook V2] Signature verification failed: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`[Webhook V2] Event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email;
        const name = session.customer_details?.name || "Cliente";
        const phone = session.customer_details?.phone;

        if (email) {
            try {
                let userRecord;
                let isNewUser = false;

                try {
                    userRecord = await adminAuth().getUserByEmail(email);
                    console.log(`[Webhook V2] User exists: ${userRecord.uid}`);
                } catch (error) {
                    console.log(`[Webhook V2] Creating new user for ${email}`);
                    isNewUser = true;
                    const password = generateRandomPassword();

                    userRecord = await adminAuth().createUser({
                        email: email,
                        emailVerified: true,
                        password: password,
                        displayName: name,
                        phoneNumber: phone || undefined,
                    });

                    await resend.emails.send({
                        from: 'Tudo Em Dia <nao-responda@tudoemdia.app>',
                        to: email,
                        subject: 'Bem-vindo ao Tudo Em Dia! Seu acesso chegou.',
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #10b981;">Bem-vindo ao Tudo Em Dia! 🚀</h1>
                                <p>Olá, <strong>${name}</strong>!</p>
                                <p>Seu pagamento foi confirmado e sua conta foi criada com sucesso.</p>
                                <p>Aqui estão suas credenciais de acesso:</p>
                                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
                                    <p style="margin: 10px 0 0;"><strong>Senha Temporária:</strong> ${password}</p>
                                </div>
                                <p>Recomendamos que você altere sua senha após o primeiro login.</p>
                                <a href="https://tatudoemdia.com.br/login" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Agora</a>
                            </div>
                        `,
                    });
                }

                const { adminFirestore } = await import("@/lib/firebase-admin");
                await adminFirestore().collection('users').doc(userRecord.uid).set({
                    subscriptionStatus: 'active',
                    stripeCustomerId: session.customer as string,
                    updatedAt: new Date(),
                    ...(isNewUser && { createdAt: new Date(), isFirstAccess: true })
                }, { merge: true });

                console.log(`[Webhook V2] Success for ${userRecord.uid}`);
            } catch (error: any) {
                console.error("[Webhook V2] Error:", error);
                return new Response("Internal Error", { status: 500 });
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
