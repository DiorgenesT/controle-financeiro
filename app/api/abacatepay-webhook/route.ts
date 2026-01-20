import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminFirestore, generateRandomPassword } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        const { event, data } = body;

        console.log("AbacatePay Webhook Event:", event);

        if (event === "BILLING_PAID") {
            const customerEmail = data.customer.email;

            if (!customerEmail) {
                console.error("No customer email in webhook data");
                return NextResponse.json({ error: "No customer email" }, { status: 400 });
            }

            const auth = adminAuth();
            const firestore = adminFirestore();

            // Check if user already exists
            let user;
            let tempPassword = "";
            let isNewUser = false;

            try {
                user = await auth.getUserByEmail(customerEmail);
                console.log("User already exists:", user.uid);
            } catch {
                // User doesn't exist, create new one
                isNewUser = true;
                tempPassword = generateRandomPassword();

                user = await auth.createUser({
                    email: customerEmail,
                    password: tempPassword,
                    emailVerified: true,
                });

                console.log("Created new user:", user.uid);
            }

            // Calculate subscription end date (1 year from now)
            const subscriptionEnd = new Date();
            subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

            // Save subscription data to Firestore
            await firestore.collection("users").doc(user.uid).set({
                email: customerEmail,
                subscriptionStatus: "active",
                subscriptionStart: new Date().toISOString(),
                subscriptionEnd: subscriptionEnd.toISOString(),
                createdAt: new Date().toISOString(),
                requirePasswordChange: isNewUser,
                paymentProvider: "abacatepay",
                lastPaymentId: data.id,
            }, { merge: true });

            // Send welcome email only for new users
            if (isNewUser && tempPassword) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tatudoemdia.com.br";

                try {
                    await fetch(`${appUrl}/api/send-welcome-email`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: customerEmail,
                            password: tempPassword,
                        }),
                    });
                    console.log("Welcome email sent to:", customerEmail);
                } catch (emailError) {
                    console.error("Failed to send welcome email:", emailError);
                }
            }

            return NextResponse.json({ received: true, userId: user.uid });
        }

        return NextResponse.json({ received: true, ignored: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { error: "Error processing webhook" },
            { status: 500 }
        );
    }
}
