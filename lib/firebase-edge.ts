// Firebase REST API helpers for Edge Runtime
// These functions use REST APIs instead of firebase-admin SDK

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Get access token using service account credentials
async function getAccessToken(): Promise<string> {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!clientEmail || !privateKey) {
        throw new Error("Missing Firebase service account credentials");
    }

    // Create JWT for Google OAuth
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
        iss: clientEmail,
        scope: "https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
    };

    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(payload));
    const signInput = `${base64Header}.${base64Payload}`;

    // Sign with private key using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = privateKey
        .replace("-----BEGIN PRIVATE KEY-----", "")
        .replace("-----END PRIVATE KEY-----", "")
        .replace(/\s/g, "");

    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
        "pkcs8",
        binaryKey,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        encoder.encode(signInput)
    );

    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const jwt = `${base64Header.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${base64Payload.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}.${base64Signature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
}

// Firebase Auth REST API
export const firebaseAuthRest = {
    // Get user by email
    async getUserByEmail(email: string): Promise<{ uid: string; email: string } | null> {
        const accessToken = await getAccessToken();

        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:lookup`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: [email],
                }),
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data.users && data.users.length > 0) {
            return { uid: data.users[0].localId, email: data.users[0].email };
        }
        return null;
    },

    // Create user with email and password
    async createUser(params: {
        email: string;
        password: string;
        displayName?: string;
    }): Promise<{ uid: string; email: string }> {
        // Use the public signup endpoint
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: params.email,
                    password: params.password,
                    displayName: params.displayName,
                    returnSecureToken: true,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || "Failed to create user");
        }

        const data = await response.json();
        return { uid: data.localId, email: data.email };
    },
};

// Firestore REST API
export const firestoreRest = {
    // Set document (with merge)
    async setDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<void> {
        const accessToken = await getAccessToken();

        // Convert data to Firestore format
        const fields: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === "string") {
                fields[key] = { stringValue: value };
            } else if (typeof value === "number") {
                fields[key] = { integerValue: String(value) };
            } else if (typeof value === "boolean") {
                fields[key] = { booleanValue: value };
            } else if (value === null) {
                fields[key] = { nullValue: null };
            }
        }

        const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fields }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to set document: ${error}`);
        }
    },
};

// Generate a random password (Edge compatible)
export function generateRandomPassword(length: number = 12): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => chars[byte % chars.length]).join("");
}
