import { NextRequest, NextResponse } from "next/server";
import { firebaseAuthRest, firestoreRest, generateRandomPassword } from "@/lib/firebase-edge";

export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { event, data } = body;

        console.log("AbacatePay Webhook Event:", event);

        if (event === "billing.paid") {
            const customerEmail = data.customer.email;
            const billingId = data.id;

            if (!customerEmail) {
                console.error("No customer email in webhook data");
                return NextResponse.json({ error: "No customer email" }, { status: 400 });
            }

            // Check if user already exists
            let userId: string;
            let tempPassword = "";
            let isNewUser = false;

            const existingUser = await firebaseAuthRest.getUserByEmail(customerEmail);

            if (existingUser) {
                userId = existingUser.uid;
                console.log("User already exists:", userId);
            } else {
                // User doesn't exist, create new one
                isNewUser = true;
                tempPassword = generateRandomPassword();

                const newUser = await firebaseAuthRest.createUser({
                    email: customerEmail,
                    password: tempPassword,
                    displayName: data.customer.name || customerEmail.split("@")[0],
                });

                userId = newUser.uid;
                console.log("Created new user:", userId);
            }

            // Calculate subscription end date (1 year from now)
            const subscriptionEnd = new Date();
            subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

            // Save subscription data to Firestore
            await firestoreRest.setDocument("users", userId, {
                email: customerEmail,
                abacatePayBillingId: billingId,
                subscriptionStatus: "active",
                subscriptionStart: new Date().toISOString(),
                subscriptionEnd: subscriptionEnd.toISOString(),
                updatedAt: new Date().toISOString(),
                requirePasswordChange: isNewUser,
            });

            // Send welcome email only for new users
            if (isNewUser && tempPassword) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tatudoemdia.com.br";

                await fetch(`${appUrl}/api/send-welcome-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: customerEmail,
                        password: tempPassword,
                    }),
                });

                console.log("Welcome email sent to:", customerEmail);
            }

            return NextResponse.json({ received: true, userId });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error processing AbacatePay webhook:", error);
        return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
    }
}
