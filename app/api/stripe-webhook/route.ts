import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminAuth, generateRandomPassword } from "@/lib/firebase-admin";
import { resend } from "@/lib/resend";
import Stripe from "stripe";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Allow': 'POST, OPTIONS',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
        },
    });
}

export async function POST(request: Request) {
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

    console.log(`[Webhook] Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Webhook] Processing session: ${session.id}`);

        const email = session.customer_details?.email;
        const name = session.customer_details?.name || "Cliente";
        const phone = session.customer_details?.phone;

        console.log(`[Webhook] Customer: ${email}, Name: ${name}`);

        if (email) {
            try {
                // 1. Check if user exists in Firebase
                let userRecord;
                let isNewUser = false;

                try {
                    userRecord = await adminAuth().getUserByEmail(email);
                    console.log(`[Webhook] User already exists: ${userRecord.uid}`);
                } catch (error) {
                    // User does not exist, create new user
                    console.log(`[Webhook] User not found, creating new user for ${email}...`);
                    isNewUser = true;
                    const password = generateRandomPassword();

                    userRecord = await adminAuth().createUser({
                        email: email,
                        emailVerified: true,
                        password: password,
                        displayName: name,
                        disabled: false,
                    });

                    console.log(`[Webhook] Created new user: ${userRecord.uid}`);

                    // 2. Send Welcome Email with Credentials
                    console.log(`[Webhook] Sending welcome email to ${email}...`);
                    const emailResult = await resend.emails.send({
                        from: 'Tudo Em Dia <noreply@tatudoemdia.com.br>',
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
                    console.log(`[Webhook] Email sent result:`, emailResult);
                }

                // 3. Update User Subscription Status
                console.log(`[Webhook] Updating Firestore for user: ${userRecord.uid}`);
                const { adminFirestore } = await import("@/lib/firebase-admin");
                await adminFirestore().collection('users').doc(userRecord.uid).set({
                    subscriptionStatus: 'active',
                    stripeCustomerId: session.customer as string,
                    updatedAt: new Date(),
                    ...(isNewUser && { createdAt: new Date(), isFirstAccess: true })
                }, { merge: true });

                console.log(`[Webhook] Successfully updated subscription for user: ${userRecord.uid}`);

            } catch (error: any) {
                console.error("[Webhook] CRITICAL ERROR processing webhook:", error);
                console.error("[Webhook] Error stack:", error.stack);
                return NextResponse.json({ error: "Error processing webhook", details: error.message }, { status: 500 });
            }
        } else {
            console.log("[Webhook] No email found in session customer_details");
        }
    } else {
        console.log(`[Webhook] Ignoring event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
