"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RecurringTransaction } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } from "@/lib/recurring";

export function useRecurring() {
    const { user } = useAuth();
    const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);

        const q = query(
            collection(db, "recurring_transactions"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {


            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate(),
                lastProcessedDate: doc.data().lastProcessedDate?.toDate(),
            })) as RecurringTransaction[];

            setRecurring(data);
            setLoading(false);
        }, (error) => {
            console.error("Erro em tempo real (fixas):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const refresh = async () => {
        if (!user?.uid) return;

        setLoading(true);
        try {
            // Importar getRecurringTransactions dinamicamente para evitar ciclo ou usar a query existente
            const { getDocs } = await import("firebase/firestore");
            const q = query(
                collection(db, "recurring_transactions"),
                where("userId", "==", user.uid)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate(),
                lastProcessedDate: doc.data().lastProcessedDate?.toDate(),
            })) as RecurringTransaction[];
            setRecurring(data);
        } catch (error) {
            console.error("Erro no refresh manual:", error);
        } finally {
            setLoading(false);
        }
    };

    return {
        recurring: user?.uid ? recurring : [],
        loading: user?.uid ? loading : false,
        addRecurringTransaction: (data: Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt" | "lastProcessedDate">) =>
            user?.uid ? addRecurringTransaction(user.uid, data) : Promise.reject("Usuário não autenticado"),
        updateRecurringTransaction,
        deleteRecurringTransaction,
        refresh
    };
}
