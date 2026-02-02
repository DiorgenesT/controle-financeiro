"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction } from "@/types";
import { getTransactions, addTransaction, deleteTransaction, getTransaction } from "@/lib/firestore";
import { updateAccountBalance } from "@/lib/accounts";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isSameMonth } from "date-fns";

export function useTransactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    const update = async (id: string, data: Partial<Transaction>) => {
        if (!user?.uid) throw new Error("Usuário não autenticado");

        // 1. Buscar transação antiga para reverter saldo
        const oldTransaction = await getTransaction(id);
        if (oldTransaction && oldTransaction.accountId) {
            // Reverter saldo antigo
            if (oldTransaction.type === "receita") {
                await updateAccountBalance(oldTransaction.accountId, oldTransaction.amount, "subtract");
            } else if (oldTransaction.type === "despesa") {
                if (oldTransaction.paymentMethod === "debit" || oldTransaction.paymentMethod === "pix") {
                    await updateAccountBalance(oldTransaction.accountId, oldTransaction.amount, "add");
                } else if (oldTransaction.paymentMethod === "boleto" && oldTransaction.boletoStatus === "paid") {
                    await updateAccountBalance(oldTransaction.accountId, oldTransaction.amount, "add");
                }
            }
        }

        // 2. Atualizar transação no Firestore
        // Importar updateTransaction dinamicamente ou adicionar ao import lá em cima
        const { updateTransaction } = await import("@/lib/firestore");
        await updateTransaction(id, data);

        // 3. Aplicar novo saldo
        // Precisamos dos dados completos (antigos + novos) para saber o novo saldo
        const newTransaction = { ...oldTransaction, ...data } as Transaction;

        if (newTransaction.accountId) {
            if (newTransaction.type === "receita") {
                await updateAccountBalance(newTransaction.accountId, newTransaction.amount, "add");
            } else if (newTransaction.type === "despesa") {
                if (newTransaction.paymentMethod === "debit" || newTransaction.paymentMethod === "pix") {
                    await updateAccountBalance(newTransaction.accountId, newTransaction.amount, "subtract");
                } else if (newTransaction.paymentMethod === "boleto" && newTransaction.boletoStatus === "paid") {
                    await updateAccountBalance(newTransaction.accountId, newTransaction.amount, "subtract");
                }
            }
        }
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

    // Cálculos - filtrar apenas transações do mês atual
    const today = new Date();
    const transactionsThisMonth = transactions.filter(t => isSameMonth(t.date, today));

    const receitas = transactionsThisMonth.filter(t => t.type === "receita");
    const despesas = transactionsThisMonth.filter(t => t.type === "despesa");

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
        transactions: user?.uid ? transactions : [],
        receitas: user?.uid ? receitas : [],
        despesas: user?.uid ? despesas : [],
        totalReceitas: user?.uid ? totalReceitas : 0,
        totalDespesas: user?.uid ? totalDespesas : 0,
        saldo: user?.uid ? saldo : 0,
        loading: user?.uid ? loading : false,
        error,
        add,
        update,
        remove,
        refresh: () => { }, // Mantido para compatibilidade, mas vazio
    };
}
