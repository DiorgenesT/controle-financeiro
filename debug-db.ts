import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=');
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key.trim()] = value.trim();
        }
    });
}

async function debug() {
    console.log('--- DB DEBUG START ---');
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);

    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (privateKey) {
        privateKey = privateKey.replace(/\\n/g, '\n');
        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
            privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
        }
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    }

    const db = admin.firestore();
    const userId = 'GqQY7I13z9VjU3XAn9QfE4vFjP22';
    const month = 3;
    const year = 2026;

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    console.log(`Querying March 2026: ${start.toISOString()} to ${end.toISOString()}`);

    try {
        const txSnap = await db.collection('transactions')
            .where('userId', '==', userId)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
            .get();

        console.log(`Found ${txSnap.size} transactions for March.`);

        const octStart = new Date(2025, 9, 1);
        const octEnd = new Date(2025, 9, 31, 23, 59, 59);
        const octSnap = await db.collection('transactions')
            .where('userId', '==', userId)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(octStart))
            .where('date', '<=', admin.firestore.Timestamp.fromDate(octEnd))
            .get();
        console.log(`Found ${octSnap.size} transactions for October 2025.`);

    } catch (e: any) {
        console.error('FAILED TO QUERY:', e.message);
    }
}

debug();
