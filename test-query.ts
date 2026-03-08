import { db, admin } from './lib/firebase-admin';

async function test() {
    const userId = 'GqQY7I13z9VjU3XAn9QfE4vFjP22'; // Use a known userId or mock
    const start = new Date(2026, 2, 1);
    const end = new Date(2026, 3, 0);
    try {
        const snap = await db.collection('transactions')
            .where('userId', '==', userId)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
            .get();
        console.log('Success, found:', snap.size);
    } catch (e: any) {
        console.error('Error target:', e.message);
    }
}
test();
