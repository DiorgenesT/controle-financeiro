import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminAuth, generateRandomPassword } from "@/lib/firebase-admin";
import { resend } from "@/lib/resend";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const email = session.customer_details?.email;
        const name = session.customer_details?.name || "Cliente";
        const phone = session.customer_details?.phone;
        const taxId = session.customer_details?.tax_ids?.[0]?.value; // CPF/CNPJ if collected

        if (email) {
            try {
                // 1. Check if user exists in Firebase
                let userRecord;
                let isNewUser = false;

                try {
                    userRecord = await adminAuth().getUserByEmail(email);
                    console.log(`User already exists: ${email}`);
                } catch (error) {
                    // User does not exist, create new user
                    isNewUser = true;
                    const password = generateRandomPassword();

                    userRecord = await adminAuth().createUser({
                        email: email,
                        emailVerified: true,
                        password: password,
                        displayName: name,
                        phoneNumber: phone || undefined,
                        disabled: false,
                    });

                    console.log(`Created new user: ${userRecord.uid}`);

                    // 2. Send Welcome Email with Credentials
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
                                <a href="https://tudoemdia.app/login" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acessar Agora</a>
                            </div>
                        `,
                    });
                    console.log(`Welcome email sent to: ${email}`);
                }

                // 3. Update User Subscription Status (For both new and existing users)
                const { adminFirestore } = await import("@/lib/firebase-admin");
                await adminFirestore().collection('users').doc(userRecord.uid).set({
                    subscriptionStatus: 'active',
                    stripeCustomerId: session.customer as string,
                    updatedAt: new Date(),
                    ...(isNewUser && { createdAt: new Date(), isFirstAccess: true })
                }, { merge: true });

                console.log(`Updated subscription for user: ${userRecord.uid}`);

            } catch (error) {
                console.error("Error processing webhook:", error);
                return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
