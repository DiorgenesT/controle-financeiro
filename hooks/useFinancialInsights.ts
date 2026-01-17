"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { useRecurring } from "@/hooks/useRecurring";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, subMonths, isSameMonth, startOfDay, endOfDay } from "date-fns";

export interface Insight {
    id: string;
    type: 'warning' | 'success' | 'info' | 'tip';
    title: string;
    description: string;
    priority: number; // 1 (High) to 3 (Low)
    icon?: string;
}

export function useFinancialInsights() {
    const { transactions, loading: loadingTransactions } = useTransactions();
    const { recurring, loading: loadingRecurring } = useRecurring();
    const { user } = useAuth();

    const insights = useMemo(() => {
        if (!user?.uid || loadingTransactions || loadingRecurring) return [];

        const generatedInsights: Insight[] = [];
        const today = new Date();
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        const lastMonthEnd = endOfMonth(subMonths(today, 1));

        // Helper to get total expenses for a period
        const getExpenses = (start: Date, end: Date) => {
            return transactions
                .filter(t =>
                    t.type === 'despesa' &&
                    t.date >= start &&
                    t.date <= end
                )
                .reduce((acc, t) => acc + t.amount, 0);
        };

        // Helper to get total income for a period
        const getIncome = (start: Date, end: Date) => {
            return transactions
                .filter(t =>
                    t.type === 'receita' &&
                    t.date >= start &&
                    t.date <= end
                )
                .reduce((acc, t) => acc + t.amount, 0);
        };

        const currentMonthExpenses = getExpenses(currentMonthStart, currentMonthEnd);
        const lastMonthExpenses = getExpenses(lastMonthStart, lastMonthEnd);
        const currentMonthIncome = getIncome(currentMonthStart, currentMonthEnd);

        // 1. Spending Spike Analysis
        if (lastMonthExpenses > 0) {
            const increase = ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
            if (increase > 20) {
                generatedInsights.push({
                    id: 'spending-spike',
                    type: 'warning',
                    title: 'Alerta de Gastos',
                    description: `Seus gastos aumentaram ${increase.toFixed(0)}% em relação ao mês passado.`,
                    priority: 1,
                    icon: 'TrendingUp'
                });
            } else if (increase < -10) {
                generatedInsights.push({
                    id: 'spending-drop',
                    type: 'success',
                    title: 'Economia',
                    description: `Parabéns! Você gastou ${Math.abs(increase).toFixed(0)}% a menos que no mês passado.`,
                    priority: 2,
                    icon: 'TrendingDown'
                });
            }
        }

        // 2. Fixed Expenses Ratio
        const fixedExpensesTotal = recurring
            .filter(r => r.type === 'despesa' && r.active)
            .reduce((acc, r) => acc + r.amount, 0);

        if (currentMonthIncome > 0) {
            const ratio = (fixedExpensesTotal / currentMonthIncome) * 100;
            if (ratio > 60) {
                generatedInsights.push({
                    id: 'fixed-ratio-high',
                    type: 'warning',
                    title: 'Comprometimento de Renda',
                    description: `Suas despesas fixas consomem ${ratio.toFixed(0)}% da sua renda. O ideal é até 50%.`,
                    priority: 1,
                    icon: 'AlertTriangle'
                });
            }
        }

        // 3. Category Analysis (Top Spender)
        const categoryTotals: Record<string, number> = {};
        transactions
            .filter(t => t.type === 'despesa' && isSameMonth(t.date, today))
            .forEach(t => {
                const cat = t.category || 'Outros';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
            });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a);

        if (sortedCategories.length > 0) {
            const [topCategory, amount] = sortedCategories[0];
            if (currentMonthExpenses > 0 && (amount / currentMonthExpenses) > 0.4) {
                generatedInsights.push({
                    id: 'top-category',
                    type: 'info',
                    title: 'Foco de Gastos',
                    description: `A categoria "${topCategory}" representa ${(amount / currentMonthExpenses * 100).toFixed(0)}% dos seus gastos este mês.`,
                    priority: 2,
                    icon: 'PieChart'
                });
            }
        }

        // 4. Generic Financial Tip (Randomized or Rotated)
        const tips = [
            "A regra 50/30/20 sugere: 50% para necessidades, 30% para desejos e 20% para poupança.",
            "Rever assinaturas mensais pode liberar um bom valor no seu orçamento anual.",
            "Tente criar uma reserva de emergência equivalente a 6 meses de despesas.",
            "Pagar a fatura total do cartão evita juros rotativos altíssimos."
        ];
        // Use day of year to rotate tips daily
        const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        const tipIndex = dayOfYear % tips.length;

        generatedInsights.push({
            id: 'daily-tip',
            type: 'tip',
            title: 'Dica Financeira',
            description: tips[tipIndex],
            priority: 3,
            icon: 'Lightbulb'
        });

        return generatedInsights.sort((a, b) => a.priority - b.priority);

    }, [transactions, recurring, user?.uid, loadingTransactions, loadingRecurring]);

    return {
        insights,
        loading: loadingTransactions || loadingRecurring
    };
}
