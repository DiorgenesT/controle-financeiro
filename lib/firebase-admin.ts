import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
// The credentials are loaded from environment variables
const getFirebaseAdmin = () => {
    if (admin.apps.length === 0) {
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });
    }
    return admin;
};

export const adminAuth = () => getFirebaseAdmin().auth();
export const adminFirestore = () => getFirebaseAdmin().firestore();

// Generate a random password
export function generateRandomPassword(length: number = 12): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
