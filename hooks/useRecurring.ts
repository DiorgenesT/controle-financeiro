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
        if (!user?.uid) {
            setRecurring([]);
            setLoading(false);
            return;
        }

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

    return {
        recurring,
        loading,
        addRecurringTransaction: (data: any) =>
            user?.uid ? addRecurringTransaction(user.uid, data) : Promise.reject("Usuário não autenticado"),
        updateRecurringTransaction,
        deleteRecurringTransaction
    };
}
