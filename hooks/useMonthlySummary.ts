"use client";

import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useFinancialScore } from "@/hooks/useFinancialScore";
import { useGoals } from "@/hooks/useGoals";
import { useRecurring } from "@/hooks/useRecurring";
import { startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { Goal } from "@/types";

export interface MonthlySummary {
    totalSpent: number;
    totalIncome: number;
    savingsRate: number;
    topCategory: { name: string; amount: number; percentage: number } | null;
    top3Categories: { name: string; amount: number; percentage: number }[];
    totalTransactions: number;
    biggestSpendingDay: { date: Date; amount: number } | null;
    financialVibe: { title: string; emoji: string; description: string; color: string };
    monthName: string;
    hasData: boolean;
    scoreData: { score: number; level: string } | null;
    goalsProgress: { active: number; completed: number; topGoal: Goal | null } | null;
    fixedCosts: { total: number; percentageOfIncome: number } | null;
}

export function useMonthlySummary(referenceDate?: Date) {
    const { transactions, loading: loadingTransactions } = useTransactions();
    const { scoreData, loading: loadingScore } = useFinancialScore();
    const { goals, loading: loadingGoals } = useGoals();
    const { recurring, loading: loadingRecurring } = useRecurring();

    const summary = useMemo<MonthlySummary | null>(() => {
        if (loadingTransactions || loadingScore || loadingGoals || loadingRecurring) return null;

        const today = referenceDate || new Date();
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);

        // Filter valid transactions for current month
        const monthlyTransactions = transactions.filter(t =>
            isSameMonth(t.date, today) &&
            !t.category?.toLowerCase().includes('transferência')
        );

        const income = monthlyTransactions
            .filter(t => t.type === 'receita')
            .reduce((acc, t) => acc + t.amount, 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'despesa')
            .reduce((acc, t) => acc + t.amount, 0);

        // Calculate Savings
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Calculate Top Categories (Top 3)
        const categoryTotals: Record<string, number> = {};
        monthlyTransactions
            .filter(t => t.type === 'despesa')
            .forEach(t => {
                const cat = t.category || 'Outros';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
            });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);

        const top3Categories = sortedCategories.slice(0, 3).map(([name, amount]) => ({
            name,
            amount,
            percentage: expenses > 0 ? (amount / expenses) * 100 : 0
        }));

        const topCategory = top3Categories.length > 0 ? top3Categories[0] : null;

        // Biggest Spending Day
        const dailyTotals: Record<string, number> = {};
        monthlyTransactions
            .filter(t => t.type === 'despesa')
            .forEach(t => {
                const day = new Date(t.date).toDateString();
                dailyTotals[day] = (dailyTotals[day] || 0) + t.amount;
            });

        let biggestSpendingDay = null;
        const sortedDays = Object.entries(dailyTotals).sort(([, a], [, b]) => b - a);
        if (sortedDays.length > 0) {
            biggestSpendingDay = {
                date: new Date(sortedDays[0][0]),
                amount: sortedDays[0][1]
            };
        }

        // Goals Logic
        const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
        const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);

        // Find a "Focus Goal" (highest priority/closest to completion or just first active)
        const sortedGoalsByProgress = [...activeGoals].sort((a, b) => {
            const progressA = a.currentAmount / a.targetAmount;
            const progressB = b.currentAmount / b.targetAmount;
            return progressB - progressA;
        });

        const goalsProgress = goals.length > 0 ? {
            active: activeGoals.length,
            completed: completedGoals.length,
            topGoal: sortedGoalsByProgress.length > 0 ? sortedGoalsByProgress[0] : null
        } : null;

        // Fixed Costs Logic (Recurring)
        const totalFixed = recurring
            .filter(r => r.type === 'despesa')
            .reduce((acc, r) => acc + r.amount, 0);

        const fixedCosts = totalFixed > 0 ? {
            total: totalFixed,
            percentageOfIncome: income > 0 ? (totalFixed / income) * 100 : 0
        } : null;


        // Determine "Financial Vibe"
        let vibe = { title: "Equilibrado", emoji: "⚖️", description: "Você mantém tudo sob controle.", color: "from-blue-500 to-cyan-500" };

        if (income === 0 && expenses === 0) {
            vibe = { title: "Fantasma", emoji: "👻", description: "Nenhuma movimentação este mês...", color: "from-gray-500 to-slate-500" };
        } else if (savingsRate >= 50) {
            vibe = { title: "Magnata", emoji: "🤑", description: "Você é uma máquina de poupar!", color: "from-emerald-500 to-green-500" };
        } else if (savingsRate >= 20) {
            vibe = { title: "Consciente", emoji: "🧠", description: "Gastos controlados, futuro garantido.", color: "from-teal-500 to-emerald-500" };
        } else if (savingsRate > 0) {
            vibe = { title: "No Limite", emoji: "😅", description: "Pagou as contas, mas sobrou pouco.", color: "from-amber-500 to-orange-500" };
        } else {
            vibe = { title: "Gastador", emoji: "💸", description: "Cuidado! Os gastos superaram a renda.", color: "from-red-500 to-pink-500" };
        }

        const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });

        return {
            totalSpent: expenses,
            totalIncome: income,
            savingsRate,
            topCategory,
            top3Categories,
            totalTransactions: monthlyTransactions.length,
            biggestSpendingDay,
            financialVibe: vibe,
            monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            hasData: monthlyTransactions.length > 0,
            scoreData: scoreData ? { score: scoreData.score, level: scoreData.level } : null,
            goalsProgress,
            fixedCosts
        };

    }, [transactions, scoreData, goals, recurring, loadingTransactions, loadingScore, loadingGoals, loadingRecurring, referenceDate]);

    return { summary, loading: loadingTransactions || loadingScore || loadingGoals || loadingRecurring };
}
