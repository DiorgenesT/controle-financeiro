import { useState, useEffect } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";

export function useFinancialScore() {
    const { transactions, totalReceitas, totalDespesas, loading: loadingTransactions } = useTransactions();
    const { accounts, loading: loadingAccounts } = useAccounts();
    const [scoreData, setScoreData] = useState({
        score: 0,
        level: "Iniciante",
        details: {
            savingsScore: 0,
            stabilityScore: 0,
            growthScore: 0
        }
    });

    useEffect(() => {
        if (loadingTransactions || loadingAccounts) return;

        // 1. Savings Score (0-400)
        // Based on savings rate (Income - Expenses) / Income
        let savingsScore = 0;
        if (totalReceitas > 0) {
            const savingsRate = (totalReceitas - totalDespesas) / totalReceitas;
            if (savingsRate > 0) {
                // Max points at 40% savings rate
                savingsScore = Math.min(400, (savingsRate / 0.4) * 400);
            }
        }

        // 2. Stability Score (0-300)
        // Based on Emergency Fund (Total Balance / Monthly Expenses)
        let stabilityScore = 0;
        const totalBalance = accounts.reduce((acc, account) => acc + account.balance, 0);
        if (totalDespesas > 0) {
            const monthsOfRunway = totalBalance / totalDespesas;
            // Max points at 6 months of runway
            stabilityScore = Math.min(300, (monthsOfRunway / 6) * 300);
        } else if (totalBalance > 0) {
            // If no expenses but has balance, give some points
            stabilityScore = 150;
        }

        // 3. Growth Score (0-300)
        // Based on investment activity and consistency
        // For now, simple logic: if positive balance and recent transactions
        let growthScore = 0;
        if (totalBalance > 0) growthScore += 100;
        if (transactions.length > 5) growthScore += 100;
        if (totalReceitas > totalDespesas) growthScore += 100;

        const totalScore = Math.round(savingsScore + stabilityScore + growthScore);

        // Determine Level
        let level = "Crítico";
        if (totalScore >= 300) level = "Ruim";
        if (totalScore >= 500) level = "Razoável";
        if (totalScore >= 600) level = "Bom";
        if (totalScore >= 700) level = "Ótimo";
        if (totalScore >= 850) level = "Excelente";

        setScoreData({
            score: totalScore,
            level,
            details: {
                savingsScore,
                stabilityScore,
                growthScore
            }
        });

    }, [transactions, accounts, totalReceitas, totalDespesas, loadingTransactions, loadingAccounts]);

    return { scoreData, loading: loadingTransactions || loadingAccounts };
}
