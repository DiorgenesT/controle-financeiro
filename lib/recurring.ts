import { db } from "./firebase";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, documentId, runTransaction } from "firebase/firestore";
import { RecurringTransaction, Transaction } from "@/types";
import { addTransaction } from "./firestore";
import { updateAccountBalance } from "./accounts";
import { roundCurrency } from "./utils";

const COLLECTION = "recurring_transactions";

export async function processRecurringTransaction(userId: string, recurring: RecurringTransaction, actualValue?: number): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // =================================================================
    // PATH 1: Credit Card (Hybrid: Atomic Lock + Standard Processing)
    // =================================================================
    if (recurring.paymentMethod === "credit" && recurring.creditCardId) {
        // 1. Atomic Lock (Prevent double processing)
        await runTransaction(db, async (transaction) => {
            const recurringRef = doc(db, COLLECTION, recurring.id);
            const recurringDoc = await transaction.get(recurringRef);

            if (!recurringDoc.exists()) throw new Error("Transação recorrente não encontrada.");

            const currentRecurring = recurringDoc.data() as RecurringTransaction;

            // Check Idempotency
            if (currentRecurring.lastProcessedDate) {
                const lastProcessed = currentRecurring.lastProcessedDate instanceof Timestamp
                    ? currentRecurring.lastProcessedDate.toDate()
                    : new Date(currentRecurring.lastProcessedDate);

                if (lastProcessed.getMonth() === today.getMonth() && lastProcessed.getFullYear() === today.getFullYear()) {
                    throw new Error("Esta transação já foi processada este mês.");
                }
            }

            // Update lastProcessedDate immediately to "lock" it
            transaction.update(recurringRef, {
                lastProcessedDate: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        });

        // 2. Heavy Lifting (Invoice logic)
        try {
            const { getCreditCards, getOrCreateInvoice, updateInvoiceTotal, getInvoiceMonthYear } = await import("./creditCards");

            const cards = await getCreditCards(userId);
            const card = cards.find(c => c.id === recurring.creditCardId);
            if (!card) throw new Error("Cartão não encontrado");

            const { month, year } = getInvoiceMonthYear(today, card.closingDay, 0);
            const invoice = await getOrCreateInvoice(card.id, userId, month, year, card.closingDay, card.dueDay);

            const amount = actualValue !== undefined ? actualValue : recurring.amount;
            const transactionData: any = {
                userId,
                type: "despesa",
                amount,
                category: recurring.category,
                description: recurring.description,
                date: invoice.dueDate || new Date(year, month - 1, card.dueDay),
                paymentMethod: "credit",
                creditCardId: card.id,
                invoiceId: invoice.id,
                purchaseDate: today,
                recurringTransactionId: recurring.id,
                personId: recurring.personId,
                createdAt: serverTimestamp(),
                isRecurring: true
            };

            const id = await addTransaction(userId, transactionData);
            await updateInvoiceTotal(invoice.id, amount, "add");
            return id;

        } catch (error) {
            console.error("Erro ao processar cartão após lock:", error);
            // Note: The transaction is already "locked" for the month. 
            // User might need to manually reset or we accept this safety margin.
            throw error;
        }
    }

    // =================================================================
    // PATH 2: Account/Standard (Fully Atomic)
    // =================================================================
    try {
        const result = await runTransaction(db, async (transaction) => {
            // 1. Ler a transação recorrente
            const recurringRef = doc(db, COLLECTION, recurring.id);
            const recurringDoc = await transaction.get(recurringRef);

            if (!recurringDoc.exists()) throw new Error("Transação recorrente não encontrada.");

            const currentRecurring = recurringDoc.data() as RecurringTransaction;

            // Verificar idempotência
            if (currentRecurring.lastProcessedDate) {
                const lastProcessed = currentRecurring.lastProcessedDate instanceof Timestamp
                    ? currentRecurring.lastProcessedDate.toDate()
                    : new Date(currentRecurring.lastProcessedDate);

                if (lastProcessed.getMonth() === today.getMonth() && lastProcessed.getFullYear() === today.getFullYear()) {
                    throw new Error("Esta transação já foi processada este mês.");
                }
            }

            // 2. Preparar dados da nova transação
            const amount = actualValue !== undefined ? actualValue : recurring.amount;
            const newTransactionRef = doc(collection(db, "transactions"));

            const transactionData: any = {
                userId,
                type: recurring.type,
                amount: amount,
                category: recurring.category,
                description: recurring.description,
                date: Timestamp.fromDate(new Date()),
                createdAt: serverTimestamp(),
                isRecurring: true,
                recurringTransactionId: recurring.id,
            };

            if (recurring.paymentMethod) transactionData.paymentMethod = recurring.paymentMethod;
            if (recurring.accountId) transactionData.accountId = recurring.accountId;
            if (recurring.personId) transactionData.personId = recurring.personId;

            // 3. Ler e Atualizar Conta (se aplicável)
            if (recurring.accountId && (recurring.type === 'despesa' || recurring.type === 'receita')) {
                const accountRef = doc(db, "accounts", recurring.accountId);
                const accountDoc = await transaction.get(accountRef);

                if (accountDoc.exists()) {
                    const currentBalance = accountDoc.data().balance || 0;
                    const newBalance = recurring.type === 'receita'
                        ? currentBalance + amount
                        : currentBalance - amount;

                    transaction.update(accountRef, {
                        balance: roundCurrency(newBalance),
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // 4. Criar a Transação
            transaction.set(newTransactionRef, transactionData);

            // 5. Atualizar a Transação Recorrente
            transaction.update(recurringRef, {
                lastProcessedDate: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return newTransactionRef.id;
        });

        return result;

    } catch (error) {
        console.error("Erro ao processar transação recorrente:", error);
        throw error;
    }
}

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

export async function getRecurringTransaction(id: string): Promise<RecurringTransaction | null> {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate(),
            lastProcessedDate: docSnap.data().lastProcessedDate?.toDate(),
        } as RecurringTransaction;
    }
    return null;
}

export async function getRecurringTransactionSafe(id: string, userId: string): Promise<RecurringTransaction | null> {
    // Usar query para evitar erro de permissão se o documento não existir ou não for do usuário
    const q = query(
        collection(db, COLLECTION),
        where(documentId(), "==", id),
        where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnap.data().updatedAt?.toDate(),
            lastProcessedDate: docSnap.data().lastProcessedDate?.toDate(),
        } as RecurringTransaction;
    }
    return null;
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

export async function updateFutureLinkedTransactions(userId: string, recurringId: string, data: Partial<RecurringTransaction>): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", userId),
        where("recurringTransactionId", "==", recurringId),
        where("date", ">=", Timestamp.fromDate(today))
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(async (doc) => {
        const currentData = doc.data();
        const updateData: any = {};

        // Atualizar campos
        if (data.description) updateData.description = data.description;
        if (data.category) updateData.category = data.category;
        if (data.personId !== undefined) updateData.personId = data.personId;

        // Se houve mudança de valor, atualizar saldo
        if (data.amount !== undefined && data.amount !== currentData.amount) {
            updateData.amount = data.amount;

            const diff = roundCurrency(data.amount - currentData.amount);

            // Só atualiza saldo se tiver conta vinculada e for do tipo que afeta saldo
            if (currentData.accountId) {
                if (currentData.type === "receita") {
                    await updateAccountBalance(currentData.accountId, diff, "add");
                } else if (currentData.type === "despesa") {
                    const isDebit = currentData.paymentMethod === "debit" || currentData.paymentMethod === "pix";
                    const isPaidBoleto = currentData.paymentMethod === "boleto" && currentData.boletoStatus === "paid";

                    if (isDebit || isPaidBoleto) {
                        await updateAccountBalance(currentData.accountId, diff, "subtract");
                    }
                }
            }
        }

        return updateDoc(doc.ref, updateData);
    });

    await Promise.all(updatePromises);
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
