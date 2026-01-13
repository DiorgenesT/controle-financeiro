"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Account } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createAccount, updateAccount, deleteAccount } from "@/lib/accounts";

export function useAccounts() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setAccounts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "accounts"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate(),
            })) as Account[];

            setAccounts(data);
            setLoading(false);
        }, (error) => {
            console.error("Erro em tempo real (contas):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    return {
        accounts,
        loading,
        createAccount: (data: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">) =>
            user?.uid ? createAccount(user.uid, data) : Promise.reject("Usuário não autenticado"),
        updateAccount,
        deleteAccount
    };
}
