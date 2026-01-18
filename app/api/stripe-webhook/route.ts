import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminFirestore, generateRandomPassword } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const customerEmail = session.customer_email;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!customerEmail) {
            console.error("No customer email in session");
            return NextResponse.json({ error: "No customer email" }, { status: 400 });
        }

        try {
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
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: "active",
                subscriptionStart: new Date().toISOString(),
                subscriptionEnd: subscriptionEnd.toISOString(),
                createdAt: new Date().toISOString(),
                requirePasswordChange: isNewUser,
            }, { merge: true });

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

            return NextResponse.json({ received: true, userId: user.uid });
        } catch (error) {
            console.error("Error processing webhook:", error);
            return NextResponse.json({ error: "Error processing webhook" }, { status: 500 });
        }
    }

    // Handle subscription updates
    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        try {
            const firestore = adminFirestore();
            
            // Find user by stripeCustomerId
            const usersSnapshot = await firestore
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

            if (!usersSnapshot.empty) {
                const userDoc = usersSnapshot.docs[0];
                await userDoc.ref.update({
                    subscriptionStatus: subscription.status,
                    subscriptionEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
                });
            }
        } catch (error) {
            console.error("Error updating subscription:", error);
        }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        try {
            const firestore = adminFirestore();
            
            const usersSnapshot = await firestore
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

            if (!usersSnapshot.empty) {
                const userDoc = usersSnapshot.docs[0];
                await userDoc.ref.update({
                    subscriptionStatus: "canceled",
                });
            }
        } catch (error) {
            console.error("Error handling cancellation:", error);
        }
    }

    return NextResponse.json({ received: true });
}
