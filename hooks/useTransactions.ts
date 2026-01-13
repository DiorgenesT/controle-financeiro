"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@/types";
import { getTransactions, addTransaction, deleteTransaction, getTransaction } from "@/lib/firestore";
import { updateAccountBalance } from "@/lib/accounts";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useTransactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) return;

        setLoading(true);
        const q = query(
            collection(db, "transactions"),
            where("userId", "==", user.uid),
            orderBy("date", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                boletoDueDate: doc.data().boletoDueDate?.toDate ? doc.data().boletoDueDate.toDate() : (doc.data().boletoDueDate ? new Date(doc.data().boletoDueDate) : undefined),
                purchaseDate: doc.data().purchaseDate?.toDate ? doc.data().purchaseDate.toDate() : (doc.data().purchaseDate ? new Date(doc.data().purchaseDate) : undefined),
            })) as Transaction[];
            setTransactions(data);
            setLoading(false);
        }, (error) => {
            console.error("Erro em tempo real (transações):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const add = async (data: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">): Promise<string> => {
        if (!user?.uid) throw new Error("Usuário não autenticado");
        const id = await addTransaction(user.uid, data);
        return id;
    };

    const remove = async (id: string) => {
        try {
            const transaction = await getTransaction(id);
            if (transaction && transaction.accountId) {
                if (transaction.type === "receita") {
                    await updateAccountBalance(transaction.accountId, transaction.amount, "subtract");
                } else if (transaction.type === "despesa") {
                    if (transaction.paymentMethod === "debit" || transaction.paymentMethod === "pix") {
                        await updateAccountBalance(transaction.accountId, transaction.amount, "add");
                    } else if (transaction.paymentMethod === "boleto" && transaction.boletoStatus === "paid") {
                        await updateAccountBalance(transaction.accountId, transaction.amount, "add");
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao reverter saldo:", error);
        }

        await deleteTransaction(id);
    };

    // Cálculos
    const receitas = transactions.filter(t => t.type === "receita");
    const despesas = transactions.filter(t => t.type === "despesa");

    // Filtrar transferências para não contar nos totais
    const receitasEfetivas = receitas.filter(t => t.category !== "Transferência");
    const despesasEfetivas = despesas.filter(t => t.category !== "Transferência");

    const totalReceitas = receitasEfetivas.reduce((sum, t) => sum + t.amount, 0);

    // Total de despesas efetivadas (saiu do saldo)
    // Ignora cartão de crédito e boletos pendentes
    const totalDespesas = despesasEfetivas
        .filter(t => {
            if (t.paymentMethod === "credit") return false;
            if (t.paymentMethod === "boleto" && t.boletoStatus === "pending") return false;
            return true;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const saldo = totalReceitas - totalDespesas;

    return {
        transactions,
        receitas,
        despesas,
        totalReceitas,
        totalDespesas,
        saldo,
        loading,
        error,
        add,
        remove,
        refresh: () => { }, // Mantido para compatibilidade, mas vazio
    };
}
