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
    writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { CreditCard, CreditCardInvoice } from "@/types";

export type { CreditCard, CreditCardInvoice };

// ============ CARTÕES ============

export async function getCreditCards(userId: string): Promise<CreditCard[]> {
    const q = query(
        collection(db, "creditCards"),
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
    })) as CreditCard[];
}

export async function createCreditCard(
    userId: string,
    data: Omit<CreditCard, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<string> {
    const docRef = await addDoc(collection(db, "creditCards"), {
        ...data,
        userId,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateCreditCard(
    cardId: string,
    data: Partial<Omit<CreditCard, "id" | "userId" | "createdAt">>
): Promise<void> {
    const docRef = doc(db, "creditCards", cardId);
    await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteCreditCard(cardId: string, userId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Deletar o cartão
    const cardRef = doc(db, "creditCards", cardId);
    batch.delete(cardRef);

    // 2. Buscar e deletar todas as faturas do cartão
    const invoicesQuery = query(
        collection(db, "invoices"),
        where("creditCardId", "==", cardId),
        where("userId", "==", userId)
    );
    const invoicesSnapshot = await getDocs(invoicesQuery);
    invoicesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // 3. Buscar e deletar todas as transações do cartão
    const transactionsQuery = query(
        collection(db, "transactions"),
        where("creditCardId", "==", cardId),
        where("userId", "==", userId)
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    transactionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    // Commit do batch
    await batch.commit();
}

// ============ FATURAS ============

export async function getInvoices(cardId: string, userId: string): Promise<CreditCardInvoice[]> {
    const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("creditCardId", "==", cardId)
    );
    const snapshot = await getDocs(q);
    const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        dueDate: doc.data().dueDate?.toDate(),
        closingDate: doc.data().closingDate?.toDate(),
        paidAt: doc.data().paidAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as CreditCardInvoice[];

    // Ordenar por ano e mês decrescente
    return invoices.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
    });
}

export async function getOrCreateInvoice(
    cardId: string,
    userId: string,
    month: number,
    year: number,
    closingDay: number,
    dueDay: number
): Promise<CreditCardInvoice> {
    // Buscar fatura existente
    const q = query(
        collection(db, "invoices"),
        where("userId", "==", userId),
        where("creditCardId", "==", cardId),
        where("month", "==", month),
        where("year", "==", year)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
            id: snapshot.docs[0].id,
            ...data,
            dueDate: data.dueDate?.toDate(),
            closingDate: data.closingDate?.toDate(),
            paidAt: data.paidAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
        } as CreditCardInvoice;
    }

    // Criar nova fatura
    const closingDate = new Date(year, month - 1, closingDay);
    const dueDate = new Date(year, month - 1, dueDay);

    // Se vencimento é antes do fechamento, é no mês seguinte
    if (dueDay < closingDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
    }

    const docRef = await addDoc(collection(db, "invoices"), {
        creditCardId: cardId,
        userId,
        month,
        year,
        totalAmount: 0,
        status: "open",
        closingDate,
        dueDate,
        createdAt: serverTimestamp(),
    });

    return {
        id: docRef.id,
        creditCardId: cardId,
        userId,
        month,
        year,
        totalAmount: 0,
        status: "open",
        closingDate,
        dueDate,
        createdAt: new Date(),
    };
}

export async function updateInvoiceTotal(
    invoiceId: string,
    amount: number,
    operation: "add" | "subtract"
): Promise<void> {
    const docRef = doc(db, "invoices", invoiceId);
    const snapshot = await getDocs(query(collection(db, "invoices"), where("__name__", "==", invoiceId)));

    if (!snapshot.empty) {
        const currentTotal = snapshot.docs[0].data().totalAmount || 0;
        const newTotal = operation === "add" ? currentTotal + amount : currentTotal - amount;

        await updateDoc(docRef, {
            totalAmount: Math.round(Math.max(0, newTotal) * 100) / 100,
        });
    }
}

export async function payInvoice(
    invoiceId: string,
    accountId: string
): Promise<void> {
    const docRef = doc(db, "invoices", invoiceId);
    await updateDoc(docRef, {
        status: "paid",
        paidAt: serverTimestamp(),
        paidFromAccountId: accountId,
    });
}

// Calcular em qual mês/ano cai uma parcela baseado na data da compra e dia de fechamento
export function getInvoiceMonthYear(
    purchaseDate: Date,
    closingDay: number,
    installmentOffset: number = 0
): { month: number; year: number } {
    const date = new Date(purchaseDate);
    const day = date.getDate();
    let month = date.getMonth() + 1; // 1-12
    let year = date.getFullYear();

    // Se a compra foi após o fechamento, vai para a próxima fatura
    if (day > closingDay) {
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
    }

    // Adicionar offset das parcelas
    month += installmentOffset;
    while (month > 12) {
        month -= 12;
        year += 1;
    }

    return { month, year };
}
export async function getNextInvoice(cardId: string, userId: string): Promise<CreditCardInvoice | undefined> {
    const invoices = await getInvoices(cardId, userId);
    const now = new Date();
    let nextMonth = now.getMonth() + 2; // +1 para mês JS (0-11), +1 para próximo mês
    let nextYear = now.getFullYear();

    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
    }

    return invoices.find(inv => inv.month === nextMonth && inv.year === nextYear);
}
