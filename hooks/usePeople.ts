"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Person } from "@/types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addPerson, deletePerson } from "@/lib/people";

export function usePeople() {
    const { user } = useAuth();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setPeople([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, "people"),
            where("userId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Person[];

            setPeople(data);
            setLoading(false);
        }, (error) => {
            console.error("Erro em tempo real (pessoas):", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    return {
        people,
        loading,
        addPerson,
        deletePerson
    };
}
