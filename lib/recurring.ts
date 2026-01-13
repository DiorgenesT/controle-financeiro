import { db } from "./firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { RecurringTransaction, Transaction } from "@/types";
import { addTransaction } from "./firestore";

const COLLECTION = "recurring_transactions";

export async function getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const q = query(collection(db, COLLECTION), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastProcessedDate: doc.data().lastProcessedDate?.toDate(),
    })) as RecurringTransaction[];
}

export async function addRecurringTransaction(userId: string, data: Omit<RecurringTransaction, "id" | "userId" | "createdAt" | "updatedAt">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        userId,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateRecurringTransaction(id: string, data: Partial<RecurringTransaction>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
}

export interface PendingRecurring extends RecurringTransaction {
    daysUntilDue: number;
}

export async function checkRecurringStatus(userId: string): Promise<PendingRecurring[]> {
    const recurring = await getRecurringTransactions(userId);
    const pending: PendingRecurring[] = [];
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    for (const rec of recurring) {
        if (!rec.active) continue;

        // Verifica se já foi processado neste mês
        let alreadyProcessed = false;
        if (rec.lastProcessedDate) {
            const lastDate = rec.lastProcessedDate instanceof Date ? rec.lastProcessedDate : new Date(rec.lastProcessedDate);
            if (lastDate.getMonth() === currentMonth && lastDate.getFullYear() === currentYear) {
                alreadyProcessed = true;
            }
        }

        if (alreadyProcessed) continue;

        // Calcular dias até o vencimento
        let daysUntilDue = rec.day - currentDay;

        // Se o dia já passou este mês, seria para o próximo mês (não mostramos)
        if (daysUntilDue < 0) {
            // Dia já passou e não foi processado - mostrar como atrasado
            daysUntilDue = 0; // Tratar como vencendo hoje (atrasado)
        }

        // Mostrar pendências até 5 dias antes OU se já venceu
        if (daysUntilDue <= 5) {
            pending.push({
                ...rec,
                daysUntilDue
            });
        }
    }

    // Ordenar por urgência (mais urgente primeiro)
    return pending.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

export async function processRecurringTransaction(userId: string, recurring: RecurringTransaction, actualValue?: number): Promise<string> {
    const today = new Date();

    // Criar a transação real
    const transactionData: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt"> = {
        type: recurring.type,
        amount: actualValue !== undefined ? actualValue : recurring.amount,
        category: recurring.category,
        description: recurring.description,
        date: today,
        paymentMethod: recurring.type === "despesa" ? "debit" : undefined, // Default to debit for expenses
        recurringTransactionId: recurring.id,
        personId: recurring.personId,
    };

    const id = await addTransaction(userId, transactionData);

    // Atualizar lastProcessedDate
    await updateRecurringTransaction(recurring.id, {
        lastProcessedDate: today
    });

    return id;
}
