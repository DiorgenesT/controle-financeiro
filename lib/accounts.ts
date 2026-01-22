import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    increment
} from "firebase/firestore";
import { db } from "./firebase";
import { Account } from "@/types";

export type { Account };

// Buscar todas as contas do usuário
export async function getAccounts(userId: string): Promise<Account[]> {
    const q = query(
        collection(db, "accounts"),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
    })) as Account[];
}

// Criar nova conta
export async function createAccount(
    userId: string,
    data: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
    // Se for a primeira conta ou marcada como padrão, desmarcar outras
    if (data.isDefault) {
        await unsetDefaultAccounts(userId);
    }

    const docRef = await addDoc(collection(db, "accounts"), {
        ...data,
        userId,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

// Atualizar conta
export async function updateAccount(
    accountId: string,
    data: Partial<Omit<Account, "id" | "userId" | "createdAt">>
): Promise<void> {
    const docRef = doc(db, "accounts", accountId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

// Excluir conta
export async function deleteAccount(accountId: string): Promise<void> {
    await deleteDoc(doc(db, "accounts", accountId));
}

// Atualizar saldo da conta
export async function updateAccountBalance(
    accountId: string,
    amount: number,
    operation: "add" | "subtract"
): Promise<void> {
    const docRef = doc(db, "accounts", accountId);

    // Buscar saldo atual para aplicar arredondamento no resultado final
    const docSnap = await getDocs(query(collection(db, "accounts"), where("__name__", "==", accountId)));

    if (!docSnap.empty) {
        const currentBalance = docSnap.docs[0].data().balance || 0;
        const newBalance = operation === "add"
            ? currentBalance + amount
            : currentBalance - amount;

        await updateDoc(docRef, {
            balance: Math.round(newBalance * 100) / 100, // Arredondar resultado final
            updatedAt: serverTimestamp(),
        });
    }
}

// Desmarcar todas as contas padrão de um usuário
async function unsetDefaultAccounts(userId: string): Promise<void> {
    const q = query(
        collection(db, "accounts"),
        where("userId", "==", userId),
        where("isDefault", "==", true)
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, "accounts", docSnap.id), {
            isDefault: false,
        });
    }
}

// Buscar conta padrão
export async function getDefaultAccount(userId: string): Promise<Account | null> {
    const q = query(
        collection(db, "accounts"),
        where("userId", "==", userId),
        where("isDefault", "==", true)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        // Se não há conta padrão, pegar a primeira
        const accounts = await getAccounts(userId);
        return accounts[0] || null;
    }

    const data = snapshot.docs[0].data();
    return {
        id: snapshot.docs[0].id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
    } as Account;
}
