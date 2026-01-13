import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Transaction, Goal } from "@/types";

// ==================== TRANSAÇÕES ====================

export async function addTransaction(
    userId: string,
    data: Omit<Transaction, "id" | "userId" | "createdAt">
): Promise<string> {
    // Garantir que a data seja tratada corretamente no fuso horário local
    let dateToSave: Date;
    const dateInput = data.date as Date | string;

    if (dateInput instanceof Date) {
        dateToSave = dateInput;
    } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
        // Se for string YYYY-MM-DD, usar meio-dia para evitar problema de fuso
        const [year, month, day] = dateInput.split('-').map(Number);
        dateToSave = new Date(year, month - 1, day, 12, 0, 0);
    } else {
        dateToSave = new Date();
    }

    const docRef = await addDoc(collection(db, "transactions"), {
        ...data,
        userId,
        date: Timestamp.fromDate(dateToSave),
        createdAt: serverTimestamp(),
    });

    // Atualizar metas vinculadas se for uma receita
    if (data.accountId && data.type === 'receita') {
        try {
            const goalsQuery = query(
                collection(db, "goals"),
                where("userId", "==", userId),
                where("linkedAccountId", "==", data.accountId)
            );
            const goalsSnapshot = await getDocs(goalsQuery);

            const updatePromises = goalsSnapshot.docs.map(async (goalDoc) => {
                const goalData = goalDoc.data() as Goal;
                const newAmount = (goalData.currentAmount || 0) + data.amount;
                const newStatus = newAmount >= goalData.targetAmount ? "concluida" : "em_progresso";

                await updateDoc(doc(db, "goals", goalDoc.id), {
                    currentAmount: newAmount,
                    status: newStatus,
                    updatedAt: serverTimestamp()
                });
            });

            await Promise.all(updatePromises);
        } catch (error) {
            console.error("Erro ao atualizar metas vinculadas:", error);
            // Não falhar a criação da transação se a atualização da meta falhar
        }
    }

    return docRef.id;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
    const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Transaction[];
}

export async function updateTransaction(
    transactionId: string,
    data: Partial<Transaction>
): Promise<void> {
    const docRef = doc(db, "transactions", transactionId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteTransaction(transactionId: string): Promise<void> {
    await deleteDoc(doc(db, "transactions", transactionId));
}

export async function getTransaction(transactionId: string): Promise<Transaction | null> {
    const docRef = doc(db, "transactions", transactionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data(),
            date: docSnap.data().date?.toDate() || new Date(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        } as Transaction;
    }
    return null;
}

// ==================== METAS ====================

export async function addGoal(
    userId: string,
    data: Omit<Goal, "id" | "userId" | "createdAt" | "status">
): Promise<string> {
    const docRef = await addDoc(collection(db, "goals"), {
        ...data,
        userId,
        status: "em_progresso",
        deadline: Timestamp.fromDate(new Date(data.deadline)),
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getGoals(userId: string): Promise<Goal[]> {
    const q = query(
        collection(db, "goals"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Goal[];
}

export async function updateGoal(
    goalId: string,
    data: Partial<Goal>
): Promise<void> {
    const docRef = doc(db, "goals", goalId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteGoal(goalId: string): Promise<void> {
    await deleteDoc(doc(db, "goals", goalId));
}

// ==================== USUÁRIO ====================

export async function updateUserProfile(
    userId: string,
    data: { displayName?: string; photoURL?: string }
): Promise<void> {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, data);
}
