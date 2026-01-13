import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getGoals } from "@/lib/firestore";
import { Goal } from "@/types";
import { toast } from "sonner";

export function useGoals() {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGoals = useCallback(async () => {
        if (!user?.uid) {
            setGoals([]);
            setLoading(false);
            return;
        }

        try {
            const data = await getGoals(user.uid);
            setGoals(data);
        } catch (error) {
            console.error("Erro ao buscar metas:", error);
            toast.error("Erro ao carregar metas");
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    return { goals, loading, refetch: fetchGoals };
}
