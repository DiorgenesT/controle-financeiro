import { db, auth } from "./firebase";
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

// Coleções para limpar
const COLLECTIONS = [
    "transactions",
    "accounts",
    "creditCards",
    "invoices",
    "goals",
    "categories",
    "people",
    "recurring_transactions"
];

export async function resetUserData(userId: string): Promise<void> {
    if (!userId) throw new Error("Usuário não identificado");

    // Usar batch para deletar (limite de 500 operações por batch)
    // Como pode haver muitos documentos, vamos fazer em loops

    for (const collectionName of COLLECTIONS) {
        const q = query(collection(db, collectionName), where("userId", "==", userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) continue;

        // Deletar em batches de 500
        const chunks: any[][] = [];
        let currentChunk: any[] = [];

        snapshot.docs.forEach(doc => {
            currentChunk.push(doc);
            if (currentChunk.length === 500) {
                chunks.push([...currentChunk]);
                currentChunk = [];
            }
        });
        if (currentChunk.length > 0) chunks.push(currentChunk);

        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(docSnap => {
                batch.delete(docSnap.ref);
            });
            await batch.commit();
        }
    }
}

export async function reauthenticate(password: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error("Usuário não autenticado");

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
}
